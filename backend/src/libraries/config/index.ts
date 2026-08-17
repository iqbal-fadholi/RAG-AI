import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z
  .object({
    port: z.coerce.number().default(3000),

    // Provider selectors
    llmProvider: z.enum(['gemini', 'openai']).default('gemini'),
    embeddingProvider: z.enum(['gemini', 'openai']).default('gemini'),

    // Google Gemini configuration
    googleApiKey: z.string().optional().default(''),
    googleModel: z.string().default('gemini-3.1-flash-lite'),

    // OpenAI / OpenAI-compatible configuration
    openaiApiKey: z.string().optional().default(''),
    openaiBaseUrl: z.string().optional().default(''),
    openaiModel: z.string().default('gpt-4o-mini'),
    openaiEmbeddingModel: z.string().default('text-embedding-3-small'),
    openaiEmbeddingDimensions: z.coerce.number().default(1536),

    doclingServiceUrl: z.string().default('http://docling-service:8000'),
    jwtSecret: z.string().default('dev-jwt-secret-change-in-production'),
    db: z.object({
      host: z.string().default('localhost'),
      port: z.coerce.number().default(5432),
      user: z.string().default('rag_user'),
      password: z.string().default('rag_password'),
      database: z.string().default('rag_db'),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.llmProvider === 'gemini' || data.embeddingProvider === 'gemini') {
      if (!data.googleApiKey || data.googleApiKey.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['googleApiKey'],
          message: 'GOOGLE_API_KEY is required when LLM_PROVIDER or EMBEDDING_PROVIDER is set to "gemini"',
        });
      }
    }

    if (data.llmProvider === 'openai' || data.embeddingProvider === 'openai') {
      // If not using a custom baseURL (like local Ollama), require an OpenAI API Key
      if (!data.openaiApiKey && !data.openaiBaseUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['openaiApiKey'],
          message: 'OPENAI_API_KEY is required when using OpenAI provider without a custom OPENAI_BASE_URL',
        });
      }
    }
  });

const rawConfig = {
  port: process.env.PORT,
  llmProvider: process.env.LLM_PROVIDER,
  embeddingProvider: process.env.EMBEDDING_PROVIDER,
  googleApiKey: process.env.GOOGLE_API_KEY,
  googleModel: process.env.GOOGLE_MODEL,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL,
  openaiModel: process.env.OPENAI_MODEL,
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL,
  openaiEmbeddingDimensions: process.env.OPENAI_EMBEDDING_DIMENSIONS,
  doclingServiceUrl: process.env.DOCLING_SERVICE_URL,
  jwtSecret: process.env.JWT_SECRET,
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

