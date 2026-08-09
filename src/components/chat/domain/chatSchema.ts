import { z } from 'zod';

export const chatRequestSchema = z.object({
  question: z.string().min(1, 'Question is required'),
});
