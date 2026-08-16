import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../../libraries/db/checkpoint.js';
import { config } from '../../../libraries/config/index.js';

export interface UserPayload {
  userId: string;
  email: string;
  displayName: string;
  roleId: string;
  roleName: string;
  pages: string[];
  allowedTagIds: string[];
}

async function getUserPayload(userId: string): Promise<UserPayload | null> {
  const userResult = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.role_id, r.name as role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) return null;

  const user = userResult.rows[0];

  // Fetch page permissions for the user's role
  const permResult = await pool.query(
    `SELECT page FROM role_permissions WHERE role_id = $1`,
    [user.role_id]
  );
  const pages = permResult.rows.map((r: any) => r.page);

  // Fetch allowed tag IDs for the user's role
  const tagResult = await pool.query(
    `SELECT tag_id FROM role_tags WHERE role_id = $1`,
    [user.role_id]
  );
  const allowedTagIds = tagResult.rows.map((r: any) => r.tag_id);

  return {
    userId: user.id,
    email: user.email,
    displayName: user.display_name || '',
    roleId: user.role_id,
    roleName: user.role_name,
    pages,
    allowedTagIds,
  };
}

export async function registerUser(email: string, password: string, displayName: string) {
  // Check if user already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Get default viewer role
  const viewerRole = await pool.query("SELECT id FROM roles WHERE name = 'viewer'");
  if (viewerRole.rows.length === 0) {
    throw new Error('Default viewer role not found. Please run database migrations.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, display_name, role_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    [email, passwordHash, displayName, viewerRole.rows[0].id]
  );

  return { userId: result.rows[0].id };
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: UserPayload }> {
  const userResult = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);

  if (userResult.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = userResult.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const payload = await getUserPayload(user.id);
  if (!payload) {
    throw new Error('User profile not found');
  }

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

  return { token, user: payload };
}

export async function getProfile(userId: string): Promise<UserPayload | null> {
  return getUserPayload(userId);
}
