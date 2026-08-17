import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { getEffectiveSettingsSync } from '../config/settingsService.js';
import type { EffectiveSettings } from '../config/settingsService.js';

export interface ChatModelOptions {
  streaming?: boolean | undefined;
  temperature?: number | undefined;
  maxRetries?: number | undefined;
  customSettings?: Partial<EffectiveSettings> | undefined;
}

/**
 * Returns a configured Chat Model instance based on dynamic effective settings.
 * Supports Google Gemini and any OpenAI-compatible provider (OpenAI, Ollama, Groq, DeepSeek, vLLM, etc.).
 */
export function getChatModel(options: ChatModelOptions = {}): BaseChatModel {
  const current = getEffectiveSettingsSync();
  const settings = { ...current, ...(options.customSettings || {}) };

  const {
    streaming = false,
    temperature = settings.temperature ?? 0,
    maxRetries = 3,
  } = options;

  if (settings.llmProvider === 'openai') {
    return new ChatOpenAI({
      apiKey: settings.openaiApiKey || (settings.openaiBaseUrl ? 'dummy-key' : undefined),
      model: settings.openaiModel,
      temperature,
      streaming,
      maxRetries,
      ...(settings.openaiBaseUrl
        ? {
            configuration: {
              baseURL: settings.openaiBaseUrl,
            },
          }
        : {}),
    });
  }

  // Default: Google Gemini
  return new ChatGoogleGenerativeAI({
    apiKey: settings.googleApiKey,
    model: settings.googleModel,
    temperature,
    streaming,
    maxRetries,
  });
}

/**
 * Returns a configured Embeddings instance based on dynamic effective settings.
 */
export function getEmbeddings(): Embeddings {
  const settings = getEffectiveSettingsSync();

  if (settings.embeddingProvider === 'openai') {
    return new OpenAIEmbeddings({
      apiKey: settings.openaiApiKey || (settings.openaiBaseUrl ? 'dummy-key' : undefined),
      model: settings.openaiEmbeddingModel,
      dimensions: settings.openaiEmbeddingDimensions,
      ...(settings.openaiBaseUrl
        ? {
            configuration: {
              baseURL: settings.openaiBaseUrl,
            },
          }
        : {}),
    });
  }

  // Default: Google Gemini Embeddings
  return new GoogleGenerativeAIEmbeddings({
    apiKey: settings.googleApiKey,
    modelName: 'gemini-embedding-2',
  });
}

/**
 * Returns the expected vector dimension for the active embedding provider.
 */
export function getEmbeddingDimensions(): number {
  const settings = getEffectiveSettingsSync();

  if (settings.embeddingProvider === 'openai') {
    return settings.openaiEmbeddingDimensions || 1536;
  }
  return 3072;
}

/**
 * Returns active provider metadata for debugging, health checks, and logs.
 */
export function getProviderInfo() {
  const settings = getEffectiveSettingsSync();

  return {
    llmProvider: settings.llmProvider,
    llmModel: settings.llmProvider === 'openai' ? settings.openaiModel : settings.googleModel,
    embeddingProvider: settings.embeddingProvider,
    embeddingModel:
      settings.embeddingProvider === 'openai'
        ? settings.openaiEmbeddingModel
        : 'gemini-embedding-2',
    embeddingDimensions: getEmbeddingDimensions(),
    isCustomOpenAIBaseUrl: Boolean(settings.openaiBaseUrl),
    openaiBaseUrl: settings.openaiBaseUrl || null,
  };
}

export interface TestConnectionParams {
  provider: 'gemini' | 'openai';
  apiKey?: string | undefined;
  model?: string | undefined;
  baseUrl?: string | undefined;
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  message: string;
  model: string;
  provider: string;
}

/**
 * Tests connectivity to a specified provider with given or current credentials.
 */
export async function testProviderConnection(params: TestConnectionParams): Promise<TestConnectionResult> {
  const current = getEffectiveSettingsSync();
  const startTime = Date.now();

  let testModel: BaseChatModel;
  const targetModel = params.model || (params.provider === 'openai' ? current.openaiModel : current.googleModel);

  if (params.provider === 'openai') {
    const key = params.apiKey !== undefined && params.apiKey.trim() !== ''
      ? params.apiKey.trim()
      : current.openaiApiKey;
    const baseUrl = params.baseUrl !== undefined ? params.baseUrl.trim() : current.openaiBaseUrl;

    if (!key && !baseUrl) {
      throw new Error('OpenAI API Key is required when not using a custom Base URL');
    }

    testModel = new ChatOpenAI({
      apiKey: key || (baseUrl ? 'dummy-key' : undefined),
      model: targetModel,
      temperature: 0,
      maxRetries: 1,
      timeout: 10000,
      ...(baseUrl
        ? {
            configuration: {
              baseURL: baseUrl,
            },
          }
        : {}),
    });
  } else {
    // Gemini
    const key = params.apiKey !== undefined && params.apiKey.trim() !== ''
      ? params.apiKey.trim()
      : current.googleApiKey;

    if (!key) {
      throw new Error('Google API Key is required for Gemini');
    }

    testModel = new ChatGoogleGenerativeAI({
      apiKey: key,
      model: targetModel,
      temperature: 0,
      maxRetries: 1,
    });
  }

  const response = await testModel.invoke('Respond with the single word: Pong');
  const latencyMs = Date.now() - startTime;
  const message = typeof response.content === 'string' ? response.content.trim() : JSON.stringify(response.content);

  return {
    success: true,
    latencyMs,
    message,
    model: targetModel,
    provider: params.provider,
  };
}
