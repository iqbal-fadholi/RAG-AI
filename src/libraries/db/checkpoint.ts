import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

export const getPostgresSaver = async () => {
  const checkpointer = new PostgresSaver(pool);
  await checkpointer.setup(); // Creates the necessary tables if they don't exist
  return checkpointer;
};
