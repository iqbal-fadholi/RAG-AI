import { pool } from './checkpoint.js';

export const setupDocumentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id UUID PRIMARY KEY,
      filename TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      s3_key TEXT,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      extracted_markdown TEXT
    );
  `;
  await pool.query(query);

  // Migration: add column if it doesn't exist
  try {
    await pool.query('ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS extracted_markdown TEXT');
  } catch (err) {
    console.error('Error adding extracted_markdown column:', err);
  }
};

export const listDocuments = async (allowedTagIds?: string[]) => {
  if (!allowedTagIds) {
    // No OBAC filtering (e.g., admin)
    const result = await pool.query(`
      SELECT uf.*, COALESCE(
        json_agg(json_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL), '[]'
      ) as tags
      FROM uploaded_files uf
      LEFT JOIN document_tags dt ON uf.id = dt.document_id
      LEFT JOIN tags t ON dt.tag_id = t.id
      GROUP BY uf.id
      ORDER BY uf.uploaded_at DESC
    `);
    return result.rows;
  }

  // OBAC: return untagged docs + docs with matching tags
  const result = await pool.query(`
    SELECT uf.*, COALESCE(
      json_agg(json_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL), '[]'
    ) as tags
    FROM uploaded_files uf
    LEFT JOIN document_tags dt ON uf.id = dt.document_id
    LEFT JOIN tags t ON dt.tag_id = t.id
    GROUP BY uf.id
    HAVING
      COUNT(dt.tag_id) = 0  -- untagged documents (accessible to all)
      OR ($1::uuid[] IS NOT NULL AND COUNT(dt.tag_id) FILTER (WHERE dt.tag_id = ANY($1::uuid[])) > 0)  -- docs with matching tags
    ORDER BY uf.uploaded_at DESC
  `, [allowedTagIds.length > 0 ? allowedTagIds : null]);
  return result.rows;
};

export const deleteDocument = async (id: string) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Delete from uploaded_files
    await client.query('DELETE FROM uploaded_files WHERE id = $1', [id]);
    
    // 2. Delete the associated vector chunks from the documents table
    // pgvector's PGVectorStore uses a table named 'documents' by default
    // We check if the JSONB metadata column contains the file_id
    await client.query("DELETE FROM documents WHERE metadata->>'file_id' = $1", [id]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export interface KeywordSearchResult {
  id: string;
  page_content: string;
  metadata: any;
}

export const keywordSearch = async (query: string, limit: number = 10, allowedTagIds?: string[]): Promise<KeywordSearchResult[]> => {
  if (!allowedTagIds) {
    // No OBAC filtering
    const sql = `
      SELECT id, page_content, metadata, 
             ts_rank(to_tsvector('english', page_content), plainto_tsquery('english', $1)) as rank
      FROM documents
      WHERE to_tsvector('english', page_content) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT $2;
    `;
    const result = await pool.query(sql, [query, limit]);
    return result.rows;
  }

  // OBAC: strict SQL-level filter
  // Include chunks from: untagged files OR files with matching tags
  const sql = `
    SELECT d.id, d.page_content, d.metadata,
           ts_rank(to_tsvector('english', d.page_content), plainto_tsquery('english', $1)) as rank
    FROM documents d
    WHERE to_tsvector('english', d.page_content) @@ plainto_tsquery('english', $1)
      AND (
        -- File has no tags (accessible to everyone)
        NOT EXISTS (
          SELECT 1 FROM document_tags dt WHERE dt.document_id = (d.metadata->>'file_id')::uuid
        )
        OR
        -- File has at least one tag matching user's allowed tags
        EXISTS (
          SELECT 1 FROM document_tags dt
          WHERE dt.document_id = (d.metadata->>'file_id')::uuid
            AND dt.tag_id = ANY($3::uuid[])
        )
      )
    ORDER BY rank DESC
    LIMIT $2;
  `;
  const result = await pool.query(sql, [query, limit, allowedTagIds]);
  return result.rows;
};

export const updateDocumentStatus = async (id: string, status: string) => {
  await pool.query('UPDATE uploaded_files SET status = $1 WHERE id = $2', [status, id]);
};

export const getDocumentStatus = async (id: string): Promise<string | null> => {
  const result = await pool.query('SELECT status FROM uploaded_files WHERE id = $1', [id]);
  return result.rows[0]?.status || null;
};

export const getDocumentById = async (id: string) => {
  const result = await pool.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export interface ChunkResult {
  id: string;
  page_content: string;
  metadata: any;
}

export const getChunksByFileId = async (fileId: string): Promise<ChunkResult[]> => {
  const result = await pool.query(
    `SELECT id, page_content, metadata FROM documents WHERE metadata->>'file_id' = $1 ORDER BY (metadata->>'chunk_index')::int ASC NULLS LAST`,
    [fileId]
  );
  return result.rows;
};

export const updateDocumentMarkdown = async (id: string, markdown: string) => {
  await pool.query('UPDATE uploaded_files SET extracted_markdown = $1 WHERE id = $2', [markdown, id]);
};

// ===== OBAC Tag Helpers =====

/**
 * Get or create tags by name. Returns tag objects with id and name.
 */
export const getOrCreateTags = async (tagNames: string[]): Promise<{ id: string; name: string }[]> => {
  if (!tagNames || tagNames.length === 0) return [];

  const tags: { id: string; name: string }[] = [];
  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) continue;

    const result = await pool.query(
      `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`,
      [trimmed]
    );
    tags.push(result.rows[0]);
  }
  return tags;
};

/**
 * Assign tags to a document (many-to-many).
 */
export const setDocumentTags = async (documentId: string, tagIds: string[]) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM document_tags WHERE document_id = $1', [documentId]);
    for (const tagId of tagIds) {
      await client.query(
        `INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [documentId, tagId]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get file IDs accessible to a user based on their allowed tag IDs.
 * Returns file IDs that are either untagged OR have at least one matching tag.
 */
export const getAccessibleFileIds = async (allowedTagIds: string[]): Promise<string[]> => {
  const result = await pool.query(`
    SELECT uf.id FROM uploaded_files uf
    WHERE
      NOT EXISTS (SELECT 1 FROM document_tags dt WHERE dt.document_id = uf.id)  -- untagged
      OR EXISTS (
        SELECT 1 FROM document_tags dt
        WHERE dt.document_id = uf.id AND dt.tag_id = ANY($1::uuid[])
      )  -- has matching tag
  `, [allowedTagIds]);
  return result.rows.map((r: any) => r.id);
};

/**
 * List all tags.
 */
export const listTags = async () => {
  const result = await pool.query('SELECT id, name, created_at FROM tags ORDER BY name ASC');
  return result.rows;
};
