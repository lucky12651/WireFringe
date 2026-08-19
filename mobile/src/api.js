import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { absUrl } from './format';

const FETCH_MS = 15000;

export function getApiBase() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');

  // USB `adb reverse` maps the phone's localhost to this PC. Prefer that
  // so Sign in works even when the phone is on mobile data, not Wi‑Fi.
  if (Platform.OS === 'android') return 'http://127.0.0.1:8000';

  const hostUri = [
    Constants.expoConfig?.hostUri,
    Constants.linkingUri,
    Constants.debuggerHost,
    Constants.experienceUrl,
  ]
    .filter(Boolean)
    .join(' ');
  const ip = String(hostUri).match(/(\d+\.\d+\.\d+\.\d+)/)?.[1];
  if (ip && ip !== '127.0.0.1' && ip !== '10.0.2.2') {
    return `http://${ip}:8000`;
  }
  return 'http://127.0.0.1:8000';
}

async function parseError(res) {
  let detail = `${res.status} ${res.statusText || ''}`.trim();
  try {
    const data = await res.json();
    if (data?.detail) {
      detail = Array.isArray(data.detail)
        ? data.detail.map((d) => d.msg || d).join(', ')
        : String(data.detail);
    }
  } catch {
    // ignore
  }
  return detail;
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    throw new Error(
      aborted
        ? `Server timed out (${getApiBase()}). Keep USB plugged in, or join the same Wi‑Fi.`
        : `Cannot reach server at ${getApiBase()}. ${err?.message || ''}`.trim()
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function mediaUrl(path) {
  return absUrl(path, getApiBase());
}

export const endpoints = {
  posts: () => api('/api/posts'),
  forYou: (limit = 30) => api(`/api/posts/for-you?limit=${limit}`),
  post: (id) => api(`/api/posts/${encodeURIComponent(id)}`),
  related: (id) => api(`/api/posts/${encodeURIComponent(id)}/related`),
  search: (q) => api(`/api/search?q=${encodeURIComponent(q)}`),
  frontpage: () => api('/api/frontpage'),
  categories: () => api('/api/categories'),
  comments: (id) => api(`/api/posts/${encodeURIComponent(id)}/comments`),
  addComment: (id, comment, token) =>
    api(`/api/posts/${encodeURIComponent(id)}/comments`, {
      method: 'POST',
      body: { comment },
      token,
    }),
  login: (email, password) =>
    api('/api/admin/login', {
      method: 'POST',
      body: { email, username: email, password },
    }),
  signup: (email, password, displayName) =>
    api('/api/admin/signup', {
      method: 'POST',
      body: { email, username: email, password, displayName },
    }),
  me: (token) => api('/api/admin/me', { token }),
  follows: (token) => api('/api/me/follows', { token }),
  follow: (kind, target, token) =>
    api('/api/me/follows', { method: 'POST', body: { kind, target }, token }),
  unfollow: (kind, target, token) =>
    api('/api/me/follows', { method: 'DELETE', body: { kind, target }, token }),
};
