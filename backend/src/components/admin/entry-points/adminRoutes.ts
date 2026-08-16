import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncWrapper } from '../../../libraries/error-handling/asyncWrapper.js';
import { AppError } from '../../../libraries/error-handling/AppError.js';
import { pool } from '../../../libraries/db/checkpoint.js';

const router = Router();

// ===== ROLES =====

router.get(
  '/roles',
  asyncWrapper(async (_req: Request, res: Response): Promise<void> => {
    const rolesResult = await pool.query('SELECT * FROM roles ORDER BY created_at ASC');
    const roles = [];

    for (const role of rolesResult.rows) {
      const permsResult = await pool.query('SELECT page FROM role_permissions WHERE role_id = $1', [role.id]);
      const tagsResult = await pool.query(
        `SELECT t.id, t.name FROM tags t JOIN role_tags rt ON t.id = rt.tag_id WHERE rt.role_id = $1`,
        [role.id]
      );

      roles.push({
        ...role,
        pages: permsResult.rows.map((r: any) => r.page),
        tags: tagsResult.rows,
      });
    }

    res.json(roles);
  })
);

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  pages: z.array(z.string()).min(1, 'At least one page permission required'),
});

router.post(
  '/roles',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { name, description, pages } = createRoleSchema.parse(req.body);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const roleResult = await client.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *`,
        [name, description || null]
      );
      const roleId = roleResult.rows[0].id;

      for (const page of pages) {
        await client.query(
          `INSERT INTO role_permissions (role_id, page) VALUES ($1, $2)`,
          [roleId, page]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ ...roleResult.rows[0], pages });
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        throw new AppError('Conflict', 409, 'Role name already exists');
      }
      throw error;
    } finally {
      client.release();
    }
  })
);

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  pages: z.array(z.string()).optional(),
});

router.put(
  '/roles/:id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, pages } = updateRoleSchema.parse(req.body);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if system role — don't allow name change
      const existing = await client.query('SELECT * FROM roles WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        throw new AppError('NotFound', 404, 'Role not found');
      }

      if (existing.rows[0].is_system && name && name !== existing.rows[0].name) {
        throw new AppError('BadRequest', 400, 'Cannot rename system roles');
      }

      if (name || description !== undefined) {
        await client.query(
          `UPDATE roles SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3`,
          [name || null, description ?? null, id]
        );
      }

      if (pages) {
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
        for (const page of pages) {
          await client.query(
            `INSERT INTO role_permissions (role_id, page) VALUES ($1, $2)`,
            [id, page]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Role updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  })
);

router.delete(
  '/roles/:id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('NotFound', 404, 'Role not found');
    }
    if (existing.rows[0].is_system) {
      throw new AppError('BadRequest', 400, 'Cannot delete system roles');
    }

    // Check if any users have this role
    const usersWithRole = await pool.query('SELECT COUNT(*) FROM users WHERE role_id = $1', [id]);
    if (parseInt(usersWithRole.rows[0].count) > 0) {
      throw new AppError('BadRequest', 400, 'Cannot delete role that is assigned to users');
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    res.json({ message: 'Role deleted successfully' });
  })
);

// ===== ROLE TAG ASSIGNMENTS =====

const assignTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
});

router.post(
  '/roles/:id/tags',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { tagIds } = assignTagsSchema.parse(req.body);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing and reassign
      await client.query('DELETE FROM role_tags WHERE role_id = $1', [id]);
      for (const tagId of tagIds) {
        await client.query(
          `INSERT INTO role_tags (role_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, tagId]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Tags assigned to role successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  })
);

router.delete(
  '/roles/:id/tags/:tagId',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { id, tagId } = req.params;
    await pool.query('DELETE FROM role_tags WHERE role_id = $1 AND tag_id = $2', [id, tagId]);
    res.json({ message: 'Tag removed from role' });
  })
);

// ===== USERS =====

router.get(
  '/users',
  asyncWrapper(async (_req: Request, res: Response): Promise<void> => {
    const result = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.role_id, r.name as role_name, u.created_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at ASC`
    );
    res.json(result.rows);
  })
);

const updateUserRoleSchema = z.object({
  roleId: z.string().uuid(),
});

router.put(
  '/users/:id/role',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { roleId } = updateUserRoleSchema.parse(req.body);

    // Verify role exists
    const roleCheck = await pool.query('SELECT id FROM roles WHERE id = $1', [roleId]);
    if (roleCheck.rows.length === 0) {
      throw new AppError('NotFound', 404, 'Role not found');
    }

    await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [roleId, id]);
    res.json({ message: 'User role updated successfully' });
  })
);

router.delete(
  '/users/:id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Don't allow self-deletion
    if (req.user?.userId === id) {
      throw new AppError('BadRequest', 400, 'Cannot delete your own account');
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  })
);

// ===== TAGS =====

router.get(
  '/tags',
  asyncWrapper(async (_req: Request, res: Response): Promise<void> => {
    const result = await pool.query(`
      SELECT t.*, COUNT(dt.document_id) as document_count
      FROM tags t
      LEFT JOIN document_tags dt ON t.id = dt.tag_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `);
    res.json(result.rows);
  })
);

router.delete(
  '/tags/:id',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await pool.query('DELETE FROM tags WHERE id = $1', [id]);
    res.json({ message: 'Tag deleted successfully' });
  })
);

export { router as adminRoutes };
