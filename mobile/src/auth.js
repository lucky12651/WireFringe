import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { endpoints } from './api';

const KEY_TOKEN = 'wf_token';
const KEY_USER = 'wf_user';
const KEY_THEME = 'wf_theme';

async function storageGet(key) {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function storageSet(key, value) {
  if (Platform.OS === 'web') {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // ignore
    }
    return;
  }
  try {
    if (value == null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [follows, setFollows] = useState([]);
  const [ready, setReady] = useState(false);
  const [themeName, setThemeName] = useState('dark');

  useEffect(() => {
    (async () => {
      const [savedToken, savedUser, savedTheme] = await Promise.all([
        storageGet(KEY_TOKEN),
        storageGet(KEY_USER),
        storageGet(KEY_THEME),
      ]);
      if (savedTheme === 'light' || savedTheme === 'dark') setThemeName(savedTheme);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }
      if (savedToken) setToken(savedToken);
      setReady(true);
      if (savedToken) {
        try {
          const me = await endpoints.me(savedToken);
          setUser(me);
          await storageSet(KEY_USER, JSON.stringify(me));
          const f = await endpoints.follows(savedToken);
          setFollows(Array.isArray(f) ? f : []);
        } catch {
          setToken(null);
          setUser(null);
          await storageSet(KEY_TOKEN, null);
          await storageSet(KEY_USER, null);
        }
      }
    })();
  }, []);

  const persistSession = async (accessToken, nextUser) => {
    setToken(accessToken);
    setUser(nextUser);
    await storageSet(KEY_TOKEN, accessToken);
    await storageSet(KEY_USER, JSON.stringify(nextUser));
    try {
      const f = await endpoints.follows(accessToken);
      setFollows(Array.isArray(f) ? f : []);
    } catch {
      setFollows([]);
    }
  };

  const refreshFollows = async (overrideToken) => {
    const t = overrideToken || token;
    if (!t) {
      setFollows([]);
      return [];
    }
    const f = await endpoints.follows(t);
    const list = Array.isArray(f) ? f : [];
    setFollows(list);
    return list;
  };

  const value = useMemo(
    () => ({
      ready,
      token,
      user,
      follows,
      themeName,
      isAuthed: Boolean(token && user),
      setThemeName: async (name) => {
        const next = name === 'light' ? 'light' : 'dark';
        setThemeName(next);
        await storageSet(KEY_THEME, next);
      },
      refreshFollows,
      login: async (email, password) => {
        const res = await endpoints.login(email, password);
        await persistSession(res.access_token, res.user);
        return res.user;
      },
      signup: async (email, password, displayName) => {
        const res = await endpoints.signup(email, password, displayName);
        await persistSession(res.access_token, res.user);
        return res.user;
      },
      logout: async () => {
        setToken(null);
        setUser(null);
        setFollows([]);
        await storageSet(KEY_TOKEN, null);
        await storageSet(KEY_USER, null);
      },
      follow: async (kind, target) => {
        if (!token) throw new Error('Sign in to follow');
        await endpoints.follow(kind, target, token);
        return refreshFollows();
      },
      unfollow: async (kind, target) => {
        if (!token) throw new Error('Sign in to unfollow');
        await endpoints.unfollow(kind, target, token);
        return refreshFollows();
      },
    }),
    [ready, token, user, follows, themeName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
