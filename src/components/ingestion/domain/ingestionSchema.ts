import { z } from 'zod';

export const editMarkdownSchema = z.object({
  markdown: z.string().min(1, 'Markdown content is required'),
});

export const getStatusSchema = z.object({
  thread_id: z.string().uuid('Invalid thread ID format (must be UUID)'),
});

export const editStatusSchema = z.object({
  thread_id: z.string().uuid('Invalid thread ID format (must be UUID)'),
});

export const approveStatusSchema = z.object({
  thread_id: z.string().uuid('Invalid thread ID format (must be UUID)'),
});
