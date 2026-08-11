import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { ingestionGraph } from '../../components/ingestion/domain/ingestionGraph.js';
import { getFileFromS3 } from '../storage/s3.js';
import { updateDocumentStatus } from '../db/documents.js';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

export const ingestionQueue = new Queue('ingestion-queue', { connection });

interface IngestionJobData {
  thread_id: string;
  s3_key: string;
  fileName: string;
  mimeType: string;
}

export const initWorker = () => {
  const worker = new Worker<IngestionJobData>(
    'ingestion-queue',
    async (job: Job<IngestionJobData>) => {
      const { thread_id, s3_key, fileName, mimeType } = job.data;
      
      try {
        await updateDocumentStatus(thread_id, 'processing');
        
        // 1. Download file from S3
        const fileBuffer = await getFileFromS3(s3_key);
        
        // 2. Invoke LangGraph
        const graphConfig = { configurable: { thread_id } };
        await ingestionGraph.invoke(
          { fileBuffer, fileName, mimeType },
          graphConfig
        );
        
        // LangGraph interrupts at humanReviewNode. Wait for approval.
        await updateDocumentStatus(thread_id, 'pending_review');

      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        await updateDocumentStatus(thread_id, 'error');
        throw error;
      }
    },
    { 
      connection, 
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1', 10) 
    }
  );

  worker.on('failed', (job: Job<IngestionJobData> | undefined, err: Error) => {
    if (job) {
      console.error(`${job.id} has failed with ${err.message}`);
    }
  });

  return worker;
};
