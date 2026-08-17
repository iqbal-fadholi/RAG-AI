import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';
import { config } from '../config/index.js';

export interface ChatModelOptions {
  streaming?: boolean;
  temperature?: number;
  maxRetries?: number;
}

/**
 * Returns a configured Chat Model instance based on the LLM_PROVIDER setting.
 * Supports Google Gemini and any OpenAI-compatible provider (OpenAI, Ollama, Groq, DeepSeek, vLLM, etc.).
 */
export function getChatModel(options: ChatModelOptions = {}): BaseChatModel {
  const {
    streaming = false,
    temperature = 0,
    maxRetries = 3,
  } = options;

  if (config.llmProvider === 'openai') {
    return new ChatOpenAI({
      apiKey: config.openaiApiKey || (config.openaiBaseUrl ? 'dummy-key' : undefined),
      model: config.openaiModel,
      temperature,
      streaming,
      maxRetries,
      ...(config.openaiBaseUrl
        ? {
            configuration: {
              baseURL: config.openaiBaseUrl,
            },
          }
        : {}),
    });
  }

  // Default: Google Gemini
  return new ChatGoogleGenerativeAI({
    apiKey: config.googleApiKey,
    model: config.googleModel,
    temperature,
    streaming,
    maxRetries,
  });
}

/**
 * Returns a configured Embeddings instance based on the EMBEDDING_PROVIDER setting.
 */
export function getEmbeddings(): Embeddings {
  if (config.embeddingProvider === 'openai') {
    return new OpenAIEmbeddings({
      apiKey: config.openaiApiKey || (config.openaiBaseUrl ? 'dummy-key' : undefined),
      model: config.openaiEmbeddingModel,
      dimensions: config.openaiEmbeddingDimensions,
      ...(config.openaiBaseUrl
        ? {
            configuration: {
              baseURL: config.openaiBaseUrl,
            },
          }
        : {}),
    });
  }

  // Default: Google Gemini Embeddings
  return new GoogleGenerativeAIEmbeddings({
    apiKey: config.googleApiKey,
    modelName: 'gemini-embedding-2',
  });
}

/**
 * Returns the expected vector dimension for the active embedding provider.
 */
export function getEmbeddingDimensions(): number {
  if (config.embeddingProvider === 'openai') {
    return config.openaiEmbeddingDimensions || 1536;
  }
  return 3072;
}

/**
 * Returns active provider metadata for debugging, health checks, and logs.
 */
export function getProviderInfo() {
  return {
    llmProvider: config.llmProvider,
    llmModel: config.llmProvider === 'openai' ? config.openaiModel : config.googleModel,
    embeddingProvider: config.embeddingProvider,
    embeddingModel:
      config.embeddingProvider === 'openai'
        ? config.openaiEmbeddingModel
        : 'gemini-embedding-2',
    embeddingDimensions: getEmbeddingDimensions(),
    isCustomOpenAIBaseUrl: Boolean(config.openaiBaseUrl),
    openaiBaseUrl: config.openaiBaseUrl || null,
  };
}
