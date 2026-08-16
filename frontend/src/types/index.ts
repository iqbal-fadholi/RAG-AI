export type DocStatus = 'idle' | 'uploading' | 'reviewing' | 'approving' | 'queued' | 'processing' | 'extracting text...' | 'chunking and saving...' | 'pending_review' | 'pending' | 'approved' | 'done' | 'error' | string;

export interface TagItem {
  id: string;
  name: string;
}

export interface DocumentData {
  id: string;
  filename: string;
  status: DocStatus;
  uploaded_at: string;
  tags?: TagItem[];
  [key: string]: unknown;
}

export interface ParsedDoc {
  doc_id: string;
  markdown: string;
  metadata?: unknown;
}

export type Role = "user" | "ai";

export interface SourceDocument {
  index: number;
  fileId?: string | null;
  filename: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  progress?: string;
  sources?: SourceDocument[];
  createdAt?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetails {
  conversation: Conversation;
  messages: {
    id: string;
    conversation_id: string;
    role: Role;
    content: string;
    sources: SourceDocument[];
    created_at: string;
  }[];
}
