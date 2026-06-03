import { useState, useCallback, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { postsApi, fetcher } from '../lib/api';
import {
  calculatePostsByMonth,
  calculatePostGrowth,
  sortPostsForDisplay,
} from '../lib/utils';
import { LATEST_POSTS_LIMIT } from '../lib/constants';

export function usePosts(initialLimit = 20) {
  const [page, setPage] = useState(0);
  const limit = initialLimit;
  const offset = page * limit;

  const swrKey = limit > 0 
    ? `/api/admin/posts?offset=${offset}&limit=${limit}` 
    : '/api/admin/posts?limit=0';

  const { data: postsData, error: fetchError, isValidating } = useSWR(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const posts = useMemo(() => postsData?.posts || [], [postsData]);
  const postsCount = useMemo(() => postsData?.total || 0, [postsData]);
  const [actionError, setActionError] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { data: queueData, mutate: refreshQueue } = useSWR(
    '/api/admin/posts/queue',
    fetcher,
    { revalidateOnFocus: false }
  );

  const refreshPosts = useCallback(() => {
    return mutate(swrKey);
  }, [swrKey]);

  const setPosts = useCallback(
    (data) => {
      return mutate(swrKey, data, false);
    },
    [swrKey]
  );

  const createPost = useCallback(async (payload) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      const created = await postsApi.create(payload);
      await refreshPosts();
      return { success: true, post: created };
    } catch (err) {
      setActionError(err?.message || 'Failed to create post');
      return { success: false, error: err?.message };
    } finally {
      setIsActionLoading(false);
    }
  }, [refreshPosts]);

  const updatePost = useCallback(async (id, payload) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      const updated = await postsApi.update(id, payload);
      await refreshPosts();
      return { success: true, post: updated };
    } catch (err) {
      setActionError(err?.message || 'Failed to update post');
      return { success: false, error: err?.message };
    } finally {
      setIsActionLoading(false);
    }
  }, [refreshPosts]);

  const deletePost = useCallback(async (id) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      await postsApi.delete(id);
      await refreshPosts();
      return { success: true };
    } catch (err) {
      setActionError(err?.message || 'Failed to delete post');
      return { success: false, error: err?.message };
    } finally {
      setIsActionLoading(false);
    }
  }, [refreshPosts]);

  const publishPost = useCallback(async (id) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      await postsApi.publish(id);
      await refreshPosts();
      return { success: true };
    } catch (err) {
      setActionError(err?.message || 'Failed to publish post');
      return { success: false, error: err?.message };
    } finally {
      setIsActionLoading(false);
    }
  }, [refreshPosts]);

  const processQueueItem = useCallback(async (link) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      const res = await postsApi.processQueueItem(link);
      await Promise.all([refreshPosts(), refreshQueue()]);
      
      if (res && res.success === false) {
        setActionError(res.message || 'Processing failed');
        return { success: false, error: res.message };
      }
      
      return { success: true };
    } catch (err) {
      setActionError(err?.message || 'Failed to process queue item');
      return { success: false, error: err?.message };
    } finally {
      setIsActionLoading(false);
    }
  }, [refreshPosts, refreshQueue]);

  const deleteQueueItem = useCallback(async (link) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      await postsApi.deleteQueueItem(link);
      await refreshQueue();
      return { success: true };
    } catch (err) {
      setActionError(err?.message || 'Failed to delete queue item');
      return { success: false, error: err?.message };
    } finally {
      setIsActionLoading(false);
    }
  }, [refreshQueue]);

  const bulkDeleteQueueItems = useCallback(async (links) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      await postsApi.bulkDeleteQueueItems(links);
      await refreshQueue();
      return { success: true };
    } catch (err) {
      setActionError(err?.message || 'Failed to bulk delete queue items');
      return { success: false, error: err?.message };
    } finally {
      setIsActionLoading(false);
    }
  }, [refreshQueue]);

  const bulkProcessQueueItems = useCallback(async (links) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      const res = await postsApi.bulkProcessQueueItems(links);
      await Promise.all([refreshPosts(), refreshQueue()]);
      return { success: true, results: res?.results || [] };
    } catch (err) {
      setActionError(err?.message || 'Failed to bulk process queue items');
      return { success: false, error: err?.message };
    } finally {
      setIsActionLoading(false);
    }
  }, [refreshPosts, refreshQueue]);

  const refreshQueueFeeds = useCallback(async () => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      await postsApi.refreshQueueFeeds();
      await refreshQueue();
      return { success: true };
    } catch (err) {
      setActionError(err?.message || 'Failed to refresh RSS feeds');
      return { success: false, error: err?.message };
    } finally {
      setIsActionLoading(false);
    }
  }, [refreshQueue]);

  // Derived data
  const sortedPosts = useMemo(() => {
    return sortPostsForDisplay(posts);
  }, [posts]);

  const latestPosts = useMemo(() => {
    const list = [...(posts || [])]
      .map((p) => ({ ...p, dateObj: p?.date ? new Date(p.date) : null }))
      .sort((a, b) => {
        const ta = a.dateObj ? a.dateObj.getTime() : -Infinity;
        const tb = b.dateObj ? b.dateObj.getTime() : -Infinity;
        return tb - ta;
      });
    return list.slice(0, LATEST_POSTS_LIMIT);
  }, [posts]);

  const postsByMonth = useMemo(() => {
    return calculatePostsByMonth(posts, 6);
  }, [posts]);

  const postGrowth30 = useMemo(() => {
    return calculatePostGrowth(posts, 30);
  }, [posts]);

  const isLoading = isValidating && !postsData;
  const error = fetchError || actionError;

  return useMemo(
    () => ({
      posts,
      postsCount,
      sortedPosts,
      latestPosts,
      postsByMonth,
      postGrowth30,
      isLoading,
      isActionLoading,
      error,
      page,
      setPage,
      limit,
      refreshPosts,
      setPosts,
      createPost,
      updatePost,
      deletePost,
      publishPost,
      processQueueItem,
      deleteQueueItem,
      bulkDeleteQueueItems,
      bulkProcessQueueItems,
      refreshQueueFeeds,
      setError: setActionError,
      queue: queueData || [],
      refreshQueue,
    }),
    [
      posts,
      postsCount,
      sortedPosts,
      latestPosts,
      postsByMonth,
      postGrowth30,
      isLoading,
      isActionLoading,
      error,
      page,
      limit,
      refreshPosts,
      setPosts,
      createPost,
      updatePost,
      deletePost,
      publishPost,
      processQueueItem,
      deleteQueueItem,
      bulkDeleteQueueItems,
      bulkProcessQueueItems,
      refreshQueueFeeds,
      queueData,
      refreshQueue,
    ]
  );
}
