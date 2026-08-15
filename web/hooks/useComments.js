import { useState, useCallback, useMemo } from 'react';
import { commentsApi } from '../lib/api';
import { TRENDING_COMMENTS_DAYS, TRENDING_COMMENTS_LIMIT } from '../lib/constants';

export function useComments() {
  const [comments, setComments] = useState([]);
  const [reports, setReports] = useState([]);
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

  const refreshReports = useCallback(async () => {
    try {
      const data = await commentsApi.listReports();
      setReports(data || []);
    } catch (err) {
      setReports([]);
      setError(err?.message || 'Failed to fetch comment reports');
    }
  }, []);

  const dismissReport = useCallback(async (id) => {
    try {
      await commentsApi.dismissReport(id);
      await refreshReports();
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.message };
    }
  }, [refreshReports]);

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
      await refreshReports();
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to disapprove comment');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshComments, refreshPendingCount, refreshTrendingComments, refreshReports]);

  const deleteComment = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await commentsApi.delete(id);
      await refreshComments();
      await refreshTrendingComments();
      await refreshReports();
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to delete comment');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshComments, refreshTrendingComments, refreshReports]);

  const pendingComments = useMemo(() => {
    return (comments || []).filter((c) => !c?.approved);
  }, [comments]);

  return useMemo(
    () => ({
      comments,
      reports,
      trendingComments,
      pendingCount,
      pendingComments,
      isLoading,
      error,
      refreshComments,
      setComments,
      refreshTrendingComments,
      setTrendingComments,
      refreshPendingCount,
      setPendingCount,
      refreshReports,
      dismissReport,
      approveComment,
      disapproveComment,
      deleteComment,
      setError,
    }),
    [
      comments,
      reports,
      setComments,
      trendingComments,
      setTrendingComments,
      pendingCount,
      setPendingCount,
      pendingComments,
      isLoading,
      error,
      refreshComments,
      refreshReports,
      dismissReport,
      refreshTrendingComments,
      refreshPendingCount,
      approveComment,
      disapproveComment,
      deleteComment,
    ]
  );
}
