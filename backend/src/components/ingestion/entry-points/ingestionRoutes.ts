import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { asyncWrapper } from '../../../libraries/error-handling/asyncWrapper.js';
import { AppError } from '../../../libraries/error-handling/AppError.js';
import { ingestionGraph } from '../domain/ingestionGraph.js';
import {
  editMarkdownSchema,
  getStatusSchema,
  editStatusSchema,
  approveStatusSchema,
} from '../domain/ingestionSchema.js';
import { listDocuments, deleteDocument, updateDocumentStatus, getDocumentStatus, getDocumentById, getChunksByFileId, updateDocumentMarkdown, getOrCreateTags, setDocumentTags, listTags } from '../../../libraries/db/documents.js';
import { uploadFileToS3, getFileFromS3 } from '../../../libraries/storage/s3.js';
import { ingestionQueue } from '../../../libraries/queue/ingestionQueue.js';
import { pool } from '../../../libraries/db/checkpoint.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  '/start',
  upload.single('file'),
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    console.log('[API] /ingest/start called');
    if (!req.file) {
      console.log('[API] /ingest/start error: No file uploaded');
      throw new AppError('BadRequest', 400, 'No file uploaded');
    }

    const thread_id = uuidv4();
    const { buffer, mimetype, originalname } = req.file;
    console.log(`[API] Processing file: ${originalname} (${mimetype})`);

    // Parse tags from form data (comma-separated string or JSON array)
    let tagNames: string[] = [];
    if (req.body.tags) {
      try {
        tagNames = JSON.parse(req.body.tags);
      } catch {
        tagNames = req.body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    }

    // Save to MinIO
    const s3_key = `${thread_id}-${originalname}`;
    console.log(`[API] Uploading to MinIO: ${s3_key}`);
    await uploadFileToS3(s3_key, buffer, mimetype);

    console.log(`[API] Saving to Postgres: ${thread_id}`);
    // Save to Postgres with uploaded_by
    const uploadedBy = req.user?.userId || null;
    await pool.query(
      `INSERT INTO uploaded_files (id, filename, status, s3_key, uploaded_by) VALUES ($1, $2, $3, $4, $5)`,
      [thread_id, originalname, 'queued', s3_key, uploadedBy]
    );

    // Handle tags: create new ones if needed, then assign to document
    if (tagNames.length > 0) {
      const tags = await getOrCreateTags(tagNames);
      await setDocumentTags(thread_id, tags.map(t => t.id));
      console.log(`[API] Assigned tags: ${tags.map(t => t.name).join(', ')}`);
    }

    console.log(`[API] Enqueueing to BullMQ: ${thread_id}`);
    // Enqueue job
    await ingestionQueue.add('ingest', {
      thread_id,
      s3_key,
      fileName: originalname,
      mimeType: mimetype,
    });

    console.log(`[API] Returning 200: ${thread_id}`);
    res.json({ message: 'Ingestion queued', thread_id });
  })
);

router.get(
  '/status/:thread_id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { thread_id } = getStatusSchema.parse(req.params);
    
    const doc = await getDocumentById(thread_id);
    if (!doc) {
      throw new AppError('NotFound', 404, 'Thread not found');
    }
    const dbStatus = doc.status;

    let reviewStatus = dbStatus;
    let fileName = doc.filename || '';
    let extractedMarkdown = doc.extracted_markdown || '';
    let next: string[] = [];

    // If it's reached the graph, try fetching the graph state
    if (['pending_review', 'approved', 'done'].includes(dbStatus)) {
      const graphConfig = { configurable: { thread_id } };
      const state = await ingestionGraph.getState(graphConfig);
      
      if (state && state.values) {
        let s = state.values.reviewStatus || dbStatus;
        if (s === 'pending') s = 'pending_review';
        reviewStatus = s;
        fileName = state.values.fileName || fileName;
        if (!extractedMarkdown) {
          extractedMarkdown = state.values.extractedMarkdown || '';
          if (extractedMarkdown) {
            await updateDocumentMarkdown(thread_id, extractedMarkdown);
          }
        }
        next = state.next || [];
      }
    }

    res.json({
      status: reviewStatus,
      fileName,
      extractedMarkdown,
      next,
    });
  })
);

router.post(
  '/edit/:thread_id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { thread_id } = editStatusSchema.parse(req.params);
    const { markdown } = editMarkdownSchema.parse(req.body);

    const graphConfig = { configurable: { thread_id } };
    await ingestionGraph.updateState(graphConfig, { extractedMarkdown: markdown });
    await updateDocumentMarkdown(thread_id, markdown);

    res.json({ message: 'Markdown updated successfully' });
  })
);

router.post(
  '/approve/:thread_id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { thread_id } = approveStatusSchema.parse(req.params);
    const graphConfig = { configurable: { thread_id } };

    await ingestionGraph.updateState(graphConfig, { reviewStatus: 'approved' }, 'humanReviewNode');
    await ingestionGraph.invoke(null, graphConfig);

    res.json({ message: 'Document approved and processed' });
  })
);

router.get(
  '/files',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    // OBAC: filter files by user's allowed tags
    // Admin role users (with 'admin' page) see all files
    const isAdmin = req.user?.pages?.includes('admin');
    const allowedTagIds = isAdmin ? undefined : (req.user?.allowedTagIds || []);
    const files = await listDocuments(allowedTagIds);
    res.json(files);
  })
);

router.get(
  '/tags',
  asyncWrapper(async (_req: Request, res: Response): Promise<void> => {
    const tags = await listTags();
    res.json(tags);
  })
);

router.delete(
  '/files/:id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await deleteDocument(id);
    res.json({ message: 'Document and its vector chunks deleted successfully' });
  })
);

router.get(
  '/files/:id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const doc = await getDocumentById(id);
    if (!doc) {
      throw new AppError('NotFound', 404, 'Document not found');
    }
    // Enrich with graph state if available (for extracted markdown)
    let extractedMarkdown = doc.extracted_markdown || '';
    if (!extractedMarkdown && ['pending_review', 'approved', 'done'].includes(doc.status)) {
      try {
        const graphConfig = { configurable: { thread_id: id } };
        const state = await ingestionGraph.getState(graphConfig);
        if (state && state.values) {
          extractedMarkdown = state.values.extractedMarkdown || '';
          if (extractedMarkdown) {
            await updateDocumentMarkdown(id, extractedMarkdown);
          }
        }
      } catch (_) {
        // graph state may not exist yet — that's fine
      }
    }
    res.json({ ...doc, extractedMarkdown });
  })
);

router.get(
  '/files/:id/chunks',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const chunks = await getChunksByFileId(id);
    res.json(chunks);
  })
);

router.get(
  '/files/:id/download',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const doc = await getDocumentById(id);
    if (!doc) {
      throw new AppError('NotFound', 404, 'Document not found');
    }
    if (!doc.s3_key) {
      throw new AppError('BadRequest', 400, 'No file available for download');
    }

    const fileBuffer = await getFileFromS3(doc.s3_key);
    const filename = doc.filename || 'download';

    // Determine content type from filename extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      md: 'text/markdown',
      csv: 'text/csv',
      json: 'application/json',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    const contentType = (ext && mimeTypes[ext]) || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  })
);

export { router as ingestionRoutes };
