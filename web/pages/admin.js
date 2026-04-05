import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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

export default function AdminPage() {
  const [me, setMe] = useState(null);
  const isAuthed = Boolean(me);

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

  const canManageUsers = me?.role === 'admin';

  const postsCount = useMemo(() => String(posts.length), [posts]);

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
      const user = await refreshMe();
      if (!user) return;
      resetPostForm();
      await refreshPosts();
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
      resetPostForm();
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

      <div className="page-shell">
        <header className="site-header admin-header">
          <div className="header-inner">
            <div className="brand">
              <div className="brand-mark">
                <div className="brand-mark-inner">CnB</div>
              </div>
              <div className="brand-text">
                <h1>Admin</h1>
                <span>Manage posts and users</span>
              </div>
            </div>

            <div className="admin-topbar">
              <div className="admin-me" id="meLine">
                {me ? `Signed in as ${me.username} (${me.role})` : ''}
              </div>
              {me ? (
                <button className="pill-btn" id="logoutBtn" type="button" onClick={onLogout}>
                  <span className="dot" style={{ background: 'var(--accent)' }}></span>
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <main className="admin-main">
          {!isAuthed ? (
            <section className="side-card" id="loginCard">
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
          ) : (
            <>
              <section className="side-card" id="postsCard">
                <div className="side-header">
                  <h3>Write / Edit Post</h3>
                  <span id="postFormMode">{postFormMode}</span>
                </div>

                <form id="postForm" className="admin-form" onSubmit={onPostSubmit}>
                  <input type="hidden" id="postId" value={postId} readOnly />

                  <label>
                    <span className="label">Title</span>
                    <input
                      className="input"
                      id="postTitle"
                      required
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                    />
                  </label>

                  <label>
                    <span className="label">Category</span>
                    <select
                      className="input"
                      id="postBucket"
                      value={postBucket}
                      onChange={(e) => setPostBucket(e.target.value)}
                    >
                      {BUCKETS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="label">OpenGraph Image URL (optional)</span>
                    <input
                      className="input"
                      id="postOgImg"
                      placeholder="https://..."
                      value={postOgImg}
                      onChange={(e) => setPostOgImg(e.target.value)}
                    />
                  </label>

                  <label>
                    <span className="label">Read minutes (optional)</span>
                    <input
                      className="input"
                      id="postReadMinutes"
                      type="number"
                      min="1"
                      value={postReadMinutes}
                      onChange={(e) => setPostReadMinutes(e.target.value)}
                    />
                  </label>

                  <label>
                    <span className="label">Excerpt (optional)</span>
                    <textarea
                      className="input textarea"
                      id="postExcerpt"
                      placeholder="If empty, excerpt is auto-generated"
                      value={postExcerpt}
                      onChange={(e) => setPostExcerpt(e.target.value)}
                    ></textarea>
                  </label>

                  <label>
                    <span className="label">Content (HTML allowed)</span>
                    <textarea
                      className="input textarea"
                      id="postContent"
                      required
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                    ></textarea>
                  </label>

                  <div className="row">
                    <button className="hero-cta" type="submit" id="savePostBtn">
                      Save
                    </button>
                    <Link className="pill-btn" href="/admin/post" id="newPostBtn">
                      <span className="dot" style={{ background: '#4cd4ff' }}></span>
                      New
                    </Link>
                    {postId ? (
                      <button
                        className="pill-btn danger"
                        type="button"
                        id="deletePostBtn"
                        onClick={onDeletePost}
                      >
                        <span className="dot" style={{ background: 'var(--danger)' }}></span>
                        Delete
                      </button>
                    ) : null}
                    <div className="hint" id="postHint">
                      {postsHint}
                    </div>
                  </div>
                </form>
              </section>

              <section className="side-card" id="postsListCard">
                <div className="side-header">
                  <h3>All Posts</h3>
                  <span id="postsCount">{postsCount}</span>
                </div>
                <div className="mini-list" id="postsList">
                  {posts.map((p) => (
                    <div
                      key={p.id}
                      className="mini-item"
                      onClick={() => {
                        window.location.href = `/admin/post?id=${encodeURIComponent(p.id)}`;
                      }}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          window.location.href = `/admin/post?id=${encodeURIComponent(p.id)}`;
                        }
                      }}
                    >
                      <div>
                        <span className="title">{p.title}</span>
                        <div className="meta">{p.bucket || ''}</div>
                      </div>
                      <span className="meta">edit</span>
                    </div>
                  ))}
                </div>
              </section>

              {canManageUsers ? (
                <section className="side-card" id="usersCard">
                  <div className="side-header">
                    <h3>Users</h3>
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
              ) : null}
            </>
          )}
        </main>

        <footer>
          <div>Admin panel for Coffee n Blog.</div>
          <div>
            <Link href="/">Go to site</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
