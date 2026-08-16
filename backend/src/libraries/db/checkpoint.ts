import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import pg from 'pg';
import { config } from '../config/index.js';

export const pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

import { setupDocumentsTable } from './documents.js';
import { setupAuthTables } from './authTables.js';
import { setupChatTables } from './chatTables.js';

let setupPromise: Promise<PostgresSaver> | null = null;

export const getPostgresSaver = async (): Promise<PostgresSaver> => {
  if (!setupPromise) {
    setupPromise = (async () => {
      const checkpointer = new PostgresSaver(pool);
      await checkpointer.setup(); // Creates the necessary tables if they don't exist
      await setupDocumentsTable(); // Creates our custom uploaded_files table
      await setupAuthTables(); // Creates auth/RBAC/OBAC tables and seeds data
      await setupChatTables(); // Creates conversations and conversation_messages tables
      return checkpointer;
    })().catch((err) => {
      setupPromise = null; // Reset so retries are possible if failed
      throw err;
    });
  }
  return setupPromise;
};


