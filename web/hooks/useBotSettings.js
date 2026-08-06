import { useState, useCallback, useMemo } from 'react';
import { botApi } from '../lib/api';

export function useBotSettings() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await botApi.get();
      setSettings(data || null);
      return { success: true, data };
    } catch (err) {
      setError(err?.message || 'Failed to load bot settings');
      return { success: false, error: err?.message || 'Failed to load' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = useCallback(async (payload) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await botApi.update(payload);
      setSettings(data || null);
      return { success: true, data };
    } catch (err) {
      const msg = err?.message || 'Failed to save';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hideArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await botApi.hideArticles();
      // Refresh full settings (includes toggles + stats)
      const full = await botApi.get();
      setSettings(full || null);
      return { success: true, data };
    } catch (err) {
      const msg = err?.message || 'Failed to hide articles';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unhideArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await botApi.unhideArticles();
      const full = await botApi.get();
      setSettings(full || null);
      return { success: true, data };
    } catch (err) {
      const msg = err?.message || 'Failed to unhide articles';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
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
