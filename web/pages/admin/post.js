import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { initTheme } from '../../lib/theme';
import { api, postsApi, mediaApi } from '../../lib/api';
import { slugifyTitle } from '../../lib/utils';
import { useCategories } from '../../hooks/useCategories';

export default function AdminPostPage() {
  const router = useRouter();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorHtmlRef = useRef('');

  const [me, setMe] = useState(null);
  const [hint, setHint] = useState('');

  const [postId, setPostId] = useState('');
  const [title, setTitle] = useState('');
  const { categoryNames, refreshCategories } = useCategories();
  const [bucket, setBucket] = useState('');
  const [readMinutes, setReadMinutes] = useState('');
  const [ogImg, setOgImg] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

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
      if (out && out.role === 'user') {
        router.replace('/');
        return false;
      }
      setMe(out);
      return true;
    } catch (_) {
      setMe(null);
      router.replace('/admin');
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
    return await mediaApi.upload(file);
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
        const created = await postsApi.create(payload);
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
      await refreshCategories();
      const ok = await refreshMe();
      if (!ok) {
        router.replace('/admin');
        return;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default bucket once categories are loaded
  useEffect(() => {
    if (categoryNames.length && !bucket) {
      setBucket(categoryNames[0]);
    }
  }, [categoryNames, bucket]);

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
        <title>Wirefringe – Admin Editor</title>
      </Head>

      <div className="page-shell page-shell-admin">
        <header className="site-header admin-header">
          <div className="header-inner">
            <Link className="brand" href="/admin" aria-label="Back to admin">
              <span className="wf-logo wf-logo--sm" aria-hidden="true">
                Wire<span className="wf-logo-f">F</span>ringe
              </span>
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

        <main className="admin-editor-shell" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <section className="side-card admin-editor-card" style={{ flex: 1, minWidth: 0 }}>
            <form id="editorForm" className="admin-form" onSubmit={onSave}>
              <input type="hidden" id="postId" value={postId} readOnly />

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

          {/* Right Sidebar - Metadata Panel */}
          <aside
            className="side-card admin-sidebar"
            style={{
              width: sidebarExpanded ? '280px' : '44px',
              flexShrink: 0,
              transition: 'width 0.25s ease',
              overflow: 'hidden',
              borderRadius: '12px',
              padding: 0,
            }}
          >
            <div
              className="admin-sidebar-header"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarExpanded ? 'space-between' : 'center',
                padding: '0.75rem',
                borderBottom: sidebarExpanded ? '1px solid rgba(127,127,127,0.15)' : 'none',
                cursor: 'pointer',
              }}
            >
              {sidebarExpanded && <span className="label" style={{ margin: 0, fontSize: '0.8rem' }}>Metadata</span>}
              <span
                className="tb-icon"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  transform: sidebarExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </span>
            </div>

            {sidebarExpanded && (
              <div
                className="admin-sidebar-content"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Title field */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="label" style={{ margin: 0, fontSize: '0.75rem' }}>Title</span>
                  <input
                    className="input"
                    style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post title..."
                  />
                </label>

                {/* Category & Read minutes row */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <span className="label" style={{ margin: 0, fontSize: '0.75rem' }}>Category</span>
                    <select
                      className="input"
                      style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                      value={bucket}
                      onChange={(e) => setBucket(e.target.value)}
                    >
                      {categoryNames.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '80px' }}>
                    <span className="label" style={{ margin: 0, fontSize: '0.75rem' }}>Read min</span>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                      value={readMinutes}
                      onChange={(e) => setReadMinutes(e.target.value)}
                      placeholder="3"
                    />
                  </label>
                </div>

                {/* OpenGraph Image URL */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="label" style={{ margin: 0, fontSize: '0.75rem' }}>OpenGraph Image URL (optional)</span>
                  <input
                    className="input"
                    style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                    placeholder="https://..."
                    value={ogImg}
                    onChange={(e) => setOgImg(e.target.value)}
                  />
                </label>

                {/* Excerpt */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="label" style={{ margin: 0, fontSize: '0.75rem' }}>Excerpt (optional)</span>
                  <textarea
                    className="input textarea"
                    style={{ fontSize: '0.875rem', padding: '0.5rem', minHeight: '80px', resize: 'vertical' }}
                    placeholder="If empty, excerpt is auto-generated"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                  ></textarea>
                </label>
              </div>
            )}
          </aside>
        </main>

   
      </div>
    </>
  );
}
