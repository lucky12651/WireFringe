/**
 * Shared API client for Coffee n Blog
 * DRY: Centralized fetch logic used across all admin components
 */

export async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (_) {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function uploadFile(path, file) {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (_) {}
    throw new Error(detail);
  }

  return await res.json();
}

// Auth API
export const authApi = {
  login: (username, password) =>
    api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => api('/api/admin/logout', { method: 'POST' }),
  me: () => api('/api/admin/me', { method: 'GET' }),
  updateProfile: (displayName) =>
    api('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify({ displayName }),
    }),
  uploadPhoto: (file) => uploadFile('/api/admin/profile/photo', file),
  changePassword: (currentPassword, newPassword) =>
    api('/api/admin/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Posts API
export const postsApi = {
  list: () => api('/api/admin/posts', { method: 'GET' }),
  get: (id) => api(`/api/admin/post?id=${encodeURIComponent(id)}`, { method: 'GET' }),
  create: (payload) =>
    api('/api/admin/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    api(`/api/admin/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id) =>
    api(`/api/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  publish: (id) =>
    api(`/api/admin/posts/${encodeURIComponent(id)}/publish`, { method: 'POST' }),
};

// Categories API
export const categoriesApi = {
  list: () => api('/api/categories', { method: 'GET' }),
  listWithCounts: () => api('/api/categories/with-counts', { method: 'GET' }),
  create: (name) =>
    api('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  delete: (id) =>
    api(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// Users API
export const usersApi = {
  list: () => api('/api/admin/users', { method: 'GET' }),
  create: (username, password, role) =>
    api('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }),
  delete: (id) =>
    api(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// Comments API
export const commentsApi = {
  list: () => api('/api/admin/comments', { method: 'GET' }),
  getPendingCount: () => api('/api/admin/comments/pending-count', { method: 'GET' }),
  getTrending: (days = 15, limit = 8) =>
    api(`/api/admin/comments/trending?days=${days}&limit=${limit}`, { method: 'GET' }),
  approve: (id) =>
    api(`/api/admin/comments/${encodeURIComponent(id)}/approve`, { method: 'POST' }),
  disapprove: (id) =>
    api(`/api/admin/comments/${encodeURIComponent(id)}/disapprove`, { method: 'DELETE' }),
  delete: (id) =>
    api(`/api/admin/comments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// Media API
export const mediaApi = {
  list: () => api('/api/admin/media', { method: 'GET' }),
  upload: (file) => uploadFile('/api/admin/upload-image', file),
};
