import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { initTheme } from '../../lib/theme';

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
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

function slugifyTitle(title) {
  const s = String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return s.slice(0, 90) || 'post';
}

export default function AdminPostPage() {
  const router = useRouter();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorHtmlRef = useRef('');

  const [me, setMe] = useState(null);
  const [hint, setHint] = useState('');

  const [postId, setPostId] = useState('');
  const [title, setTitle] = useState('');
  const [bucket, setBucket] = useState('Tech');
  const [readMinutes, setReadMinutes] = useState('');
  const [ogImg, setOgImg] = useState('');
  const [excerpt, setExcerpt] = useState('');

  const modeLabel = postId ? 'Edit post' : 'New post';
  const viewHref = postId
    ? `/post/${encodeURIComponent(slugifyTitle(title))}`
    : '/';

  const queryId = useMemo(() => {
    if (!router.isReady) return '';
    const q = router.query?.id;
    if (typeof q === 'string') return q;
    if (Array.isArray(q)) return q[0] || '';
    return '';
  }, [router.isReady, router.query]);

  function focusEditor() {
    editorRef.current?.focus();
  }

  function exec(cmd, value = null) {
    focusEditor();
    document.execCommand(cmd, false, value);
  }

  function formatBlock(tagName) {
    focusEditor();
    document.execCommand('formatBlock', false, tagName);
  }

  async function refreshMe() {
    try {
      const out = await api('/api/admin/me', { method: 'GET' });
      setMe(out);
      return true;
    } catch (_) {
      setMe(null);
      return false;
    }
  }

  function setNewMode() {
    setPostId('');
    setTitle('');
    setBucket('Tech');
    setOgImg('');
    setReadMinutes('');
    setExcerpt('');
    editorHtmlRef.current = '';
    if (editorRef.current) editorRef.current.innerHTML = editorHtmlRef.current;
  }

  function fillForm(post) {
    setPostId(post.id);
    setTitle(post.title || '');
    setBucket(post.bucket || 'Tech');
    setOgImg(post.ogImg || '');
    setReadMinutes(post.readMinutes ? String(post.readMinutes) : '');
    setExcerpt(post.excerpt || '');
    editorHtmlRef.current = post.content || '';
    if (editorRef.current) editorRef.current.innerHTML = editorHtmlRef.current;
  }

  async function loadPostIfNeeded(id) {
    if (!id) {
      setNewMode();
      return;
    }

    const post = await api(`/api/admin/post?id=${encodeURIComponent(id)}`, { method: 'GET' });
    fillForm(post);
  }

  function collectPayload() {
    const content = editorRef.current ? editorRef.current.innerHTML : editorHtmlRef.current;

    return {
      title: title.trim(),
      bucket,
      content,
      excerpt: excerpt.trim() ? excerpt.trim() : null,
      creator: me ? me.username : null,
      ogImg: ogImg.trim() ? ogImg.trim() : null,
      readMinutes: readMinutes ? Number(readMinutes) : null,
    };
  }

  async function uploadImage(file) {
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
      } catch (_) {}
      throw new Error(detail);
    }

    return await res.json();
  }

  async function onSave(e) {
    e.preventDefault();
    setHint('');

    const payload = collectPayload();
    if (!payload.title) {
      setHint('Title is required.');
      return;
    }

    try {
      if (!postId) {
        const created = await api('/api/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        setHint('Saved.');
        await router.replace({ pathname: '/admin/post', query: { id: created.id } }, undefined, {
          shallow: true,
        });
        fillForm(created);
      } else {
        const updated = await api(`/api/admin/post?id=${encodeURIComponent(postId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setHint('Updated.');
        fillForm(updated);
      }
    } catch (err) {
      setHint(String(err?.message || err));
    }
  }

  async function onDelete() {
    if (!postId) return;
    if (!confirm('Delete this post?')) return;

    setHint('');
    try {
      await api(`/api/admin/post?id=${encodeURIComponent(postId)}`, { method: 'DELETE' });
      setHint('Deleted.');
      await router.replace('/admin/post');
      setNewMode();
    } catch (err) {
      setHint(String(err?.message || err));
    }
  }

  async function onLogout() {
    try {
      await api('/api/admin/logout', { method: 'POST' });
    } finally {
      await router.replace('/admin');
    }
  }

  useEffect(() => {
    (async () => {
      initTheme({ defaultTheme: 'dark' });
      const ok = await refreshMe();
      if (!ok) {
        router.replace('/admin');
        return;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (!me) return;

    (async () => {
      try {
        await loadPostIfNeeded(queryId);
      } catch (err) {
        setHint(String(err?.message || err));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, queryId, me?.id]);

  useEffect(() => {
    // Keep state synced if user pastes/edits directly in the contentEditable.
    const el = editorRef.current;
    if (!el) return;
    const onInput = () => {
      editorHtmlRef.current = el.innerHTML;
    };
    el.addEventListener('input', onInput);
    return () => el.removeEventListener('input', onInput);
  }, []);

  return (
    <>
      <Head>
        <title>Coffee n Blog – Admin Editor</title>
      </Head>

      <div className="page-shell page-shell-admin">
        <header className="site-header admin-header">
          <div className="header-inner">
            <Link className="brand" href="/admin" aria-label="Back to admin">
              <div className="brand-mark">
                <div className="brand-mark-inner">CnB</div>
              </div>
              <div className="brand-text">
                <h1>Editor</h1>
                <span id="editorMode">{modeLabel}</span>
              </div>
            </Link>

            <div className="admin-topbar">
              <div className="admin-me" id="meLine">
                {me ? `Signed in as ${me.username} (${me.role})` : ''}
              </div>
              <button className="pill-btn" id="logoutBtn" type="button" onClick={onLogout}>
                <span className="dot" style={{ background: 'var(--accent)' }}></span>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="admin-editor-shell">
          <section className="side-card admin-editor-card">
            <form id="editorForm" className="admin-form" onSubmit={onSave}>
              <input type="hidden" id="postId" value={postId} readOnly />

              <label>
                <span className="label">Title</span>
                <input
                  className="input"
                  id="postTitle"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <div className="row">
                <label className="grow">
                  <span className="label">Category</span>
                  <select
                    className="input"
                    id="postBucket"
                    value={bucket}
                    onChange={(e) => setBucket(e.target.value)}
                  >
                    {BUCKETS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>

                <label className="grow">
                  <span className="label">Read minutes</span>
                  <input
                    className="input"
                    id="postReadMinutes"
                    type="number"
                    min="1"
                    placeholder="3"
                    value={readMinutes}
                    onChange={(e) => setReadMinutes(e.target.value)}
                  />
                </label>
              </div>

              <label>
                <span className="label">OpenGraph Image URL (optional)</span>
                <input
                  className="input"
                  id="postOgImg"
                  placeholder="https://..."
                  value={ogImg}
                  onChange={(e) => setOgImg(e.target.value)}
                />
              </label>

              <label>
                <span className="label">Excerpt (optional)</span>
                <textarea
                  className="input textarea"
                  id="postExcerpt"
                  placeholder="If empty, excerpt is auto-generated"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                ></textarea>
              </label>

              <div className="admin-editor-toolbar" role="toolbar" aria-label="Editor toolbar">
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="bold"
                  onClick={() => exec('bold')}
                  aria-label="Bold"
                  title="Bold"
                >
                  <span className="tb-icon tb-icon-text" aria-hidden="true">
                    B
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="italic"
                  onClick={() => exec('italic')}
                  aria-label="Italic"
                  title="Italic"
                >
                  <span className="tb-icon tb-icon-text" aria-hidden="true">
                    I
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="underline"
                  onClick={() => exec('underline')}
                  aria-label="Underline"
                  title="Underline"
                >
                  <span className="tb-icon tb-icon-text" aria-hidden="true">
                    U
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="strikeThrough"
                  onClick={() => exec('strikeThrough')}
                  aria-label="Strikethrough"
                  title="Strikethrough"
                >
                  <span className="tb-icon tb-icon-text" aria-hidden="true">
                    S
                  </span>
                </button>

                <div className="toolbar-spacer"></div>

                <button
                  className="pill-btn"
                  type="button"
                  data-block="h2"
                  onClick={() => formatBlock('h2')}
                  aria-label="Heading 2"
                  title="Heading 2"
                >
                  <span className="tb-icon tb-icon-text" aria-hidden="true">
                    H2
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-block="h3"
                  onClick={() => formatBlock('h3')}
                  aria-label="Heading 3"
                  title="Heading 3"
                >
                  <span className="tb-icon tb-icon-text" aria-hidden="true">
                    H3
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="insertUnorderedList"
                  onClick={() => exec('insertUnorderedList')}
                  aria-label="Bulleted list"
                  title="Bulleted list"
                >
                  <span className="tb-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="5" cy="6" r="1" stroke="currentColor" strokeWidth="2" />
                      <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                      <circle cx="5" cy="18" r="1" stroke="currentColor" strokeWidth="2" />
                      <path d="M9 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="insertOrderedList"
                  onClick={() => exec('insertOrderedList')}
                  aria-label="Numbered list"
                  title="Numbered list"
                >
                  <span className="tb-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="5" width="2" height="2" rx="0.4" fill="currentColor" />
                      <rect x="4" y="11" width="2" height="2" rx="0.4" fill="currentColor" />
                      <rect x="4" y="17" width="2" height="2" rx="0.4" fill="currentColor" />
                      <path d="M9 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-block="blockquote"
                  onClick={() => formatBlock('blockquote')}
                  aria-label="Quote"
                  title="Quote"
                >
                  <span className="tb-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 17H11V11H7V7H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13 17H17V11H13V7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-block="pre"
                  onClick={() => formatBlock('pre')}
                  aria-label="Code block"
                  title="Code block"
                >
                  <span className="tb-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 9L4 12L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 9L20 12L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 8L10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                <div className="toolbar-spacer"></div>

                <button
                  className="pill-btn"
                  type="button"
                  id="linkBtn"
                  onClick={() => {
                    const url = prompt('Link URL (https://...)');
                    if (!url) return;
                    exec('createLink', url);
                  }}
                  aria-label="Insert link"
                  title="Insert link"
                >
                  <span className="tb-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  id="unlinkBtn"
                  onClick={() => exec('unlink')}
                  aria-label="Remove link"
                  title="Remove link"
                >
                  <span className="tb-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M4 4L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                <button
                  className="pill-btn"
                  type="button"
                  id="imageUrlBtn"
                  onClick={() => {
                    const url = prompt('Image URL (https://...)');
                    if (!url) return;
                    exec('insertImage', url);
                  }}
                  aria-label="Insert image from URL"
                  title="Insert image from URL"
                >
                  <span className="tb-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                      <circle cx="9" cy="11" r="1.5" fill="currentColor" />
                      <path d="M20 16L15 11L7 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  id="uploadImageBtn"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload image"
                  title="Upload image"
                >
                  <span className="tb-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M7 9L12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  id="imageFileInput"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    e.target.value = '';
                    if (!file) return;

                    setHint('Uploading image...');
                    try {
                      const out = await uploadImage(file);
                      exec('insertImage', out.url);
                      setHint('Image inserted.');
                    } catch (err) {
                      setHint(String(err?.message || err));
                    }
                  }}
                />
              </div>

              <div
                ref={editorRef}
                id="editor"
                className="admin-editor"
                contentEditable={true}
                spellCheck={true}
                aria-label="Post content"
                suppressContentEditableWarning={true}
              ></div>

              <div className="row">
                <button className="hero-cta" type="submit" id="saveBtn">
                  Save
                </button>
                {postId ? (
                  <button className="pill-btn" type="button" id="deleteBtn" onClick={onDelete}>
                    <span className="dot" style={{ background: 'var(--danger)' }}></span>
                    Delete
                  </button>
                ) : null}
                {postId ? (
                  <a className="pill-btn" id="viewBtn" href={viewHref}>
                    <span className="dot" style={{ background: 'var(--accent)' }}></span>
                    View
                  </a>
                ) : null}
                <div className="hint" id="hint">
                  {hint}
                </div>
              </div>
            </form>
          </section>

          <section className="side-card admin-editor-help">
            <div className="side-header">
              <h3>Tips</h3>
              <span>WordPress-like</span>
            </div>
            <div className="admin-help-text">
              <p>Use the toolbar for bold, headings, lists, links, and images.</p>
              <p>Paste content from anywhere — formatting will be kept as HTML.</p>
            </div>
          </section>
        </main>

        <footer>
          <div>Admin editor for Coffee n Blog.</div>
          <div>
            <Link href="/">Go to site</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
