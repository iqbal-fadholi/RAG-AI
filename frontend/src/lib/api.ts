import { DocumentData } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const fetcher = (url: string) => {
  const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
  return fetch(fullUrl).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch ${fullUrl}`);
    return res.json();
  });
};

export async function fetchFiles(): Promise<DocumentData[]> {
  const res = await fetch(`${API_URL}/ingest/files`);
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

export async function uploadFile(file: File) {
  // Use XMLHttpRequest or axios if progress is strictly needed in native fetch
  // but since we are refactoring, we'll expose a fetch version, and in components
  // we might use XMLHttpRequest for progress or an external lib.
  // Actually, keeping axios for upload progress is better.
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${API_URL}/ingest/start`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload file");
  return res.json();
}

export async function getIngestionStatus(threadId: string) {
  const res = await fetch(`${API_URL}/ingest/status/${threadId}`);
  if (!res.ok) throw new Error("Failed to get status");
  return res.json();
}

export async function editMarkdown(threadId: string, markdown: string) {
  const res = await fetch(`${API_URL}/ingest/edit/${threadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown }),
  });
  if (!res.ok) throw new Error("Failed to edit markdown");
  return res.json();
}

export async function approveIngestion(threadId: string) {
  const res = await fetch(`${API_URL}/ingest/approve/${threadId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to approve ingestion");
  return res.json();
}

export async function deleteFile(id: string) {
  const res = await fetch(`${API_URL}/ingest/files/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete file");
  return res.json();
}

export function getDownloadUrl(id: string): string {
  return `${API_URL}/ingest/files/${id}/download`;
}
