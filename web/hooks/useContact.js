import { useState, useCallback, useMemo } from 'react';
import { contactApi } from '../lib/api';

export function useContact() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await contactApi.list();
      setMessages(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch contact messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await contactApi.unreadCount();
      setUnreadCount(Number(data?.count || 0));
    } catch (_) {
      setUnreadCount(0);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      const updated = await contactApi.markRead(id);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      await refreshUnreadCount();
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.message };
    }
  }, [refreshUnreadCount]);

  const deleteMessage = useCallback(async (id) => {
    try {
      await contactApi.delete(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      await refreshUnreadCount();
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.message };
    }
  }, [refreshUnreadCount]);

  return useMemo(
    () => ({
      messages,
      unreadCount,
      isLoading,
      error,
      refreshMessages,
      refreshUnreadCount,
      markRead,
      deleteMessage,
      setMessages,
    }),
    [messages, unreadCount, isLoading, error, refreshMessages, refreshUnreadCount, markRead, deleteMessage]
  );
}
