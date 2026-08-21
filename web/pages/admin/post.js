import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api, postsApi, mediaApi, newsroomApi } from '../../lib/api';
import { slugifyTitle } from '../../lib/utils';
import { tw } from '../../lib/tw';
import { useCategories } from '../../hooks/useCategories';
import { ACCENT_PRESETS, DEFAULT_ACCENT, normalizeAccentColor } from '../../lib/accents';
import { accessFor } from '../../lib/access';
import { GutenbergEditor, SettingsSection } from '../../components/admin/editor/GutenbergEditor';
import { MultiSelect } from '../../components/admin/wp/MultiSelect';

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
  const [extraCategories, setExtraCategories] = useState([]);
  const [featuredIn, setFeaturedIn] = useState([]);
  const [siteCatalog, setSiteCatalog] = useState({ categories: [], sections: [] });
  const [readMinutes, setReadMinutes] = useState('');
  const [ogImg, setOgImg] = useState('');
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [tags, setTags] = useState('');
  const [correction, setCorrection] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isSponsored, setIsSponsored] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [relatedIds, setRelatedIds] = useState('');
  const [revisions, setRevisions] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [contentHtml, setContentHtml] = useState('');

  const access = accessFor(me);
  const modeLabel = postId ? 'Edit post' : 'New post';
  const viewHref = postId
    ? `/post/${encodeURIComponent(slugifyTitle(title))}`
    : '/';
  const previewHref = postId
    ? `/post/${encodeURIComponent(slugifyTitle(title))}?preview=true&id=${encodeURIComponent(postId)}`
    : '';

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
    if (editorRef.current) {
      editorHtmlRef.current = editorRef.current.innerHTML;
      setContentHtml(editorRef.current.innerHTML);
      setDirty(true);
    }
  }

  function formatBlock(tagName) {
    focusEditor();
    document.execCommand('formatBlock', false, `<${tagName}>`);
    if (editorRef.current) {
      editorHtmlRef.current = editorRef.current.innerHTML;
      setContentHtml(editorRef.current.innerHTML);
      setDirty(true);
    }
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
    setExtraCategories([]);
    setFeaturedIn([]);
    setOgImg('');
    setAccentColor(DEFAULT_ACCENT);
    setReadMinutes('');
    setExcerpt('');
    setStatus('draft');
    setScheduledAt('');
    setTags('');
    setCorrection('');
    setIsBreaking(false);
    setIsPinned(false);
    setIsSponsored(false);
    setSourceUrl('');
    setSourceName('');
    setRelatedIds('');
    setRevisions([]);
    editorHtmlRef.current = '';
    setContentHtml('');
    setDirty(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
  }

  function fillForm(post) {
    setPostId(post.id);
    setTitle(post.title || '');
    setBucket(post.bucket || 'Tech');
    setExtraCategories(post.extraCategories || []);
    setFeaturedIn(post.featuredIn || []);
    setOgImg(post.ogImg || '');
    setAccentColor(normalizeAccentColor(post.accentColor, DEFAULT_ACCENT));
    setReadMinutes(post.readMinutes ? String(post.readMinutes) : '');
    setExcerpt(post.excerpt || '');
    setStatus(post.status || 'draft');
    setScheduledAt(post.scheduledAt ? String(post.scheduledAt).slice(0, 16) : '');
    setTags((post.tags || []).join(', '));
    setCorrection(post.correction || '');
    setIsBreaking(!!post.isBreaking);
    setIsPinned(!!post.isPinned);
    setIsSponsored(!!post.isSponsored);
    setSourceUrl(post.sourceUrl || '');
    setSourceName(post.sourceName || '');
    setRelatedIds((post.relatedIds || []).join(', '));
    editorHtmlRef.current = post.content || '';
    setContentHtml(post.content || '');
    setDirty(false);
    if (post.id) {
      postsApi.revisions(post.id).then(setRevisions).catch(() => setRevisions([]));
    }
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

  function collectPayload(overrides = {}) {
    const content = editorRef.current ? editorRef.current.innerHTML : editorHtmlRef.current;

    return {
      title: title.trim(),
      bucket,
      extraCategories,
      featuredIn,
      content,
      excerpt: excerpt.trim() ? excerpt.trim() : null,
      creator: me ? me.username : null,
      ogImg: ogImg.trim() ? ogImg.trim() : null,
      accentColor: normalizeAccentColor(accentColor, DEFAULT_ACCENT),
      readMinutes: readMinutes ? Number(readMinutes) : null,
      status: overrides.status ?? status,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      tags,
      correction,
      isBreaking,
      isPinned,
      isSponsored,
      sourceUrl,
      sourceName,
      relatedIds,
    };
  }

  const persist = useCallback(
    async (overrides = {}) => {
      setHint('');
      const payload = collectPayload(overrides);
      if (!payload.title) {
        setHint('Title is required.');
        return;
      }

      setSaving(true);
      try {
        if (!postId) {
          const created = await postsApi.create(payload);
          setHint('Saved.');
          setLastSavedAt(Date.now());
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
          setHint(overrides.status === 'published' ? 'Published.' : 'Updated.');
          setLastSavedAt(Date.now());
          fillForm(updated);
        }
      } catch (err) {
        setHint(String(err?.message || err));
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      postId,
      title,
      bucket,
      extraCategories,
      featuredIn,
      excerpt,
      me,
      ogImg,
      accentColor,
      readMinutes,
      status,
      scheduledAt,
      tags,
      correction,
      isBreaking,
      isPinned,
      isSponsored,
      sourceUrl,
      sourceName,
      relatedIds,
    ]
  );

  async function onDelete() {
    if (!postId) return;
    if (!confirm('Delete this post?')) return;

    setHint('');
    try {
      await api(`/api/admin/post?id=${encodeURIComponent(postId)}`, { method: 'DELETE' });
      setHint('Deleted.');
      await router.replace('/admin');
    } catch (err) {
      setHint(String(err?.message || err));
    }
  }

  useEffect(() => {
    (async () => {
      await refreshCategories();
      try {
        const cat = await newsroomApi.getCatalog();
        setSiteCatalog({ categories: cat.categories || [], sections: cat.sections || [] });
      } catch {
        // Keep using the categories hook if the catalog is not seeded yet.
      }
      const ok = await refreshMe();
      if (!ok) {
        router.replace('/admin');
        return;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const el = editorRef.current;
    if (!el) return;
    if (editorHtmlRef.current && el.innerHTML !== editorHtmlRef.current) {
      el.innerHTML = editorHtmlRef.current;
    }
    const onInput = () => {
      editorHtmlRef.current = el.innerHTML;
      setContentHtml(el.innerHTML);
      setDirty(true);
    };
    el.addEventListener('input', onInput);
    return () => el.removeEventListener('input', onInput);
  }, [postId]);

  function touch(setter) {
    return (e) => {
      setDirty(true);
      setter(typeof e === 'object' && e?.target ? e.target.type === 'checkbox' ? e.target.checked : e.target.value : e);
    };
  }

  async function onImageFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setHint('Uploading image...');
    try {
      const out = await mediaApi.upload(file);
      exec('insertImage', out.url);
      setHint('Image inserted.');
    } catch (err) {
      setHint(String(err?.message || err));
    }
  }

  if (!me) {
    return (
      <>
        <Head>
          <title>Wirefringe – Editor</title>
        </Head>
        <div className="admin-xai grid min-h-screen place-items-center bg-bg">
          <p className="m-0 text-[13px] text-ink-secondary">Loading editor…</p>
        </div>
      </>
    );
  }

  const settingsPanel = (
    <>
      <SettingsSection title="Status & visibility">
        <label className="flex items-center justify-between gap-2 text-[13px]">
          <span className="text-ink-secondary">Status</span>
          <select className={tw.formSelect} value={status} onChange={touch(setStatus)}>
            <option value="draft">Draft</option>
            <option value="review">Pending review</option>
            <option value="scheduled">Scheduled</option>
            {access.canPublish || status === 'published' ? (
              <option value="published" disabled={!access.canPublish}>
                Published
              </option>
            ) : null}
            {access.canUnpublish || status === 'unpublished' ? (
              <option value="unpublished" disabled={!access.canUnpublish}>
                Unpublished
              </option>
            ) : null}
          </select>
        </label>
        {status === 'scheduled' ? (
          <label className="block text-[13px]">
            <span className="mb-1 block text-ink-secondary">Publish at</span>
            <input className={tw.formInput} type="datetime-local" value={scheduledAt} onChange={touch(setScheduledAt)} />
          </label>
        ) : null}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isBreaking} onChange={touch(setIsBreaking)} />
          Breaking
        </label>
        {access.canPin ? (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPinned} onChange={touch(setIsPinned)} />
            Pin
          </label>
        ) : null}
        {access.canMarkSponsored ? (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isSponsored} onChange={touch(setIsSponsored)} />
            Sponsored / branded
          </label>
        ) : null}
        {access.isAuthor && status === 'published' ? (
          <p className="m-0 text-[11px] text-ink-tertiary">This is live. An editor must unpublish it.</p>
        ) : access.isAuthor ? (
          <p className="m-0 text-[11px] text-ink-tertiary">Send to Review when ready. An editor publishes it.</p>
        ) : null}
      </SettingsSection>

      <SettingsSection title="Placement">
        <p className="m-0 mb-3 text-[12px] text-ink-secondary">
          Category is the topic. Sections decide where this post appears on the site.
        </p>
        <label className="mb-3 block text-[13px]">
          <span className="mb-1 block text-ink-secondary">Primary category</span>
          <select className={tw.formSelect} value={bucket} onChange={touch(setBucket)}>
            {(siteCatalog.categories?.length
              ? siteCatalog.categories.filter((c) => c.enabled !== false).map((c) => c.name)
              : categoryNames
            ).map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="mb-3 block text-[13px]">
          <span className="mb-1 block text-ink-secondary">Additional categories</span>
          <MultiSelect
            options={(siteCatalog.categories || []).filter((c) => c.enabled !== false && c.name !== bucket).map((c) => c.name)}
            value={extraCategories}
            onChange={(v) => {
              setExtraCategories(v);
              setDirty(true);
            }}
            placeholder="Search categories…"
          />
        </label>
        <label className="block text-[13px]">
          <span className="mb-1 block text-ink-secondary">Pin to homepage / header / sidebar sections</span>
          <MultiSelect
            options={(siteCatalog.sections || []).filter((s) => s.enabled !== false && s.kind !== 'stream')}
            value={featuredIn}
            onChange={(v) => {
              setFeaturedIn(v);
              setDirty(true);
            }}
            placeholder="Search sections…"
            getId={(o) => o.id}
            getLabel={(o) => {
              const places = [
                o.showHome ? 'home' : null,
                o.showHeader ? 'header' : null,
                o.showSidebar ? 'sidebar' : null,
              ].filter(Boolean);
              return `${o.name}${places.length ? ` (${places.join(', ')})` : ''}`;
            }}
          />
        </label>
      </SettingsSection>

      <SettingsSection title="Tags">
        <input
          className={tw.formInput}
          value={tags}
          onChange={touch(setTags)}
          placeholder="ai, markets, india"
        />
      </SettingsSection>

      <SettingsSection title="Featured image">
        {ogImg ? (
          <button type="button" className="block w-full border-0 bg-transparent p-0" onClick={() => { setOgImg(''); setDirty(true); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogImg} alt="" className="aspect-[3/2] w-full object-cover" />
            <span className="mt-1 block text-center text-[11px] text-mint">Remove featured image</span>
          </button>
        ) : (
          <input
            className={tw.formInput}
            placeholder="Image URL"
            value={ogImg}
            onChange={touch(setOgImg)}
          />
        )}
      </SettingsSection>

      <SettingsSection title="Excerpt" defaultOpen={false}>
        <textarea
          className={tw.formTextarea}
          placeholder="Write an excerpt (optional)"
          value={excerpt}
          onChange={touch(setExcerpt)}
        />
      </SettingsSection>

      <SettingsSection title="Story extras" defaultOpen={false}>
        <label className="block text-[13px]">
          <span className="mb-1 block text-ink-secondary">Read minutes</span>
          <input className={tw.formInput} type="number" min="1" value={readMinutes} onChange={touch(setReadMinutes)} />
        </label>
        <label className="block text-[13px]">
          <span className="mb-1 block text-ink-secondary">Source name</span>
          <input className={tw.formInput} value={sourceName} onChange={touch(setSourceName)} />
        </label>
        <label className="block text-[13px]">
          <span className="mb-1 block text-ink-secondary">Source URL</span>
          <input className={tw.formInput} value={sourceUrl} onChange={touch(setSourceUrl)} />
        </label>
        <label className="block text-[13px]">
          <span className="mb-1 block text-ink-secondary">Related post IDs</span>
          <input className={tw.formInput} value={relatedIds} onChange={touch(setRelatedIds)} placeholder="id-one, id-two" />
        </label>
        <label className="block text-[13px]">
          <span className="mb-1 block text-ink-secondary">Correction</span>
          <textarea className={tw.formTextarea} value={correction} onChange={touch(setCorrection)} />
        </label>
      </SettingsSection>

      <SettingsSection title="Header color" defaultOpen={false}>
        <p className="m-0 mb-2 text-[11px] leading-snug text-ink-tertiary">
          Lime-style band behind the header and hero on this post only.
        </p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {ACCENT_PRESETS.map((preset) => {
            const selected = normalizeAccentColor(accentColor, '') === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                title={preset.name}
                aria-label={preset.name}
                aria-pressed={selected}
                onClick={() => {
                  setAccentColor(preset.value);
                  setDirty(true);
                }}
                className="h-7 w-7 cursor-pointer rounded-full border-0 p-0"
                style={{
                  background: preset.value,
                  outline: selected ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                  outlineOffset: '2px',
                }}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={normalizeAccentColor(accentColor, DEFAULT_ACCENT)}
            onChange={(e) => {
              setAccentColor(e.target.value.toUpperCase());
              setDirty(true);
            }}
            className="h-9 w-9 cursor-pointer border-0 bg-transparent p-0"
            aria-label="Custom header color"
          />
          <input className={tw.formInput} value={accentColor} onChange={touch(setAccentColor)} placeholder={DEFAULT_ACCENT} />
        </div>
      </SettingsSection>

      {revisions.length ? (
        <SettingsSection title="Revisions" defaultOpen={false}>
          {revisions.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 py-1 text-[12px]">
              <span>
                {r.editorName || 'Editor'} · {r.status}
              </span>
              <button
                type="button"
                className="border-0 bg-transparent p-0 text-mint"
                onClick={async () => {
                  const updated = await postsApi.rollback(postId, r.id);
                  fillForm(updated);
                  setHint('Rolled back.');
                }}
              >
                Rollback
              </button>
            </div>
          ))}
        </SettingsSection>
      ) : null}
    </>
  );

  return (
    <>
      <Head>
        <title>{`Wirefringe – ${modeLabel}`}</title>
      </Head>
      <GutenbergEditor
        title={title}
        onTitleChange={(v) => {
          setTitle(v);
          setDirty(true);
        }}
        status={status}
        dirty={dirty}
        saving={saving}
        lastSavedAt={lastSavedAt}
        hint={hint}
        postId={postId}
        viewHref={viewHref}
        previewHref={previewHref}
        editorRef={editorRef}
        fileInputRef={fileInputRef}
        exec={exec}
        formatBlock={formatBlock}
        onPersist={persist}
        onDelete={onDelete}
        onImageFile={onImageFile}
        contentHtml={contentHtml}
        onContentChange={(html) => {
          editorHtmlRef.current = html;
          setContentHtml(html);
          setDirty(true);
        }}
        canPublish={Boolean(access.canPublish)}
        settingsPanel={settingsPanel}
      />
    </>
  );
}
