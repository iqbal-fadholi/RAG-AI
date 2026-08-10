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
import { listDocuments, deleteDocument } from '../../../libraries/db/documents.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  '/start',
  upload.single('file'),
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new AppError('BadRequest', 400, 'No file uploaded');
    }

    const thread_id = uuidv4();
    const graphConfig = { configurable: { thread_id } };

    const { buffer, mimetype, originalname } = req.file;

    await ingestionGraph.invoke(
      { fileBuffer: buffer, fileName: originalname, mimeType: mimetype },
      graphConfig
    );

    res.json({ message: 'Ingestion started, waiting for review', thread_id });
  })
);

router.get(
  '/status/:thread_id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { thread_id } = getStatusSchema.parse(req.params);
    const graphConfig = { configurable: { thread_id } };

    const state = await ingestionGraph.getState(graphConfig);
    if (!state || !state.values) {
      throw new AppError('NotFound', 404, 'Thread not found or no state available');
    }

    res.json({
      status: state.values.reviewStatus,
      fileName: state.values.fileName,
      extractedMarkdown: state.values.extractedMarkdown,
      next: state.next,
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

export { router as ingestionRoutes };
