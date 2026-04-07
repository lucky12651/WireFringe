import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getTheme, initTheme, setTheme } from '../lib/theme';

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (_) {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

const BUCKETS = ['Tech', 'AI & Future Tech', 'Business & Markets', 'Personal Finance'];

function formatDateShort(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime?.())) return '';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

function monthKey(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime?.())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function pctChange(current, previous) {
  if (!previous) {
    if (!current) return { text: '0%', dir: 'flat' };
    return { text: '∞', dir: 'up' };
  }
  const v = ((current - previous) / previous) * 100;
  const dir = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
  return { text: `${Math.abs(v).toFixed(2)}%`, dir };
}

export default function AdminPage() {
  const [me, setMe] = useState(null);
  const isAuthed = Boolean(me);
  const [activeView, setActiveView] = useState('dashboard');
  const [themeMode, setThemeMode] = useState('dark');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginHint, setLoginHint] = useState('');

  const [posts, setPosts] = useState([]);
  const [postsHint, setPostsHint] = useState('');

  const [postId, setPostId] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postBucket, setPostBucket] = useState('Tech');
  const [postOgImg, setPostOgImg] = useState('');
  const [postReadMinutes, setPostReadMinutes] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const postFormMode = postId ? 'Edit' : 'New';

  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [userHint, setUserHint] = useState('');

  const [media, setMedia] = useState([]);
  const [mediaHint, setMediaHint] = useState('');

  const canManageUsers = me?.role === 'admin';

  const postsCount = useMemo(() => String(posts.length), [posts]);

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of posts || []) {
      const b = String(p?.bucket || '').trim();
      if (b) set.add(b);
    }
    if (!set.size) BUCKETS.forEach((b) => set.add(b));
    return [...set.values()].sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const categoriesWithCounts = useMemo(() => {
    const map = new Map(categories.map((c) => [c, 0]));
    for (const p of posts || []) {
      const b = String(p?.bucket || '').trim();
      if (!b) continue;
      map.set(b, (map.get(b) || 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [posts, categories]);

  const creatorCounts = useMemo(() => {
    const out = new Map();
    for (const p of posts || []) {
      const key = (p?.creator || '').trim() || 'Unknown';
      out.set(key, (out.get(key) || 0) + 1);
    }
    return out;
  }, [posts]);

  const memberStats = useMemo(() => {
    if (canManageUsers && Array.isArray(users) && users.length) {
      const list = users
        .map((u) => ({
          username: u.username,
          role: u.role,
          count: creatorCounts.get(u.username) || 0,
        }))
        .sort((a, b) => b.count - a.count || a.username.localeCompare(b.username));

      return list;
    }

    const list = [...creatorCounts.entries()]
      .map(([username, count]) => ({ username, role: '', count }))
      .sort((a, b) => b.count - a.count || a.username.localeCompare(b.username));

    return list;
  }, [canManageUsers, users, creatorCounts]);

  const postsByMonth = useMemo(() => {
    const now = new Date();
    const keys = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
    }
    const counts = new Map(keys.map((k) => [k, 0]));
    for (const p of posts || []) {
      if (!p?.date) continue;
      const k = monthKey(p.date);
      if (!k) continue;
      if (!counts.has(k)) continue;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    return keys.map((k) => {
      const [yStr, mStr] = String(k).split('-');
      const year = Number(yStr);
      const monthIndex = Number(mStr) - 1;
      const label = Number.isFinite(year) && monthIndex >= 0 && monthIndex <= 11
        ? new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short' })
        : String(k);

      return {
        key: k,
        label,
        count: counts.get(k) || 0,
      };
    });
  }, [posts]);

  const postGrowth30 = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const startCurrent = now - 30 * day;
    const startPrev = now - 60 * day;

    let current = 0;
    let prev = 0;

    for (const p of posts || []) {
      if (!p?.date) continue;
      const t = new Date(p.date).getTime();
      if (Number.isNaN(t)) continue;
      if (t >= startCurrent) current++;
      else if (t >= startPrev) prev++;
    }

    return { current, prev, delta: pctChange(current, prev) };
  }, [posts]);

  const sortedPosts = useMemo(() => {
    const list = [...(posts || [])].map((p) => ({
      ...p,
      dateObj: p?.date ? new Date(p.date) : null,
    }));
    list.sort((a, b) => {
      const ta = a.dateObj ? a.dateObj.getTime() : -Infinity;
      const tb = b.dateObj ? b.dateObj.getTime() : -Infinity;
      return tb - ta;
    });
    return list;
  }, [posts]);

  const latestPosts = useMemo(() => sortedPosts.slice(0, 6), [sortedPosts]);

  function resetPostForm() {
    setPostId('');
    setPostTitle('');
    setPostBucket('Tech');
    setPostOgImg('');
    setPostReadMinutes('');
    setPostExcerpt('');
    setPostContent('');
    setPostsHint('');
  }

  function loadPostIntoForm(p) {
    setPostId(p.id || '');
    setPostTitle(p.title || '');
    setPostBucket(p.bucket || 'Tech');
    setPostOgImg(p.ogImg || '');
    setPostReadMinutes(p.readMinutes ? String(p.readMinutes) : '');
    setPostExcerpt(p.excerpt || '');
    setPostContent(p.content || '');
    setPostsHint('');
  }

  async function refreshMe() {
    try {
      const out = await api('/api/admin/me', { method: 'GET' });
      setMe(out);
      return out;
    } catch (_) {
      setMe(null);
      return null;
    }
  }

  async function refreshPosts() {
    const out = await api('/api/admin/posts', { method: 'GET' });
    setPosts(out || []);
  }

  async function refreshMedia() {
    try {
      const out = await api('/api/admin/media', { method: 'GET' });
      setMedia(out || []);
    } catch (err) {
      console.error(err);
      setMedia([]);
    }
  }

  async function refreshUsers() {
    const user = me;
    if (!user || user.role !== 'admin') {
      setUsers([]);
      return;
    }

    const out = await api('/api/admin/users', { method: 'GET' });
    setUsers(out || []);
  }

  useEffect(() => {
    (async () => {
      initTheme({ defaultTheme: 'dark' });
      setThemeMode(getTheme());

      const user = await refreshMe();
      if (!user) return;
      resetPostForm();
      await refreshPosts();
      await refreshMedia();
      if (user.role === 'admin') {
        await api('/api/admin/users', { method: 'GET' })
          .then((out) => setUsers(out || []))
          .catch((err) => console.error(err));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLoginSubmit(e) {
    e.preventDefault();
    setLoginHint('');

    try {
      const out = await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      setMe(out);
      resetPostForm();
      await refreshPosts();
      await refreshMedia();
      setActiveView('dashboard');
      if (out?.role === 'admin') {
        const u = await api('/api/admin/users', { method: 'GET' });
        setUsers(u || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setLoginHint(String(err?.message || err));
    }
  }

  async function onLogout() {
    try {
      await api('/api/admin/logout', { method: 'POST' });
    } finally {
      setMe(null);
      setPosts([]);
      setUsers([]);
      setMedia([]);
      resetPostForm();
      setActiveView('dashboard');
    }
  }

  async function onMediaUpload(file) {
    if (!file) return;
    setMediaHint('');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });

      if (!res.ok) {
        let detail = `${res.status} ${res.statusText}`;
        try {
          const data = await res.json();
          if (data && data.detail) detail = data.detail;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      setMediaHint('Uploaded.');
      await refreshMedia();
    } catch (err) {
      setMediaHint(String(err?.message || err));
    }
  }

  async function onPostSubmit(e) {
    e.preventDefault();
    setPostsHint('');

    const payload = {
      title: postTitle.trim(),
      bucket: postBucket,
      content: postContent,
      excerpt: postExcerpt.trim() ? postExcerpt.trim() : null,
      creator: me ? me.username : null,
      ogImg: postOgImg.trim() ? postOgImg.trim() : null,
      readMinutes: postReadMinutes ? Number(postReadMinutes) : null,
    };

    if (!payload.title) {
      setPostsHint('Title is required.');
      return;
    }

    try {
      if (!postId) {
        const created = await api('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setPostsHint('Saved.');
        await refreshPosts();
        loadPostIntoForm(created);
      } else {
        const updated = await api(`/api/admin/posts/${encodeURIComponent(postId)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setPostsHint('Updated.');
        await refreshPosts();
        loadPostIntoForm(updated);
      }
    } catch (err) {
      setPostsHint(String(err?.message || err));
    }
  }

  async function onDeletePost() {
    if (!postId) return;
    if (!confirm('Delete this post?')) return;

    setPostsHint('');
    try {
      await api(`/api/admin/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' });
      setPostsHint('Deleted.');
      resetPostForm();
      await refreshPosts();
    } catch (err) {
      setPostsHint(String(err?.message || err));
    }
  }

  async function onCreateUser(e) {
    e.preventDefault();
    setUserHint('');

    try {
      await api('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      setNewUsername('');
      setNewPassword('');
      setNewRole('editor');
      setUserHint('User created.');
      await refreshUsers();
    } catch (err) {
      setUserHint(String(err?.message || err));
    }
  }

  async function onDeleteUser(userId, username) {
    if (!confirm(`Delete user ${username}?`)) return;
    setUserHint('');

    try {
      await api(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
      await refreshUsers();
    } catch (err) {
      setUserHint(String(err?.message || err));
    }
  }

  return (
    <>
      <Head>
        <title>Coffee n Blog – Admin</title>
      </Head>

      <div className="page-shell page-shell-admin">
        <div className="admin-shell">
          <aside className="admin-sidebar" aria-label="Admin navigation">
            <div className="admin-sidebar-top">
              <div className="brand">
                <div className="brand-mark">
                  <div className="brand-mark-inner">CnB</div>
                </div>
                <div className="brand-text">
                  <h1>Admin</h1>
                  <span>{isAuthed ? 'Dashboard & tools' : 'Sign in to manage'}</span>
                </div>
              </div>

              <nav className="admin-nav" aria-label="Sections">
                <button
                  type="button"
                  className={`admin-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveView('dashboard')}
                  disabled={!isAuthed}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  className={`admin-nav-item ${activeView === 'posts' ? 'active' : ''}`}
                  onClick={() => setActiveView('posts')}
                  disabled={!isAuthed}
                >
                  Posts
                </button>
                <button
                  type="button"
                  className={`admin-nav-item ${activeView === 'categories' ? 'active' : ''}`}
                  onClick={() => setActiveView('categories')}
                  disabled={!isAuthed}
                >
                  Categories
                </button>
                <button
                  type="button"
                  className={`admin-nav-item ${activeView === 'media' ? 'active' : ''}`}
                  onClick={() => setActiveView('media')}
                  disabled={!isAuthed}
                >
                  Media
                </button>
                <button
                  type="button"
                  className={`admin-nav-item ${activeView === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveView('comments')}
                  disabled={!isAuthed}
                >
                  Comments
                </button>

                <div className="admin-nav-sep" aria-hidden="true"></div>
                <div className="admin-nav-label">System</div>

                <button
                  type="button"
                  className={`admin-nav-item ${activeView === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveView('users')}
                  disabled={!isAuthed || !canManageUsers}
                  aria-disabled={!isAuthed || !canManageUsers}
                  title={!canManageUsers ? 'Admins only' : ''}
                >
                  Users
                </button>
                <button
                  type="button"
                  className={`admin-nav-item ${activeView === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveView('settings')}
                  disabled={!isAuthed}
                >
                  Settings
                </button>
              </nav>
            </div>

            <div className="admin-sidebar-bottom">
              <div className="admin-me" id="meLine">
                {me ? `Signed in as ${me.username} (${me.role})` : 'Not signed in'}
              </div>

              <div className="admin-theme-toggle" aria-label="Theme">
                <button
                  type="button"
                  className={`admin-theme-btn ${themeMode === 'light' ? 'active' : ''}`}
                  onClick={() => {
                    const t = setTheme('light');
                    setThemeMode(t);
                  }}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`admin-theme-btn ${themeMode === 'dark' ? 'active' : ''}`}
                  onClick={() => {
                    const t = setTheme('dark');
                    setThemeMode(t);
                  }}
                >
                  Dark
                </button>
              </div>

              <div className="admin-sidebar-actions">
                {me ? (
                  <button className="pill-btn" id="logoutBtn" type="button" onClick={onLogout}>
                    <span className="dot" style={{ background: 'var(--accent)' }}></span>
                    Logout
                  </button>
                ) : null}
                <Link className="pill-btn" href="/" aria-label="Go to site">
                  <span className="dot" style={{ background: '#4cd4ff' }}></span>
                  Site
                </Link>
              </div>
            </div>
          </aside>

          <main className="admin-content" aria-label="Admin content">
            {!isAuthed ? (
              <section className="side-card admin-login" id="loginCard">
                <div className="side-header">
                  <h3>Login</h3>
                  <span>Use your admin/editor account</span>
                </div>

                <form id="loginForm" className="admin-form" onSubmit={onLoginSubmit}>
                  <label>
                    <span className="label">Username</span>
                    <input
                      className="input"
                      id="loginUsername"
                      autoComplete="username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="label">Password</span>
                    <input
                      className="input"
                      id="loginPassword"
                      type="password"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </label>

                  <div className="row">
                    <button className="hero-cta" type="submit">
                      Sign in
                    </button>
                    <div className="hint" id="loginHint">
                      {loginHint}
                    </div>
                  </div>
                </form>
              </section>
            ) : activeView === 'dashboard' ? (
              <>
                <div className="admin-dashboard-head">
                  <div className="admin-dashboard-title">
                    <h2>Dashboard</h2>
                  </div>

                  <section className="admin-stats" aria-label="Stats">
                    <div className="admin-stat-row">
                      <div className="admin-metric">
                        <div className="admin-metric-top">
                          <div className="t">Total Posts</div>
                          <div className="admin-metric-icon" aria-hidden="true"></div>
                        </div>
                        <div className="n">{posts.length}</div>
                        <div className="sub">
                          Last 30 days
                          <span className={`trend ${postGrowth30.delta.dir}`}>{postGrowth30.delta.text}</span>
                        </div>
                      </div>

                      <div className="admin-metric">
                        <div className="admin-metric-top">
                          <div className="t">Total Categories</div>
                          <div className="admin-metric-icon" aria-hidden="true"></div>
                        </div>
                        <div className="n">{categories.length}</div>
                        <div className="sub">Buckets used in posts</div>
                      </div>

                      <div className="admin-metric">
                        <div className="admin-metric-top">
                          <div className="t">Total Media Files</div>
                          <div className="admin-metric-icon" aria-hidden="true"></div>
                        </div>
                        <div className="n">{media.length}</div>
                        <div className="sub">Uploads in /static/uploads</div>
                      </div>

                      <div className="admin-metric">
                        <div className="admin-metric-top">
                          <div className="t">Pending Comments</div>
                          <div className="admin-metric-icon" aria-hidden="true"></div>
                        </div>
                        <div className="n">0</div>
                        <div className="sub">Comments not enabled</div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="admin-dashboard-grid" aria-label="Dashboard panels">
                  {/* Comments Trend - Left */}
                  <div className="side-card admin-chart-card dashboard-item-left-top">
                    <div className="admin-card-head">
                      <div>
                        <div className="h">Comments Trend</div>
                        <div className="hint">Not configured</div>
                      </div>
                      <div className="pill-btn" aria-hidden="true">
                        <span className="dot" style={{ background: '#4cd4ff' }}></span>
                        Last 15 days
                      </div>
                    </div>

                    <div className="admin-chart-empty">
                      Comments feature is not implemented in the backend yet.
                    </div>
                  </div>

                  {/* Post Growth */}
                  <div className="side-card admin-chart-card dashboard-item-center-top">
                    <div className="admin-card-head">
                      <div>
                        <div className="h">Post Growth</div>
                        <div className="hint">Last 6 months</div>
                      </div>
                      <div className="pill-btn" aria-hidden="true">
                        <span className="dot" style={{ background: '#4cd4ff' }}></span>
                        6 months
                      </div>
                    </div>

                    <div className="admin-bars" aria-label="Post growth chart">
                      {(() => {
                        const max = Math.max(0, ...postsByMonth.map((m) => m.count));
                        return postsByMonth.map((m) => {
                          const pct = max ? Math.round((m.count / max) * 100) : 0;
                          const h = Math.max(10, Math.min(85, pct));
                          return (
                            <div key={m.key} className="admin-bar">
                              <div className="admin-bar-fill" style={{ height: `${h}%` }}>
                                <span className="admin-bar-tip">{m.count} posts</span>
                              </div>
                              <div className="admin-bar-label">{m.label}</div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Posts by Member */}
                  <div className="side-card dashboard-item-right-span" aria-label="Posts by member">
                    <div className="side-header">
                      <h3>Posts by Member</h3>
                      <span>{memberStats.length} members</span>
                    </div>

                    {memberStats.length ? (
                      <div className="admin-member-grid">
                        {memberStats.map((m) => (
                          <div key={m.username} className="admin-member-card">
                            <div className="admin-member-top">
                              <div className="admin-member-name">{m.username}</div>
                              {m.role ? <div className="admin-member-role">{m.role}</div> : null}
                            </div>
                            <div className="admin-member-count">{m.count}</div>
                            <div className="admin-member-sub">posts</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">No stats yet.</div>
                    )}
                  </div>

                  <div className="side-card admin-mini-table">
                    <div className="side-header">
                      <h3>Recent Comments</h3>
                      <span>0</span>
                    </div>
                    <div className="admin-chart-empty">Comments are not enabled for this project.</div>
                  </div>
                </section>

                <section className="side-card admin-mini-table" aria-label="Latest posts">
                  <div className="side-header">
                    <h3>Latest Posts</h3>
                    <span>{latestPosts.length}</span>
                  </div>

                  <div className="admin-table">
                    <div className="admin-table-head">
                      <div>Title</div>
                      <div>Status</div>
                      <div>Date</div>
                      <div></div>
                    </div>

                    {latestPosts.length ? (
                      latestPosts.map((p) => (
                        <div key={p.id} className="admin-table-row">
                          <div className="title">{p.title}</div>
                          <div>
                            <span className={`status ${p.date ? 'published' : 'draft'}`}>
                              {p.date ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <div className="meta">{formatDateShort(p.date)}</div>
                          <div className="actions">
                            <button
                              type="button"
                              className="pill-btn"
                              onClick={() => {
                                window.location.href = `/admin/post?id=${encodeURIComponent(p.id)}`;
                              }}
                            >
                              <span className="dot" style={{ background: 'var(--accent)' }}></span>
                              Edit
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">No posts yet.</div>
                    )}
                  </div>
                </section>
              </>
            ) : activeView === 'posts' ? (
              <>
                <div className="admin-title-row">
                  <h2>Posts</h2>
                  <div className="accent-line"></div>
                  <span className="admin-title-count" id="postsCount">
                    {postsCount}
                  </span>
                  <Link className="pill-btn" href="/admin/post" id="writePostBtn">
                    <span className="dot" style={{ background: '#4cd4ff' }}></span>
                    Write new post
                  </Link>
                  <div className="side-card admin-posts-card" aria-label="All posts">
                    <div className="admin-posts-scroll">
                      <div className="admin-table-head admin-posts-table-head">
                        <div>Title</div>
                        <div>Author</div>
                        <div>Status</div>
                        <div>Date</div>
                        <div></div>
                      </div>

                      {sortedPosts.length ? (
                        sortedPosts.map((p) => (
                          <div key={p.id} className="admin-table-row admin-posts-table-row">
                            <div className="title">{p.title}</div>
                            <div className="meta author">{String(p.creator || '').trim() || 'Unknown'}</div>
                            <div>
                              <span className={`status ${p.date ? 'published' : 'draft'}`}>
                                {p.date ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <div className="meta">{formatDateShort(p.date)}</div>
                            <div className="actions">
                              <button
                                type="button"
                                className="pill-btn"
                                onClick={() => {
                                  window.location.href = `/admin/post?id=${encodeURIComponent(p.id)}`;
                                }}
                              >
                                <span className="dot" style={{ background: 'var(--accent)' }}></span>
                                Edit
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">No posts yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : activeView === 'categories' ? (
              <>
                <div className="admin-title-row">
                  <h2>Categories</h2>
                  <div className="accent-line"></div>
                </div>

                <section className="side-card">
                  <div className="side-header">
                    <h3>Bucket Counts</h3>
                    <span>{categoriesWithCounts.length}</span>
                  </div>

                  <div className="admin-member-grid">
                    {categoriesWithCounts.map((c) => (
                      <div key={c.name} className="admin-member-card">
                        <div className="admin-member-top">
                          <div className="admin-member-name">{c.name}</div>
                        </div>
                        <div className="admin-member-count">{c.count}</div>
                        <div className="admin-member-sub">posts</div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : activeView === 'media' ? (
              <>
                <div className="admin-title-row">
                  <h2>Media</h2>
                  <div className="accent-line"></div>
                </div>

                <section className="side-card">
                  <div className="side-header">
                    <h3>Upload Image</h3>
                    <span>{media.length} files</span>
                  </div>

                  <div className="row">
                    <input
                      className="input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => onMediaUpload(e.target.files?.[0] || null)}
                    />
                    <button className="pill-btn" type="button" onClick={() => refreshMedia()}>
                      <span className="dot" style={{ background: '#4cd4ff' }}></span>
                      Refresh
                    </button>
                    <div className="hint">{mediaHint}</div>
                  </div>
                </section>

                <section className="side-card">
                  <div className="side-header">
                    <h3>Library</h3>
                    <span>latest first</span>
                  </div>

                  {media.length ? (
                    <div className="admin-media-grid">
                      {media.map((m) => (
                        <a
                          key={m.name}
                          className="admin-media-item"
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          title={m.name}
                        >
                          <div className="admin-media-thumb">
                            <img src={m.url} alt={m.name} loading="lazy" />
                          </div>
                          <div className="admin-media-meta">
                            <div className="name">{m.name}</div>
                            <div className="meta">{formatDateShort(m.modifiedAt)}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">No uploads yet.</div>
                  )}
                </section>
              </>
            ) : activeView === 'comments' ? (
              <>
                <div className="admin-title-row">
                  <h2>Comments</h2>
                  <div className="accent-line"></div>
                </div>
                <div className="empty-state">Comments are not implemented in the backend yet.</div>
              </>
            ) : activeView === 'settings' ? (
              <>
                <div className="admin-title-row">
                  <h2>Settings</h2>
                  <div className="accent-line"></div>
                </div>
                <div className="empty-state">Settings UI is not implemented yet.</div>
              </>
            ) : (
              <>
                <div className="admin-title-row">
                  <h2>Users</h2>
                  <div className="accent-line"></div>
                </div>

                {canManageUsers ? (
                  <section className="side-card" id="usersCard">
                    <div className="side-header">
                      <h3>Manage Users</h3>
                      <span>Admins only</span>
                    </div>

                    <form id="userForm" className="admin-form" onSubmit={onCreateUser}>
                      <label>
                        <span className="label">New username</span>
                        <input
                          className="input"
                          id="newUsername"
                          autoComplete="off"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                        />
                      </label>
                      <label>
                        <span className="label">New password</span>
                        <input
                          className="input"
                          id="newPassword"
                          type="password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </label>
                      <label>
                        <span className="label">Role</span>
                        <select
                          className="input"
                          id="newRole"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                        >
                          <option value="editor">editor</option>
                          <option value="admin">admin</option>
                        </select>
                      </label>

                      <div className="row">
                        <button className="hero-cta" type="submit">
                          Add user
                        </button>
                        <div className="hint" id="userHint">
                          {userHint}
                        </div>
                      </div>
                    </form>

                    <div className="mini-list" id="usersList">
                      {users.map((u) => (
                        <div key={u.id} className="mini-item">
                          <div className="role">
                            <span className="title">{u.username}</span>
                            <span className="tag">{u.role}</span>
                          </div>
                          <button
                            className="pill-btn danger"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteUser(u.id, u.username);
                            }}
                          >
                            <span className="dot" style={{ background: 'var(--danger)' }}></span>
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="empty-state">Users management is admin-only.</div>
                )}
              </>
            )}
          </main>
        </div>

        <footer>
          <div>Admin panel for Coffee n Blog.</div>
          <div></div>
        </footer>
      </div>
    </>
  );
}
