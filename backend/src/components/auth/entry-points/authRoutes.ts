import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncWrapper } from '../../../libraries/error-handling/asyncWrapper.js';
import { AppError } from '../../../libraries/error-handling/AppError.js';
import { registerUser, loginUser, getProfile } from '../domain/authService.js';
import { authenticate } from '../../../libraries/auth/jwtMiddleware.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Display name is required'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  '/register',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { email, password, displayName } = registerSchema.parse(req.body);

    try {
      const result = await registerUser(email, password, displayName);
      res.status(201).json({ message: 'User registered successfully', userId: result.userId });
    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        throw new AppError('Conflict', 409, error.message);
      }
      throw error;
    }
  })
);

router.post(
  '/login',
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = loginSchema.parse(req.body);

    try {
      const { token, user } = await loginUser(email, password);
      res.json({ token, user });
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        throw new AppError('Unauthorized', 401, error.message);
      }
      throw error;
    }
  })
);

router.get(
  '/me',
  authenticate,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const profile = await getProfile(user.userId);
    if (!profile) {
      throw new AppError('NotFound', 404, 'User not found');
    }
    res.json(profile);
  })
);

export { router as authRoutes };
