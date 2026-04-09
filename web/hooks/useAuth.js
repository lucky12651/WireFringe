import { useState, useCallback, useMemo } from 'react';
import { authApi } from '../lib/api';

export function useAuth() {
  const [me, setMe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthed = Boolean(me);

  const canManageUsers = me?.role === 'admin';
  const canModerateComments = me?.role === 'admin' || me?.role === 'editor';
  const canViewPendingCommentsCount = Boolean(me);
  const isAuthor = me?.role === 'author';

  const refreshMe = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authApi.me();
      setMe(user);
      return user;
    } catch (err) {
      setMe(null);
      setError(err?.message || 'Failed to fetch user');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authApi.login(username, password);
      setMe(user);
      return { success: true, user };
    } catch (err) {
      setError(err?.message || 'Login failed');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setMe(null);
      setError(null);
    }
  }, []);

  const updateProfile = useCallback(async (displayName) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authApi.updateProfile(displayName);
      setMe(user);
      return { success: true, user };
    } catch (err) {
      setError(err?.message || 'Failed to update profile');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadPhoto = useCallback(async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authApi.uploadPhoto(file);
      setMe(user);
      return { success: true, user };
    } catch (err) {
      setError(err?.message || 'Failed to upload photo');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      await authApi.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to change password');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      me,
      isAuthed,
      isLoading,
      error,
      canManageUsers,
      canModerateComments,
      canViewPendingCommentsCount,
      isAuthor,
      refreshMe,
      login,
      logout,
      updateProfile,
      uploadPhoto,
      changePassword,
      setError,
    }),
    [
      me,
      isAuthed,
      isLoading,
      error,
      canManageUsers,
      canModerateComments,
      canViewPendingCommentsCount,
      isAuthor,
      refreshMe,
      login,
      logout,
      updateProfile,
      uploadPhoto,
      changePassword,
    ]
  );
}
