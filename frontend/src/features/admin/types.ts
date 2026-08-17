export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  pages: string[];
  tags: { id: string; name: string }[];
}

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  role_id: string;
  role_name: string;
  created_at: string;
}

export interface TagItem {
  id: string;
  name: string;
  created_at: string;
  document_count: string | number;
}

export interface PagePermission {
  id: string;
  label: string;
  desc: string;
}

export const AVAILABLE_PAGES: PagePermission[] = [
  { id: "chat", label: "Chat & Assistant", desc: "Access the RAG chat workspace" },
  { id: "ingest", label: "Document Ingestion", desc: "Upload and review documents" },
  { id: "admin", label: "Administration", desc: "Manage users, roles, and OBAC tags" },
];

export type AdminTab = "users" | "roles" | "tags" | "settings";

export interface SystemSettings {
  llmProvider: "gemini" | "openai";
  googleModel: string;
  hasGoogleApiKey: boolean;
  googleApiKeyMasked: string;
  openaiModel: string;
  openaiBaseUrl: string;
  hasOpenaiApiKey: boolean;
  openaiApiKeyMasked: string;
  embeddingProvider: "gemini" | "openai";
  openaiEmbeddingModel: string;
  openaiEmbeddingDimensions: number;
  temperature: number;
  retrievalK: number;
  doclingServiceUrl: string;
}

export interface UpdateSystemSettingsPayload {
  llmProvider?: "gemini" | "openai";
  googleApiKey?: string;
  googleModel?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
  embeddingProvider?: "gemini" | "openai";
  openaiEmbeddingModel?: string;
  openaiEmbeddingDimensions?: number;
  temperature?: number;
  retrievalK?: number;
  doclingServiceUrl?: string;
}

export interface TestConnectionPayload {
  provider: "gemini" | "openai";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs?: number;
  message?: string;
  model?: string;
  provider?: string;
  error?: string;
}
