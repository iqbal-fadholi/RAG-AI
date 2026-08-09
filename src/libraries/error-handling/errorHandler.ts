import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError.js';

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    console.error(`[ValidationError] Schema validation failed:`, JSON.stringify(error.format(), null, 2));
    res.status(400).json({
      error: 'Validation failed',
      details: error.format(),
    });
    return;
  }

  // If it's a known operational AppError, use its status code
  if (error instanceof AppError) {
    console.error(`[AppError] ${error.name} (${error.httpStatusCode}): ${error.message}`);
    res.status(error.httpStatusCode).json({
      error: error.message,
    });
    return;
  }

  // Otherwise, it's a programmer error (catastrophic) or an untranslated internal error
  console.error('[UnhandledError] Severe/Programmer Error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
  });
};
