export type DocStatus = 'idle' | 'uploading' | 'reviewing' | 'approving' | 'queued' | 'processing' | 'extracting text...' | 'chunking and saving...' | 'pending_review' | 'pending' | 'approved' | 'done' | 'error' | string;

export interface DocumentData {
  id: string;
  filename: string;
  status: DocStatus;
  uploaded_at: string;
  [key: string]: unknown;
}

export interface ParsedDoc {
  doc_id: string;
  markdown: string;
  metadata?: unknown;
}

export type Role = "user" | "ai";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  progress?: string;
}
