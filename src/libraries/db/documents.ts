import { pool } from './checkpoint.js';

export const setupDocumentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id UUID PRIMARY KEY,
      filename TEXT NOT NULL,
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
