import { config } from './index.js';
import { getDbSystemSettings, saveDbSystemSettings } from '../db/systemSettings.js';
import type { StoredSettings } from '../db/systemSettings.js';

export interface EffectiveSettings {
  llmProvider: 'gemini' | 'openai';
  googleApiKey: string;
  googleModel: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  embeddingProvider: 'gemini' | 'openai';
  openaiEmbeddingModel: string;
  openaiEmbeddingDimensions: number;
  temperature: number;
  retrievalK: number;
  doclingServiceUrl: string;
}

export type UpdateSettingsPayload = {
  llmProvider?: 'gemini' | 'openai' | undefined;
  googleApiKey?: string | undefined;
  googleModel?: string | undefined;
  openaiApiKey?: string | undefined;
  openaiBaseUrl?: string | undefined;
  openaiModel?: string | undefined;
  embeddingProvider?: 'gemini' | 'openai' | undefined;
  openaiEmbeddingModel?: string | undefined;
  openaiEmbeddingDimensions?: number | undefined;
  temperature?: number | undefined;
  retrievalK?: number | undefined;
  doclingServiceUrl?: string | undefined;
};

export interface SanitizedSettings {
  llmProvider: 'gemini' | 'openai';
  googleModel: string;
  hasGoogleApiKey: boolean;
  googleApiKeyMasked: string;
  openaiModel: string;
  openaiBaseUrl: string;
  hasOpenaiApiKey: boolean;
  openaiApiKeyMasked: string;
  embeddingProvider: 'gemini' | 'openai';
  openaiEmbeddingModel: string;
  openaiEmbeddingDimensions: number;
  temperature: number;
  retrievalK: number;
  doclingServiceUrl: string;
}

let cachedSettings: EffectiveSettings | null = null;

export const maskApiKey = (key?: string): string => {
  if (!key || key.trim() === '') return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
};

export const getEffectiveSettingsSync = (): EffectiveSettings => {
  if (cachedSettings) {
    return cachedSettings;
  }

  return {
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
};

export const getEffectiveSettings = async (): Promise<EffectiveSettings> => {
  if (cachedSettings) {
    return cachedSettings;
  }

  // Fetch from DB
  const dbSettings = await getDbSystemSettings();

  cachedSettings = {
    llmProvider: (dbSettings?.llmProvider || config.llmProvider || 'gemini') as 'gemini' | 'openai',
    googleApiKey: dbSettings?.googleApiKey !== undefined ? dbSettings.googleApiKey : config.googleApiKey || '',
    googleModel: dbSettings?.googleModel || config.googleModel || 'gemini-3.1-flash-lite',
    openaiApiKey: dbSettings?.openaiApiKey !== undefined ? dbSettings.openaiApiKey : config.openaiApiKey || '',
    openaiBaseUrl: dbSettings?.openaiBaseUrl !== undefined ? dbSettings.openaiBaseUrl : config.openaiBaseUrl || '',
    openaiModel: dbSettings?.openaiModel || config.openaiModel || 'gpt-4o-mini',
    embeddingProvider: (dbSettings?.embeddingProvider || config.embeddingProvider || 'gemini') as 'gemini' | 'openai',
    openaiEmbeddingModel: dbSettings?.openaiEmbeddingModel || config.openaiEmbeddingModel || 'text-embedding-3-small',
    openaiEmbeddingDimensions: dbSettings?.openaiEmbeddingDimensions || config.openaiEmbeddingDimensions || 1536,
    temperature: dbSettings?.temperature !== undefined ? dbSettings.temperature : 0,
    retrievalK: dbSettings?.retrievalK !== undefined ? dbSettings.retrievalK : 10,
    doclingServiceUrl: dbSettings?.doclingServiceUrl || config.doclingServiceUrl || 'http://docling-service:8000',
  };

  return cachedSettings;
};

export const getSanitizedSettings = async (): Promise<SanitizedSettings> => {
  const current = await getEffectiveSettings();

  return {
    llmProvider: current.llmProvider,
    googleModel: current.googleModel,
    hasGoogleApiKey: Boolean(current.googleApiKey && current.googleApiKey.trim().length > 0),
    googleApiKeyMasked: maskApiKey(current.googleApiKey),
    openaiModel: current.openaiModel,
    openaiBaseUrl: current.openaiBaseUrl,
    hasOpenaiApiKey: Boolean(current.openaiApiKey && current.openaiApiKey.trim().length > 0),
    openaiApiKeyMasked: maskApiKey(current.openaiApiKey),
    embeddingProvider: current.embeddingProvider,
    openaiEmbeddingModel: current.openaiEmbeddingModel,
    openaiEmbeddingDimensions: current.openaiEmbeddingDimensions,
    temperature: current.temperature,
    retrievalK: current.retrievalK,
    doclingServiceUrl: current.doclingServiceUrl,
  };
};

export const updateSettings = async (updates: UpdateSettingsPayload): Promise<SanitizedSettings> => {
  const current = await getEffectiveSettings();

  const newSettings: EffectiveSettings = {
    llmProvider: updates.llmProvider || current.llmProvider,
    // If googleApiKey is provided (non-empty string), update it; otherwise preserve current
    googleApiKey: updates.googleApiKey !== undefined && updates.googleApiKey.trim() !== ''
      ? updates.googleApiKey.trim()
      : current.googleApiKey,
    googleModel: updates.googleModel?.trim() || current.googleModel,
    // If openaiApiKey is provided (non-empty string), update it; otherwise preserve current
    openaiApiKey: updates.openaiApiKey !== undefined && updates.openaiApiKey.trim() !== ''
      ? updates.openaiApiKey.trim()
      : current.openaiApiKey,
    openaiBaseUrl: updates.openaiBaseUrl !== undefined ? updates.openaiBaseUrl.trim() : current.openaiBaseUrl,
    openaiModel: updates.openaiModel?.trim() || current.openaiModel,
    embeddingProvider: updates.embeddingProvider || current.embeddingProvider,
    openaiEmbeddingModel: updates.openaiEmbeddingModel?.trim() || current.openaiEmbeddingModel,
    openaiEmbeddingDimensions: updates.openaiEmbeddingDimensions || current.openaiEmbeddingDimensions,
    temperature: updates.temperature !== undefined ? Number(updates.temperature) : current.temperature,
    retrievalK: updates.retrievalK !== undefined ? Number(updates.retrievalK) : current.retrievalK,
    doclingServiceUrl: updates.doclingServiceUrl?.trim() || current.doclingServiceUrl,
  };

  // Persist to database
  await saveDbSystemSettings(newSettings as StoredSettings);

  // Update in-memory cache
  cachedSettings = newSettings;

  return getSanitizedSettings();
};

export const invalidateSettingsCache = (): void => {
  cachedSettings = null;
};
