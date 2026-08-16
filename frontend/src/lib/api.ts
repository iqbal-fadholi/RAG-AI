import { DocumentData } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const fetcher = (url: string) => {
  const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
  return fetch(fullUrl, {
    headers: { ...getAuthHeaders() },
  }).then((res) => {
    if (res.status === 401) {
      // Token expired — force re-login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error(`Failed to fetch ${fullUrl}`);
    return res.json();
  });
};

export async function fetchFiles(): Promise<DocumentData[]> {
  const res = await fetch(`${API_URL}/ingest/files`, {
    headers: { ...getAuthHeaders() },
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

export async function uploadFile(file: File, tags?: string[]) {
  const formData = new FormData();
  formData.append("file", file);
  if (tags && tags.length > 0) {
    formData.append("tags", JSON.stringify(tags));
  }
  
  const res = await fetch(`${API_URL}/ingest/start`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error("Failed to upload file");
  return res.json();
}

export async function getIngestionStatus(threadId: string) {
  const res = await fetch(`${API_URL}/ingest/status/${threadId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to get status");
  return res.json();
}

export async function editMarkdown(threadId: string, markdown: string) {
  const res = await fetch(`${API_URL}/ingest/edit/${threadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ markdown }),
  });
  if (!res.ok) throw new Error("Failed to edit markdown");
  return res.json();
}

export async function approveIngestion(threadId: string) {
  const res = await fetch(`${API_URL}/ingest/approve/${threadId}`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to approve ingestion");
  return res.json();
}

export async function retryIngestion(threadId: string) {
  const res = await fetch(`${API_URL}/ingest/retry/${threadId}`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to retry ingestion");
  return res.json();
}

export async function deleteFile(id: string) {
  const res = await fetch(`${API_URL}/ingest/files/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to delete file");
  return res.json();
}

export function getDownloadUrl(id: string): string {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return `${API_URL}/ingest/files/${id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

export async function fetchTags(): Promise<{ id: string; name: string }[]> {
  const res = await fetch(`${API_URL}/ingest/tags`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

export async function updateDocumentTags(id: string, tagIds: string[]) {
  const res = await fetch(`${API_URL}/ingest/files/${id}/tags`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ tagIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to update document tags");
  }
  return res.json();
}

// Admin API helpers
export const adminApi = {
  async getRoles() {
    const res = await fetch(`${API_URL}/admin/roles`, { headers: { ...getAuthHeaders() } });
    if (!res.ok) throw new Error("Failed to fetch roles");
    return res.json();
  },

  async createRole(data: { name: string; description?: string; pages: string[] }) {
    const res = await fetch(`${API_URL}/admin/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to create role");
    }
    return res.json();
  },

  async updateRole(id: string, data: { name?: string; description?: string; pages?: string[] }) {
    const res = await fetch(`${API_URL}/admin/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to update role");
    }
    return res.json();
  },

  async deleteRole(id: string) {
    const res = await fetch(`${API_URL}/admin/roles/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to delete role");
    }
    return res.json();
  },

  async assignRoleTags(roleId: string, tagIds: string[]) {
    const res = await fetch(`${API_URL}/admin/roles/${roleId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ tagIds }),
    });
    if (!res.ok) throw new Error("Failed to assign tags");
    return res.json();
  },

  async getUsers() {
    const res = await fetch(`${API_URL}/admin/users`, { headers: { ...getAuthHeaders() } });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },

  async createUser(data: { email: string; password: string; displayName: string; roleId: string }) {
    const res = await fetch(`${API_URL}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to create user");
    }
    return res.json();
  },

  async updateUserRole(userId: string, roleId: string) {
    const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ roleId }),
    });
    if (!res.ok) throw new Error("Failed to update user role");
    return res.json();
  },

  async deleteUser(userId: string) {
    const res = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to delete user");
    }
    return res.json();
  },

  async getTags() {
    const res = await fetch(`${API_URL}/admin/tags`, { headers: { ...getAuthHeaders() } });
    if (!res.ok) throw new Error("Failed to fetch tags");
    return res.json();
  },

  async deleteTag(tagId: string) {
    const res = await fetch(`${API_URL}/admin/tags/${tagId}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to delete tag");
    return res.json();
  },
};
