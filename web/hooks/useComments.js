import { useState, useCallback, useMemo } from 'react';
import { commentsApi } from '../lib/api';
import { TRENDING_COMMENTS_DAYS, TRENDING_COMMENTS_LIMIT } from '../lib/constants';

export function useComments() {
  const [comments, setComments] = useState([]);
  const [trendingComments, setTrendingComments] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await commentsApi.list();
      setComments(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch comments');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshTrendingComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await commentsApi.getTrending(TRENDING_COMMENTS_DAYS, TRENDING_COMMENTS_LIMIT);
      setTrendingComments(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch trending comments');
      setTrendingComments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    try {
      const data = await commentsApi.getPendingCount();
      setPendingCount(Number(data?.count || 0));
    } catch (err) {
      setPendingCount(0);
    }
  }, []);

  const approveComment = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await commentsApi.approve(id);
      await refreshComments();
      await refreshPendingCount();
      await refreshTrendingComments();
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to approve comment');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshComments, refreshPendingCount, refreshTrendingComments]);

  const disapproveComment = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await commentsApi.disapprove(id);
      await refreshComments();
      await refreshPendingCount();
      await refreshTrendingComments();
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to disapprove comment');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshComments, refreshPendingCount, refreshTrendingComments]);

  const deleteComment = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await commentsApi.delete(id);
      await refreshComments();
      await refreshTrendingComments();
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to delete comment');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshComments, refreshTrendingComments]);

  const pendingComments = useMemo(() => {
    return (comments || []).filter((c) => !c?.approved);
  }, [comments]);

  return useMemo(
    () => ({
      comments,
      trendingComments,
      pendingCount,
      pendingComments,
      isLoading,
      error,
      refreshComments,
      refreshTrendingComments,
      refreshPendingCount,
      approveComment,
      disapproveComment,
      deleteComment,
      setError,
    }),
    [
      comments,
      trendingComments,
      pendingCount,
      pendingComments,
      isLoading,
      error,
      refreshComments,
      refreshTrendingComments,
      refreshPendingCount,
      approveComment,
      disapproveComment,
      deleteComment,
    ]
  );
}
