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

  // Derived stats
  const creatorCounts = useMemo(() => {
    if (creatorCountsOverride instanceof Map) {
      return creatorCountsOverride;
    }
    return calculateCreatorCounts(posts);
  }, [posts, creatorCountsOverride]);

  const memberStats = useMemo(() => {
    const canManageUsers = true; // Admin context
    return calculateMemberStats(users, creatorCounts, canManageUsers);
  }, [users, creatorCounts]);

  return useMemo(
    () => ({
      users,
      isLoading,
      error,
      refreshUsers,
      setUsers,
      createUser,
      deleteUser,
      setUserPassword,
      setUserRole,
      creatorCounts,
      memberStats,
      setError,
    }),
    [
      users,
      isLoading,
      error,
      refreshUsers,
      setUsers,
      createUser,
      deleteUser,
      setUserPassword,
      setUserRole,
      creatorCounts,
      memberStats,
    ]
  );
}
