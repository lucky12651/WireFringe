import { useState, useCallback, useMemo, useRef } from 'react';
import { mutate } from 'swr';
import { botApi } from '../lib/api';

export function useBotSettings() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Drop stale responses when a newer request finishes first (prevents toggle flip-back).
  const reqIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++reqIdRef.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = await botApi.get();
      if (id !== reqIdRef.current) return { success: true, data, stale: true };
      setSettings(data || null);
      return { success: true, data };
    } catch (err) {
      if (id !== reqIdRef.current) return { success: false, error: err?.message, stale: true };
      setError(err?.message || 'Failed to load bot settings');
      return { success: false, error: err?.message || 'Failed to load' };
    } finally {
      if (id === reqIdRef.current) setIsLoading(false);
    }
  }, []);

  const save = useCallback(async (payload) => {
    const id = ++reqIdRef.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = await botApi.update(payload);
      if (id !== reqIdRef.current) return { success: true, data, stale: true };
      setSettings(data || null);
      return { success: true, data };
    } catch (err) {
      if (id !== reqIdRef.current) return { success: false, error: err?.message, stale: true };
      const msg = err?.message || 'Failed to save';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      if (id === reqIdRef.current) setIsLoading(false);
    }
  }, []);

  const hideArticles = useCallback(async () => {
    const id = ++reqIdRef.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = await botApi.hideArticles();
      const full = await botApi.get();
      await mutate('/api/posts');
      if (id !== reqIdRef.current) return { success: true, data, stale: true };
      setSettings(full || null);
      return { success: true, data };
    } catch (err) {
      if (id !== reqIdRef.current) return { success: false, error: err?.message, stale: true };
      const msg = err?.message || 'Failed to hide articles';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      if (id === reqIdRef.current) setIsLoading(false);
    }
  }, []);

  const unhideArticles = useCallback(async () => {
    const id = ++reqIdRef.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = await botApi.unhideArticles();
      const full = await botApi.get();
      await mutate('/api/posts');
      if (id !== reqIdRef.current) return { success: true, data, stale: true };
      setSettings(full || null);
      return { success: true, data };
    } catch (err) {
      if (id !== reqIdRef.current) return { success: false, error: err?.message, stale: true };
      const msg = err?.message || 'Failed to unhide articles';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      if (id === reqIdRef.current) setIsLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      settings,
      isLoading,
      error,
      refresh,
      save,
      hideArticles,
      unhideArticles,
      setSettings,
    }),
    [settings, isLoading, error, refresh, save, hideArticles, unhideArticles]
  );
}
