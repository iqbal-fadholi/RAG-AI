import express from 'express';
import cors from 'cors';
import { chatRoutes } from './components/chat/entry-points/chatRoutes.js';
import { ingestionRoutes } from './components/ingestion/entry-points/ingestionRoutes.js';
import { errorHandler } from './libraries/error-handling/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', chatRoutes);
app.use('/ingest', ingestionRoutes);

// Centralized error handler (must be last)
app.use(errorHandler);

export { app };
