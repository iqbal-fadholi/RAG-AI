import { pool } from '../../../libraries/db/checkpoint.js';
import { v4 as uuidv4 } from 'uuid';

export interface DbConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'ai';
  content: string;
  sources: any[];
  created_at: string;
}

/**
 * List all conversations for a specific user, ordered by most recently active first.
 */
export const listUserConversations = async (userId: string): Promise<DbConversation[]> => {
  const result = await pool.query(
    `SELECT id, user_id, title, created_at, updated_at
     FROM conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Get a specific conversation along with all its messages if the user owns it.
 */
export const getConversationDetails = async (conversationId: string, userId: string): Promise<{ conversation: DbConversation; messages: DbMessage[] } | null> => {
  const convResult = await pool.query(
    `SELECT id, user_id, title, created_at, updated_at
     FROM conversations
     WHERE id = $1 AND user_id = $2`,
    [conversationId, userId]
  );

  if (convResult.rows.length === 0) {
    return null;
  }

  const msgResult = await pool.query(
    `SELECT id, conversation_id, role, content, sources, created_at
     FROM conversation_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );

  return {
    conversation: convResult.rows[0],
    messages: msgResult.rows.map((row) => ({
      ...row,
      sources: typeof row.sources === 'string' ? JSON.parse(row.sources) : (row.sources || []),
    })),
  };
};

/**
 * Ensure a conversation exists for a user. If not, create it.
 */
export const ensureConversation = async (conversationId: string, userId: string, initialTitle?: string): Promise<DbConversation> => {
  const existing = await pool.query(
    `SELECT id, user_id, title, created_at, updated_at
     FROM conversations
     WHERE id = $1`,
    [conversationId]
  );

  if (existing.rows.length > 0) {
    // If it exists, make sure user owns it
    if (existing.rows[0].user_id !== userId) {
      throw new Error('Unauthorized conversation access');
    }
    // Update updated_at timestamp
    const updated = await pool.query(
      `UPDATE conversations
       SET updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, title, created_at, updated_at`,
      [conversationId]
    );
    return updated.rows[0];
  }

  // Create new conversation
  const title = initialTitle && initialTitle.trim()
    ? (initialTitle.trim().length > 60 ? initialTitle.trim().slice(0, 57) + '...' : initialTitle.trim())
    : 'New Conversation';

  const created = await pool.query(
    `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING id, user_id, title, created_at, updated_at`,
    [conversationId, userId, title]
  );

  return created.rows[0];
};

/**
 * Save a message (user or ai) into a conversation.
 */
export const saveConversationMessage = async (
  conversationId: string,
  role: 'user' | 'ai',
  content: string,
  sources: any[] = []
): Promise<DbMessage> => {
  const messageId = uuidv4();
  const sourcesJson = JSON.stringify(sources || []);

  const result = await pool.query(
    `INSERT INTO conversation_messages (id, conversation_id, role, content, sources, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
     RETURNING id, conversation_id, role, content, sources, created_at`,
    [messageId, conversationId, role, content, sourcesJson]
  );

  // Touch conversation updated_at
  await pool.query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );

  return {
    ...result.rows[0],
    sources: sources || [],
  };
};

/**
 * Rename a conversation title.
 */
export const renameConversation = async (conversationId: string, userId: string, newTitle: string): Promise<DbConversation | null> => {
  const cleanTitle = newTitle.trim();
  if (!cleanTitle) {
    throw new Error('Conversation title cannot be empty');
  }

  const result = await pool.query(
    `UPDATE conversations
     SET title = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING id, user_id, title, created_at, updated_at`,
    [cleanTitle, conversationId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};

/**
 * Delete a conversation (messages will cascade delete).
 */
export const deleteConversation = async (conversationId: string, userId: string): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM conversations
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [conversationId, userId]
  );

  return (result.rowCount ?? 0) > 0;
};
