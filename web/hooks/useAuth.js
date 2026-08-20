import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../lib/api';
import { accessFor } from '../lib/access';

const AuthContext = createContext(null);

function useAuthState() {
  const [me, setMe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthed = Boolean(me);

  const access = accessFor(me);
  const canManageUsers = access.canManageUsers;
  const canModerateComments = access.canModerateComments;
  const canViewPendingCommentsCount = access.isNewsroom;
  const isAuthor = access.isAuthor;

  const refreshMe = useCallback(async () => {
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          setMe(JSON.parse(storedUser));
        } catch (_) {}
      }
    }

    if (!token) {
      setMe(null);
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

      if (res?.requires2fa && res.ticket) {
        return { success: false, requires2fa: true, ticket: res.ticket };
      }

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

  const login2fa = useCallback(async (ticket, code) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authApi.login2fa(ticket, code);

      if (res && res.access_token) {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setMe(res.user);
        setIsInitialLoading(false);
        return { success: true, user: res.user };
      }

      return { success: false, error: 'Invalid authenticator code' };
    } catch (err) {
      setError(err?.message || 'Invalid authenticator code');
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setMe(null);
    setError(null);
    try {
      await authApi.logout();
    } catch {
      // Session clear is best-effort; local credentials are already gone.
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const updateProfile = useCallback(async (displayNameOrPayload) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authApi.updateProfile(displayNameOrPayload);
      setMe(user);
      if (typeof window !== 'undefined' && user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
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

  const updateBrandByline = useCallback(async (enabled) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authApi.updateBrandByline(enabled);
      setMe(user);
      return { success: true, user };
    } catch (err) {
      setError(err?.message || 'Failed to update brand byline');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadBrandLogo = useCallback(async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authApi.uploadBrandLogo(file);
      setMe(user);
      return { success: true, user };
    } catch (err) {
      setError(err?.message || 'Failed to upload brand logo');
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
      access,
      canManageUsers,
      canModerateComments,
      canViewPendingCommentsCount,
      isAuthor,
      refreshMe,
      login,
      login2fa,
      signup,
      logout,
      updateProfile,
      uploadPhoto,
      updateBrandByline,
      uploadBrandLogo,
      changePassword,
      setError,
    }),
    [
      me,
      isAuthed,
      isLoading,
      isInitialLoading,
      error,
      access,
      canManageUsers,
      canModerateComments,
      canViewPendingCommentsCount,
      isAuthor,
      refreshMe,
      login,
      login2fa,
      signup,
      logout,
      updateProfile,
      uploadPhoto,
      updateBrandByline,
      uploadBrandLogo,
      changePassword,
    ]
  );
}

export function AuthProvider({ children }) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
