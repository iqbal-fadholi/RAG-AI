import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import type { PoolConfig } from 'pg';
import { config } from '../config/index.js';
import { pool } from './checkpoint.js';
import { getEmbeddings, getEmbeddingDimensions } from '../llm/llmFactory.js';

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

  const embeddings = getEmbeddings();
  const dimensions = getEmbeddingDimensions();

  // Check if documents table exists and verify dimension alignment
  try {
    const colRes = await pool.query(`
      SELECT atttypmod 
      FROM pg_attribute 
      WHERE attrelid = 'documents'::regclass 
        AND attname = 'embedding' 
        AND NOT attisdropped;
    `);

    if (colRes.rows.length > 0) {
      const existingDim = colRes.rows[0].atttypmod;
      if (existingDim > 0 && existingDim !== dimensions) {
        console.warn(
          `⚠️ Warning: "documents" table has vector dimension ${existingDim}, but current config expects ${dimensions}. If re-indexing with new provider, recreate or truncate the table.`
        );
      }
    }
  } catch (_err) {
    // Table may not exist yet, PGVectorStore.initialize will create it
  }

  vectorStore = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: dbConfig,
    tableName: 'documents',
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'page_content',
      metadataColumnName: 'metadata',
    },
    dimensions,
  });

  // HNSW index in pgvector supports dimensions up to 2000 (e.g. OpenAI 1536 dims)
  if (dimensions <= 2000) {
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS documents_embedding_hnsw_idx 
        ON documents USING hnsw (embedding vector_cosine_ops) 
        WITH (m = 24, ef_construction = 100);
      `);
    } catch (idxErr) {
      console.warn('HNSW index creation note:', idxErr);
    }
  }

  return vectorStore;
};

