import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import type { PoolConfig } from 'pg';
import { config } from '../config/index.js';
import { pool } from './checkpoint.js';

const dbConfig: PoolConfig = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
};

let vectorStore: PGVectorStore | null = null;

export const getVectorStore = async (): Promise<PGVectorStore> => {
  if (vectorStore) {
    return vectorStore;
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.googleApiKey,
    modelName: 'gemini-embedding-2',
  });

  vectorStore = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: dbConfig,
    tableName: 'documents',
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'page_content',
      metadataColumnName: 'metadata',
    },
    dimensions: 3072,
  });

  // Disable HNSW index for now since 3072 dimensions exceeds the 2000 limit
  // await pool.query(`
  //   CREATE INDEX IF NOT EXISTS documents_embedding_hnsw_idx 
  //   ON documents USING hnsw (embedding vector_cosine_ops) 
  //   WITH (m = 24, ef_construction = 100);
  // `);

  return vectorStore;
};
