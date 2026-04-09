import { useState, useCallback, useMemo } from 'react';
import { postsApi } from '../lib/api';
import {
  calculatePostsByMonth,
  calculatePostGrowth,
  sortPostsForDisplay,
} from '../lib/utils';
import { LATEST_POSTS_LIMIT } from '../lib/constants';

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await postsApi.list();
      setPosts(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch posts');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPost = useCallback(async (payload) => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await postsApi.create(payload);
      await refreshPosts();
      return { success: true, post: created };
    } catch (err) {
      setError(err?.message || 'Failed to create post');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshPosts]);

  const updatePost = useCallback(async (id, payload) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await postsApi.update(id, payload);
      await refreshPosts();
      return { success: true, post: updated };
    } catch (err) {
      setError(err?.message || 'Failed to update post');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshPosts]);

  const deletePost = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await postsApi.delete(id);
      await refreshPosts();
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to delete post');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshPosts]);

  const publishPost = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await postsApi.publish(id);
      await refreshPosts();
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to publish post');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
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

  return useMemo(
    () => ({
      posts,
      postsCount,
      sortedPosts,
      latestPosts,
      postsByMonth,
      postGrowth30,
      isLoading,
      error,
      refreshPosts,
      createPost,
      updatePost,
      deletePost,
      publishPost,
      setError,
    }),
    [
      posts,
      postsCount,
      sortedPosts,
      latestPosts,
      postsByMonth,
      postGrowth30,
      isLoading,
      error,
      refreshPosts,
      createPost,
      updatePost,
      deletePost,
      publishPost,
    ]
  );
}
