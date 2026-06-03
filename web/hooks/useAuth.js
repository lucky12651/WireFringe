import { useState,useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../lib/api';

export function useAuth() {
  const [me, setMe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthed = Boolean(me);

  const canManageUsers = me?.role === 'admin';
  const canModerateComments = me?.role === 'admin' || me?.role === 'editor';
  const canViewPendingCommentsCount = Boolean(me);
  const isAuthor = me?.role === 'author';

  const refreshMe = useCallback(async () => {
    let token = null;
    // Try to load from localStorage first for instant UI
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setMe(JSON.parse(storedUser));
        } catch (_) {}
      }
    }

    // If no token, don't even try to fetch me
    if (!token) {
      setIsInitialLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const user = await authApi.me();
      setMe(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }
      return user;
    } catch (err) {
      setMe(null);
      // Quietly handle 401/Not authenticated - it's a valid state for unauthenticated users
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      // Only set error if it's NOT a "not authenticated" error
      if (err?.message !== 'Not authenticated' && err?.message !== '401 Unauthorized') {
        setError(err?.message || 'Failed to fetch user');
      }
      return null;
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authApi.login(username, password);
      
      if (res && res.access_token) {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setMe(res.user);
        setIsInitialLoading(false);
        return { success: true, user: res.user };
      }
      
      return { success: false, error: 'Login failed: No token received' };
    } catch (err) {
      setError(err?.message || 'Login failed');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (username, password, displayName) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authApi.signup(username, password, displayName);
      
      if (res && res.access_token) {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setMe(res.user);
        return { success: true, user: res.user };
      }
      
      return { success: false, error: 'Signup failed: No token received' };
    } catch (err) {
      setError(err?.message || 'Signup failed');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setMe(null);
      setError(null);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

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
      isInitialLoading,
      error,
      canManageUsers,
      canModerateComments,
      canViewPendingCommentsCount,
      isAuthor,
      refreshMe,
      login,
      signup,
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
      isInitialLoading,
      error,
      canManageUsers,
      canModerateComments,
      canViewPendingCommentsCount,
      isAuthor,
      refreshMe,
      login,
      signup,
      logout,
      updateProfile,
      uploadPhoto,
      changePassword,
    ]
  );
}
