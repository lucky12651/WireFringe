import { useState, useCallback, useMemo } from 'react';
import { adsenseApi } from '../lib/api';
import { clearAdsenseConfigCache } from '../lib/ads';

export function useAdsenseSettings() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adsenseApi.get();
      setSettings(data || null);
      return { success: true, data };
    } catch (err) {
      setError(err?.message || 'Failed to load AdSense settings');
      return { success: false, error: err?.message || 'Failed to load' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = useCallback(async (payload) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adsenseApi.update(payload);
      setSettings(data || null);
      // Drop public-site cache so homepage/privacy reload fresh IDs
      clearAdsenseConfigCache();
      return { success: true, data };
    } catch (err) {
      const msg = err?.message || 'Failed to save';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adsenseApi.clear();
      setSettings(data || null);
      clearAdsenseConfigCache();
      return { success: true, data };
    } catch (err) {
      const msg = err?.message || 'Failed to clear credentials';
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
      clear,
      setSettings,
    }),
    [settings, isLoading, error, refresh, save, clear]
  );
}
