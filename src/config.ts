import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'rag_user',
    password: process.env.DB_PASSWORD || 'rag_password',
    database: process.env.DB_NAME || 'rag_db',
  }
};
