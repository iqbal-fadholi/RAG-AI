import { pool } from './checkpoint.js';
import bcrypt from 'bcryptjs';

export const setupAuthTables = async () => {
  const client = await pool.connect();
  try {
    // Acquire PostgreSQL advisory lock to ensure only one migration/setup runs across connections
    await client.query('SELECT pg_advisory_lock(74291482)');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        page TEXT NOT NULL,
        UNIQUE(role_id, page)
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        role_id UUID REFERENCES roles(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS role_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(role_id, tag_id)
      );

      CREATE TABLE IF NOT EXISTS document_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES uploaded_files(id) ON DELETE CASCADE,
        tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(document_id, tag_id)
      );
    `);

    // Migration: add uploaded_by column if it doesn't exist
    try {
      await client.query('ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id)');
    } catch (err) {
      console.error('Error adding uploaded_by column:', err);
    }

    // Seed system roles if they don't exist
    await seedSystemData(client);
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(74291482)');
    } catch (_) {}
    client.release();
  }
};

async function seedSystemData(client: any) {
  try {
    await client.query('BEGIN');

    // Seed admin role
    const adminRoleResult = await client.query(
      `INSERT INTO roles (name, description, is_system) VALUES ('admin', 'System administrator with full access', true)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`
    );
    const adminRoleId = adminRoleResult.rows[0].id;

    // Seed viewer role
    const viewerRoleResult = await client.query(
      `INSERT INTO roles (name, description, is_system) VALUES ('viewer', 'Default role with chat access only', true)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`
    );
    const viewerRoleId = viewerRoleResult.rows[0].id;

    // Seed admin role permissions
    const adminPages = ['chat', 'ingest', 'admin'];
    for (const page of adminPages) {
      await client.query(
        `INSERT INTO role_permissions (role_id, page) VALUES ($1, $2) ON CONFLICT (role_id, page) DO NOTHING`,
        [adminRoleId, page]
      );
    }

    // Seed viewer role permissions
    await client.query(
      `INSERT INTO role_permissions (role_id, page) VALUES ($1, 'chat') ON CONFLICT (role_id, page) DO NOTHING`,
      [viewerRoleId]
    );

    // Seed default admin user (admin@rag.local / changeme)
    const existingAdmin = await client.query(`SELECT id FROM users WHERE email = 'admin@rag.local'`);
    if (existingAdmin.rows.length === 0) {
      const passwordHash = await bcrypt.hash('changeme', 12);
      await client.query(
        `INSERT INTO users (email, password_hash, display_name, role_id) VALUES ($1, $2, $3, $4)`,
        ['admin@rag.local', passwordHash, 'Administrator', adminRoleId]
      );
      console.log('Default admin user created: admin@rag.local / changeme');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

