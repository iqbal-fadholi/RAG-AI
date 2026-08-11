import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  googleApiKey: z.string().min(1, 'GOOGLE_API_KEY is required'),
  googleModel: z.string().default('gemini-3.1-flash-lite'),
  doclingServiceUrl: z.string().default('http://docling-service:8000'),
  db: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(5432),
    user: z.string().default('rag_user'),
    password: z.string().default('rag_password'),
    database: z.string().default('rag_db'),
  }),
});

const rawConfig = {
  port: process.env.PORT,
  googleApiKey: process.env.GOOGLE_API_KEY,
  googleModel: process.env.GOOGLE_MODEL,
  doclingServiceUrl: process.env.DOCLING_SERVICE_URL,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};

const parsed = configSchema.safeParse(rawConfig);

if (!parsed.success) {
  console.error('❌ Invalid application configuration:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const config = parsed.data;
