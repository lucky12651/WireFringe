import { useState, useCallback, useMemo } from 'react';
import { mediaApi } from '../lib/api';

export function useMedia() {
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshMedia = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await mediaApi.list();
      setMedia(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch media');
      setMedia([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadMedia = useCallback(async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await mediaApi.upload(file);
      await refreshMedia();
      return { success: true, url: result.url };
    } catch (err) {
      setError(err?.message || 'Failed to upload media');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshMedia]);

  const mediaCount = useMemo(() => media.length, [media]);

  return useMemo(
    () => ({
      media,
      mediaCount,
      isLoading,
      error,
      refreshMedia,
      uploadMedia,
      setError,
    }),
    [media, mediaCount, isLoading, error, refreshMedia, uploadMedia]
  );
}
