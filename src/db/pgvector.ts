import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import type { PoolConfig } from 'pg';
import { config } from '../config.js';

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

  // PGVectorStore handles connection, creating the table and extension
  vectorStore = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: dbConfig,
    tableName: 'documents',
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'page_content',
      metadataColumnName: 'metadata',
    },
    // The dimension of gemini-embedding-2 is 3072
    dimensions: 3072,
  });

  return vectorStore;
};
