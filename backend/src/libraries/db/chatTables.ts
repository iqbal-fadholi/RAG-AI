import { pool } from './checkpoint.js';

export const setupChatTables = async () => {
  const client = await pool.connect();
  try {
    // Acquire PostgreSQL advisory lock to prevent race conditions during migration
    await client.query('SELECT pg_advisory_lock(83920174)');

    // Create conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversation_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
        content TEXT NOT NULL,
        sources JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_user_id_updated ON conversations(user_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv_id_created ON conversation_messages(conversation_id, created_at ASC);
    `);
  } catch (error) {
    console.error('Error setting up chat tables:', error);
    throw error;
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(83920174)');
    } catch (_) {}
    client.release();
  }
};
