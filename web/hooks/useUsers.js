import { useState, useCallback, useMemo } from 'react';
import { usersApi } from '../lib/api';
import { calculateCreatorCounts, calculateMemberStats } from '../lib/utils';

export function useUsers(posts = [], creatorCountsOverride = null) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersApi.list();
      setUsers(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = useCallback(async (username, password, role) => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await usersApi.create(username, password, role);
      await refreshUsers();
      return { success: true, user: created };
    } catch (err) {
      setError(err?.message || 'Failed to create user');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshUsers]);

  const deleteUser = useCallback(async (id, options = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await usersApi.delete(id, options);
      await refreshUsers();
      return { success: true, result };
    } catch (err) {
      setError(err?.message || 'Failed to delete user');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshUsers]);

  const setUserPassword = useCallback(async (id, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      await usersApi.setPassword(id, newPassword);
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to update password');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUserRole = useCallback(async (id, role) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await usersApi.setRole(id, role);
      await refreshUsers();
      return { success: true, user: updated };
    } catch (err) {
      setError(err?.message || 'Failed to update role');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshUsers]);

  const setUserBotAccess = useCallback(async (id, enabled) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await usersApi.setBotAccess(id, enabled);
      await refreshUsers();
      return { success: true, user: updated };
    } catch (err) {
      setError(err?.message || 'Failed to update bot access');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshUsers]);

  const transferPosts = useCallback(
    async (id, transferToUserId) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await usersApi.transferPosts(id, transferToUserId);
        await refreshUsers();
        return { success: true, result };
      } catch (err) {
        setError(err?.message || 'Failed to transfer posts');
        return { success: false, error: err?.message };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUsers]
  );

  const claimOrphan = useCallback(
    async (payload) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await usersApi.claimOrphan(payload);
        await refreshUsers();
        return { success: true, result };
      } catch (err) {
        setError(err?.message || 'Failed to create account for author');
        return { success: false, error: err?.message };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUsers]
  );

  const reassignOrphan = useCallback(
    async (creatorName, transferToUserId) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await usersApi.reassignOrphan(creatorName, transferToUserId);
        await refreshUsers();
        return { success: true, result };
      } catch (err) {
        setError(err?.message || 'Failed to reassign posts');
        return { success: false, error: err?.message };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUsers]
  );

  const deleteOrphanPosts = useCallback(
    async (creatorName) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await usersApi.deleteOrphanPosts(creatorName);
        await refreshUsers();
        return { success: true, result };
      } catch (err) {
        setError(err?.message || 'Failed to delete posts');
        return { success: false, error: err?.message };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUsers]
  );

  // Derived stats — accounts only for member charts; orphans still appear in users list
  const accountUsers = useMemo(
    () =>
      (users || []).filter(
        (u) => !u.isOrphan && u.role !== 'orphan' && Number(u.id) > 0
      ),
    [users]
  );

  const creatorCounts = useMemo(() => {
    if (creatorCountsOverride instanceof Map) {
      return creatorCountsOverride;
    }
    return calculateCreatorCounts(posts);
  }, [posts, creatorCountsOverride]);

  const memberStats = useMemo(() => {
    const canManageUsers = true; // Admin context
    return calculateMemberStats(accountUsers, creatorCounts, canManageUsers);
  }, [accountUsers, creatorCounts]);

  return useMemo(
    () => ({
      users,
      accountUsers,
      isLoading,
      error,
      refreshUsers,
      setUsers,
      createUser,
      deleteUser,
      setUserPassword,
      setUserRole,
      setUserBotAccess,
      transferPosts,
      claimOrphan,
      reassignOrphan,
      deleteOrphanPosts,
      creatorCounts,
      memberStats,
      setError,
    }),
    [
      users,
      accountUsers,
      isLoading,
      error,
      refreshUsers,
      setUsers,
      createUser,
      deleteUser,
      setUserPassword,
      setUserRole,
      setUserBotAccess,
      transferPosts,
      claimOrphan,
      reassignOrphan,
      deleteOrphanPosts,
      creatorCounts,
      memberStats,
    ]
  );
}
