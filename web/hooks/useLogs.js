import { useState, useCallback, useMemo } from 'react';
import { logsApi } from '../lib/api';

export function useLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshLogs = useCallback(async (limit = 100) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await logsApi.list(0, limit);
      setLogs(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch logs');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      logs,
      isLoading,
      error,
      refreshLogs,
      setLogs,
    }),
    [logs, isLoading, error, refreshLogs]
  );
}
