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
import { listDocuments, deleteDocument, updateDocumentStatus, getDocumentStatus, getDocumentById, getChunksByFileId, updateDocumentMarkdown } from '../../../libraries/db/documents.js';
import { uploadFileToS3 } from '../../../libraries/storage/s3.js';
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

    // Save to MinIO
    const s3_key = `${thread_id}-${originalname}`;
    console.log(`[API] Uploading to MinIO: ${s3_key}`);
    await uploadFileToS3(s3_key, buffer, mimetype);

    console.log(`[API] Saving to Postgres: ${thread_id}`);
    // Save to Postgres
    await pool.query(
      `INSERT INTO uploaded_files (id, filename, status, s3_key) VALUES ($1, $2, $3, $4)`,
      [thread_id, originalname, 'queued', s3_key]
    );

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
    const files = await listDocuments();
    res.json(files);
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

export { router as ingestionRoutes };
