import type { Request, Response, NextFunction } from 'express';

/**
 * RBAC middleware factory — checks if the authenticated user has access to a specific page.
 * Must be used AFTER the `authenticate` middleware.
 */
export const requirePage = (page: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.pages.includes(page)) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
};
