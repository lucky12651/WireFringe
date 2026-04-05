import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

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

      <div className="page-shell">
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
                >
                  <span className="dot"></span>B
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="italic"
                  onClick={() => exec('italic')}
                >
                  <span className="dot"></span>I
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="underline"
                  onClick={() => exec('underline')}
                >
                  <span className="dot"></span>U
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="strikeThrough"
                  onClick={() => exec('strikeThrough')}
                >
                  <span className="dot"></span>S
                </button>

                <div className="toolbar-spacer"></div>

                <button className="pill-btn" type="button" data-block="h2" onClick={() => formatBlock('h2')}>
                  <span className="dot"></span>H2
                </button>
                <button className="pill-btn" type="button" data-block="h3" onClick={() => formatBlock('h3')}>
                  <span className="dot"></span>H3
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="insertUnorderedList"
                  onClick={() => exec('insertUnorderedList')}
                >
                  <span className="dot"></span>• List
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-cmd="insertOrderedList"
                  onClick={() => exec('insertOrderedList')}
                >
                  <span className="dot"></span>1. List
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  data-block="blockquote"
                  onClick={() => formatBlock('blockquote')}
                >
                  <span className="dot"></span>Quote
                </button>
                <button className="pill-btn" type="button" data-block="pre" onClick={() => formatBlock('pre')}>
                  <span className="dot"></span>Code
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
                >
                  <span className="dot"></span>Link
                </button>
                <button className="pill-btn" type="button" id="unlinkBtn" onClick={() => exec('unlink')}>
                  <span className="dot"></span>Unlink
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
                >
                  <span className="dot"></span>Image URL
                </button>
                <button
                  className="pill-btn"
                  type="button"
                  id="uploadImageBtn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="dot"></span>Upload
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
