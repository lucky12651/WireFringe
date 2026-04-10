import { useState, useCallback, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { postsApi, fetcher } from '../lib/api';
import {
  calculatePostsByMonth,
  calculatePostGrowth,
  sortPostsForDisplay,
} from '../lib/utils';
import { LATEST_POSTS_LIMIT } from '../lib/constants';

export function usePosts() {
  const { data: postsData, error: fetchError, isValidating } = useSWR('/api/admin/posts', fetcher, {
    revalidateOnFocus: false,
  });

  const posts = useMemo(() => postsData || [], [postsData]);
  const [actionError, setActionError] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const refreshPosts = useCallback(() => {
    return mutate('/api/admin/posts');
  }, []);

  const setPosts = useCallback((data) => {
    return mutate('/api/admin/posts', data, false);
  }, []);

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

  // Derived data
  const postsCount = useMemo(() => posts.length, [posts]);

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
      refreshPosts,
      setPosts,
      createPost,
      updatePost,
      deletePost,
      publishPost,
      setError: setActionError,
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
      refreshPosts,
      setPosts,
      createPost,
      updatePost,
      deletePost,
      publishPost,
    ]
  );
}
