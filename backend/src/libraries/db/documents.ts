import { pool } from './checkpoint.js';

export const setupDocumentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id UUID PRIMARY KEY,
      filename TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      s3_key TEXT,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};

export const listDocuments = async () => {
  const result = await pool.query('SELECT * FROM uploaded_files ORDER BY uploaded_at DESC');
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

export const keywordSearch = async (query: string, limit: number = 10): Promise<KeywordSearchResult[]> => {
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
};

export const updateDocumentStatus = async (id: string, status: string) => {
  await pool.query('UPDATE uploaded_files SET status = $1 WHERE id = $2', [status, id]);
};

export const getDocumentStatus = async (id: string): Promise<string | null> => {
  const result = await pool.query('SELECT status FROM uploaded_files WHERE id = $1', [id]);
  return result.rows[0]?.status || null;
};
