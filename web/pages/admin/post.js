import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { initTheme } from '../../lib/theme';
import { api, postsApi, mediaApi } from '../../lib/api';
import { slugifyTitle, cn } from '../../lib/utils';
import { tw } from '../../lib/tw';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
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

      <div className={tw.pageShellAdmin}>
        <div className="admin-xai-noise" aria-hidden="true" />
        <header className="border-b border-white/[0.07] bg-black/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center justify-between gap-4 px-6 py-3.5 max-w-[1280px] mx-auto w-full">
            <Link className="flex items-center gap-3 no-underline text-white" href="/admin" aria-label="Back to admin">
              <BrandLogo size="sm" />
              <div>
                <h1 className="m-0 text-base font-semibold tracking-tight">Editor</h1>
                <span id="editorMode" className="text-xs text-white/40">{modeLabel}</span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className={tw.adminMe} id="meLine">
                {me ? `Signed in as ${me.username} (${me.role})` : ''}
              </div>
              <button className={tw.pillBtn} id="logoutBtn" type="button" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className={tw.editorShell}>
          <section className={cn(tw.sideCard, tw.editorCard)}>
            <form id="editorForm" className={tw.form} onSubmit={onSave}>
              <input type="hidden" id="postId" value={postId} readOnly />

              <div className={tw.editorToolbar} role="toolbar" aria-label="Editor toolbar">
                <button
                  className={tw.pillBtn}
                  type="button"
                  data-cmd="bold"
                  onClick={() => exec('bold')}
                  aria-label="Bold"
                  title="Bold"
                >
                  <span className="inline-flex items-center justify-center font-bold text-sm" aria-hidden="true">
                    B
                  </span>
                </button>
                <button
                  className={tw.pillBtn}
                  type="button"
                  data-cmd="italic"
                  onClick={() => exec('italic')}
                  aria-label="Italic"
                  title="Italic"
                >
                  <span className="inline-flex items-center justify-center font-bold text-sm" aria-hidden="true">
                    I
                  </span>
                </button>
                <button
                  className={tw.pillBtn}
                  type="button"
                  data-cmd="underline"
                  onClick={() => exec('underline')}
                  aria-label="Underline"
                  title="Underline"
                >
                  <span className="inline-flex items-center justify-center font-bold text-sm" aria-hidden="true">
                    U
                  </span>
                </button>
                <button
                  className={tw.pillBtn}
                  type="button"
                  data-cmd="strikeThrough"
                  onClick={() => exec('strikeThrough')}
                  aria-label="Strikethrough"
                  title="Strikethrough"
                >
                  <span className="inline-flex items-center justify-center font-bold text-sm" aria-hidden="true">
                    S
                  </span>
                </button>

                <div className="w-px h-6 bg-line mx-1 self-center"></div>

                <button
                  className={tw.pillBtn}
                  type="button"
                  data-block="h2"
                  onClick={() => formatBlock('h2')}
                  aria-label="Heading 2"
                  title="Heading 2"
                >
                  <span className="inline-flex items-center justify-center font-bold text-sm" aria-hidden="true">
                    H2
                  </span>
                </button>
                <button
                  className={tw.pillBtn}
                  type="button"
                  data-block="h3"
                  onClick={() => formatBlock('h3')}
                  aria-label="Heading 3"
                  title="Heading 3"
                >
                  <span className="inline-flex items-center justify-center font-bold text-sm" aria-hidden="true">
                    H3
                  </span>
                </button>
                <button
                  className={tw.pillBtn}
                  type="button"
                  data-cmd="insertUnorderedList"
                  onClick={() => exec('insertUnorderedList')}
                  aria-label="Bulleted list"
                  title="Bulleted list"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
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
                  className={tw.pillBtn}
                  type="button"
                  data-cmd="insertOrderedList"
                  onClick={() => exec('insertOrderedList')}
                  aria-label="Numbered list"
                  title="Numbered list"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
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
                  className={tw.pillBtn}
                  type="button"
                  data-block="blockquote"
                  onClick={() => formatBlock('blockquote')}
                  aria-label="Quote"
                  title="Quote"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 17H11V11H7V7H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13 17H17V11H13V7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <button
                  className={tw.pillBtn}
                  type="button"
                  data-block="pre"
                  onClick={() => formatBlock('pre')}
                  aria-label="Code block"
                  title="Code block"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 9L4 12L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 9L20 12L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 8L10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                <div className="w-px h-6 bg-line mx-1 self-center"></div>

                <button
                  className={tw.pillBtn}
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
                  <span className="inline-flex items-center justify-center w-4 h-4 [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
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
                  className={tw.pillBtn}
                  type="button"
                  id="unlinkBtn"
                  onClick={() => exec('unlink')}
                  aria-label="Remove link"
                  title="Remove link"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
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
                  className={tw.pillBtn}
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
                  <span className="inline-flex items-center justify-center w-4 h-4 [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                      <circle cx="9" cy="11" r="1.5" fill="currentColor" />
                      <path d="M20 16L15 11L7 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <button
                  className={tw.pillBtn}
                  type="button"
                  id="uploadImageBtn"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload image"
                  title="Upload image"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
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
                className={tw.editor}
                contentEditable={true}
                spellCheck={true}
                aria-label="Post content"
                suppressContentEditableWarning={true}
              ></div>

              <div className="flex items-center gap-3 flex-wrap mt-4">
                <button className={tw.heroCta} type="submit" id="saveBtn">
                  Save
                </button>
                {postId ? (
                  <button className={tw.pillBtn} type="button" id="deleteBtn" onClick={onDelete}>
                    <span className={tw.dot} style={{ background: 'var(--danger)' }}></span>
                    Delete
                  </button>
                ) : null}
                {postId ? (
                  <a className={tw.pillBtn} id="viewBtn" href={viewHref}>
                    <span className={tw.dot} style={{ background: 'var(--accent)' }}></span>
                    View
                  </a>
                ) : null}
                <div className={tw.formHint} id="hint">
                  {hint}
                </div>
              </div>
            </form>
          </section>

          {/* Right Sidebar - Metadata Panel */}
          <aside
            className={cn(tw.sideCard, tw.editorSidebar)}
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
              className={tw.editorSidebarHeader}
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
              {sidebarExpanded && <span className={cn(tw.formLabel, 'm-0 text-[0.8rem]')}>Metadata</span>}
              <span
                className="inline-flex items-center justify-center w-[22px] h-[22px] transition-transform duration-200"
                style={{
                  transform: sidebarExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </span>
            </div>

            {sidebarExpanded && (
              <div
                className={tw.editorSidebarContent}
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Title field */}
                <div className={tw.formGroup}>
                  <label className={tw.formLabel}>Title</label>
                  <input
                    className={tw.formInput}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post title..."
                  />
                </div>

                {/* Category & Read minutes row */}
                <div className="flex gap-2">
                  <div className={cn(tw.formGroup, 'flex-1')}>
                    <label className={tw.formLabel}>Category</label>
                    <select
                      className={tw.formSelect}
                      value={bucket}
                      onChange={(e) => setBucket(e.target.value)}
                    >
                      {categoryNames.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className={cn(tw.formGroup, 'w-20')}>
                    <label className={tw.formLabel}>Read min</label>
                    <input
                      className={tw.formInput}
                      type="number"
                      min="1"
                      value={readMinutes}
                      onChange={(e) => setReadMinutes(e.target.value)}
                      placeholder="3"
                    />
                  </div>
                </div>

                {/* OpenGraph Image URL */}
                <div className={tw.formGroup}>
                  <label className={tw.formLabel}>OpenGraph Image URL (optional)</label>
                  <input
                    className={tw.formInput}
                    placeholder="https://..."
                    value={ogImg}
                    onChange={(e) => setOgImg(e.target.value)}
                  />
                </div>

                {/* Excerpt */}
                <div className={tw.formGroup}>
                  <label className={tw.formLabel}>Excerpt (optional)</label>
                  <textarea
                    className={tw.formTextarea}
                    placeholder="If empty, excerpt is auto-generated"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}
          </aside>
        </main>

   
      </div>
    </>
  );
}
