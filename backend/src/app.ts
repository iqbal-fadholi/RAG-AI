import express from 'express';
import cors from 'cors';
import { chatRoutes } from './components/chat/entry-points/chatRoutes.js';
import { ingestionRoutes } from './components/ingestion/entry-points/ingestionRoutes.js';
import { authRoutes } from './components/auth/entry-points/authRoutes.js';
import { adminRoutes } from './components/admin/entry-points/adminRoutes.js';
import { errorHandler } from './libraries/error-handling/errorHandler.js';
import { authenticate } from './libraries/auth/jwtMiddleware.js';
import { requirePage } from './libraries/auth/rbacMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Public routes (no auth required)
app.use('/auth', authRoutes);

// Protected routes (auth required)
app.use('/api', authenticate, requirePage('chat'), chatRoutes);
app.use('/ingest', authenticate, requirePage('ingest'), ingestionRoutes);
app.use('/admin', authenticate, requirePage('admin'), adminRoutes);

// Centralized error handler (must be last)
app.use(errorHandler);

export { app };
