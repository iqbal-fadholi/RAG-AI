import { pool } from './checkpoint.js';
import { config } from '../config/index.js';

export interface StoredSettings {
  llmProvider: 'gemini' | 'openai';
  googleApiKey?: string;
  googleModel: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel: string;
  embeddingProvider: 'gemini' | 'openai';
  openaiEmbeddingModel: string;
  openaiEmbeddingDimensions: number;
  temperature: number;
  retrievalK: number;
  doclingServiceUrl: string;
}

const SETTINGS_KEY = 'global_settings';

export const setupSystemSettingsTable = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    // Advisory lock for migration safety
    await client.query('SELECT pg_advisory_lock(74291483)');

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Check if initial settings exist
    const existing = await client.query('SELECT value FROM system_settings WHERE key = $1', [SETTINGS_KEY]);
    if (existing.rows.length === 0) {
      const initialSettings: StoredSettings = {
        llmProvider: (config.llmProvider as 'gemini' | 'openai') || 'gemini',
        googleApiKey: config.googleApiKey || '',
        googleModel: config.googleModel || 'gemini-3.1-flash-lite',
        openaiApiKey: config.openaiApiKey || '',
        openaiBaseUrl: config.openaiBaseUrl || '',
        openaiModel: config.openaiModel || 'gpt-4o-mini',
        embeddingProvider: (config.embeddingProvider as 'gemini' | 'openai') || 'gemini',
        openaiEmbeddingModel: config.openaiEmbeddingModel || 'text-embedding-3-small',
        openaiEmbeddingDimensions: config.openaiEmbeddingDimensions || 1536,
        temperature: 0,
        retrievalK: 10,
        doclingServiceUrl: config.doclingServiceUrl || 'http://docling-service:8000',
      };

      await client.query(
        `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [SETTINGS_KEY, JSON.stringify(initialSettings)]
      );
      console.log('✅ System settings initialized in database from environment defaults.');
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(74291483)');
    } catch (_) {}
    client.release();
  }
};

export const getDbSystemSettings = async (): Promise<Partial<StoredSettings> | null> => {
  try {
    const res = await pool.query('SELECT value FROM system_settings WHERE key = $1', [SETTINGS_KEY]);
    if (res.rows.length > 0) {
      return res.rows[0].value as StoredSettings;
    }
    return null;
  } catch (error) {
    console.error('Error reading system_settings from DB:', error);
    return null;
  }
};

export const saveDbSystemSettings = async (settings: StoredSettings): Promise<StoredSettings> => {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO system_settings (key, value, updated_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [SETTINGS_KEY, JSON.stringify(settings)]
    );
    return settings;
  } finally {
    client.release();
  }
};
