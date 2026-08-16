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

export type AdminTab = "users" | "roles" | "tags";
