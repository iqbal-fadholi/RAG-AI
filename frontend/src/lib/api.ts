const API_URL = "http://localhost:3000";

export async function fetchFiles() {
  const res = await fetch(`${API_URL}/ingest/files`);
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

export async function uploadFile(file: File) {
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
