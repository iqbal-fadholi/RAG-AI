import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { ingestionGraph, executeChunkAndSave } from '../../components/ingestion/domain/ingestionGraph.js';
import { getFileFromS3 } from '../storage/s3.js';
import { updateDocumentStatus } from '../db/documents.js';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

export const ingestionQueue = new Queue('ingestion-queue', { connection });

export interface ParseJobData {
  thread_id: string;
  s3_key: string;
  fileName: string;
  mimeType: string;
}

export interface ChunkAndSaveJobData {
  thread_id: string;
  fileName: string;
  markdown: string;
}

export type IngestionJobData = ParseJobData | ChunkAndSaveJobData;

export const queueChunkAndSave = async (thread_id: string, fileName: string, markdown: string) => {
  return await ingestionQueue.add(
    'chunk-and-save',
    { thread_id, fileName, markdown },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};

export const initWorker = () => {
  const worker = new Worker<IngestionJobData>(
    'ingestion-queue',
    async (job: Job<IngestionJobData>) => {
      if (job.name === 'chunk-and-save') {
        const { thread_id, fileName, markdown } = job.data as ChunkAndSaveJobData;
        console.log(`[Worker] Processing chunk-and-save for job ${job.id} (${fileName})...`);
        try {
          await executeChunkAndSave(thread_id, fileName, markdown);
        } catch (error) {
          console.error(`[Worker] chunk-and-save job ${job.id} failed:`, error);
          await updateDocumentStatus(thread_id, 'error');
          throw error;
        }
        return;
      }

      // Default: Initial Ingestion & Text Extraction
      const { thread_id, s3_key, fileName, mimeType } = job.data as ParseJobData;
      
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
        console.error(`[Worker] Ingest job ${job.id} failed:`, error);
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
      console.error(`[Worker] Job ${job.id} (${job.name}) has failed after all retries with ${err.message}`);
    }
  });

  return worker;
};
