import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

const BLOCKS = [
  { id: 'p', label: 'Paragraph', group: 'text', cmd: 'p' },
  { id: 'h2', label: 'Heading', group: 'text', cmd: 'h2' },
  { id: 'h3', label: 'Subheading', group: 'text', cmd: 'h3' },
  { id: 'ul', label: 'List', group: 'text', cmd: 'ul' },
  { id: 'ol', label: 'Numbers', group: 'text', cmd: 'ol' },
  { id: 'quote', label: 'Quote', group: 'text', cmd: 'blockquote' },
  { id: 'pre', label: 'Code', group: 'text', cmd: 'pre' },
  { id: 'img', label: 'Image', group: 'media', cmd: 'image' },
  { id: 'hr', label: 'Separator', group: 'design', cmd: 'hr' },
];

function wordStats(title, html) {
  const text = `${title || ''} ${String(html || '').replace(/<[^>]+>/g, ' ')}`.replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  const chars = text.length;
  const minutes = Math.max(1, Math.round(words / 220) || 1);
  return { words, chars, minutes: words ? minutes : 0 };
}

function headingOutline(html) {
  const out = [];
  const re = /<(h[2-4])[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(String(html || '')))) {
    out.push({
      tag: m[1].toLowerCase(),
      text: m[2].replace(/<[^>]+>/g, '').trim() || 'Heading',
    });
  }
  return out;
}

export function GutenbergEditor({
  title,
  onTitleChange,
  status,
  dirty,
  saving,
  lastSavedAt,
  hint,
  postId,
  viewHref,
  previewHref,
  editorRef,
  fileInputRef,
  exec,
  formatBlock,
  onPersist,
  onDelete,
  onImageFile,
  contentHtml,
  onContentChange,
  canPublish,
  settingsPanel,
}) {
  const [inserterOpen, setInserterOpen] = useState(false);
  const [listView, setListView] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [preview, setPreview] = useState(false);
  const [codeView, setCodeView] = useState(false);
  const [pubOpen, setPubOpen] = useState(false);
  const [code, setCode] = useState('');

  const stats = useMemo(() => wordStats(title, contentHtml), [title, contentHtml]);
  const outline = useMemo(() => headingOutline(contentHtml), [contentHtml]);

  const saveLabel = saving ? 'Saving…' : dirty ? 'Unsaved' : lastSavedAt ? 'Saved' : 'Saved';
  const isPublished = status === 'published';

  useEffect(() => {
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onPersist();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPersist]);

  useEffect(() => {
    if (codeView) setCode(contentHtml || '');
  }, [codeView, contentHtml]);

  function applyBlock(cmd) {
    if (cmd === 'p' || cmd === 'h2' || cmd === 'h3' || cmd === 'blockquote' || cmd === 'pre') {
      formatBlock(cmd);
    } else if (cmd === 'ul') exec('insertUnorderedList');
    else if (cmd === 'ol') exec('insertOrderedList');
    else if (cmd === 'hr') exec('insertHorizontalRule');
    else if (cmd === 'image') fileInputRef.current?.click();
    setInserterOpen(false);
  }

  function applyCode() {
    if (editorRef.current) {
      editorRef.current.innerHTML = code;
      onContentChange?.(code);
    }
    setCodeView(false);
  }

  return (
    <div className="admin-xai flex h-screen flex-col bg-bg text-ink">
      <header className="relative z-30 flex h-14 shrink-0 items-center gap-1 border-b border-line bg-bg-elevated px-1.5 md:px-2">
        <Link
          href="/admin"
          className="grid size-10 place-items-center text-ink no-underline hover:bg-[var(--chip)]"
          title="View Posts"
        >
          <span className="font-serif text-lg font-semibold leading-none">
            W<span className="admin-brand-f italic">F</span>
          </span>
        </Link>
        <IconBtn
          label="Toggle block inserter"
          active={inserterOpen}
          onClick={() => {
            setInserterOpen((v) => !v);
            setListView(false);
          }}
        >
          <PlusIcon />
        </IconBtn>
        <IconBtn label="Bold" onClick={() => exec('bold')}>
          <span className="text-[13px] font-bold">B</span>
        </IconBtn>
        <IconBtn label="Italic" onClick={() => exec('italic')}>
          <span className="text-[13px] italic font-serif">I</span>
        </IconBtn>
        <IconBtn
          label="Document overview"
          active={listView}
          onClick={() => {
            setListView((v) => !v);
            setInserterOpen(false);
          }}
        >
          <ListIcon />
        </IconBtn>
        <IconBtn
          label="Code editor"
          active={codeView}
          onClick={() => {
            setCodeView((v) => !v);
            setPreview(false);
          }}
        >
          <CodeIcon />
        </IconBtn>
        <div className="ml-2 hidden text-[13px] text-ink-secondary sm:block">{saveLabel}</div>
        {hint ? <div className="hidden truncate text-[12px] text-ink-tertiary md:block">{hint}</div> : null}

        <div className="ml-auto flex items-center gap-1">
          <IconBtn
            label="Preview"
            active={preview}
            onClick={() => {
              setPreview((v) => !v);
              setCodeView(false);
            }}
          >
            <EyeIcon />
          </IconBtn>
          <IconBtn
            label="Settings"
            active={sidebarOpen}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <GearIcon />
          </IconBtn>
          {isPublished ? (
            <>
              <button
                type="button"
                className="hidden h-8 items-center px-2 text-[13px] text-ink hover:underline sm:inline-flex"
                onClick={() => onPersist({ status: 'draft' })}
              >
                Switch to draft
              </button>
              <button type="button" className={cn(tw.primaryBtn, 'h-8')} onClick={() => onPersist()}>
                Update
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="hidden h-8 items-center px-2 text-[13px] text-mint hover:text-mint-hover sm:inline-flex"
                onClick={() => onPersist({ status: 'draft' })}
              >
                Save draft
              </button>
              <div className="relative">
                <button
                  type="button"
                  className={cn(tw.primaryBtn, 'h-8')}
                  onClick={() => setPubOpen((v) => !v)}
                >
                  {canPublish ? 'Publish' : 'Submit'}
                  <ChevronIcon />
                </button>
                {pubOpen ? (
                  <div className="absolute right-0 top-full z-40 mt-1 w-72 rounded-sm border border-line-strong bg-bg-elevated p-4 shadow-[var(--shadow-float)]">
                    <p className="mb-2 text-[13px] font-semibold">
                      {canPublish ? 'Publish' : 'Submit for review'}
                    </p>
                    <p className="mb-3 text-[13px] text-ink-secondary">
                      Double-check your settings, then {canPublish ? 'publish this piece to the public site.' : 'send it to an editor.'}
                    </p>
                    <button
                      type="button"
                      className={cn(tw.primaryBtn, 'h-9 w-full')}
                      onClick={() => {
                        setPubOpen(false);
                        onPersist({ status: canPublish ? 'published' : 'review' });
                      }}
                    >
                      {canPublish ? 'Publish' : 'Submit for review'}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </header>

      {preview ? (
        <PreviewPane title={title} html={contentHtml} minutes={stats.minutes} href={previewHref} />
      ) : codeView ? (
        <div className="flex min-h-0 flex-1 flex-col bg-[var(--admin-rail)] p-4">
          <textarea
            className="min-h-0 flex-1 resize-none border-0 bg-transparent font-mono text-[12px] leading-relaxed text-[var(--admin-rail-fg)] outline-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
          <div className="pt-3">
            <button type="button" className={tw.primaryBtn} onClick={applyCode}>
              Apply HTML
            </button>
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1">
          {(inserterOpen || listView) && (
            <aside className="absolute inset-y-14 left-0 z-20 flex w-[min(100%,352px)] flex-col border-r border-line bg-bg-elevated md:static md:z-0">
              {listView ? (
                <ListViewPanel
                  title={title}
                  outline={outline}
                  onClose={() => setListView(false)}
                />
              ) : (
                <InserterPanel onAdd={applyBlock} onClose={() => setInserterOpen(false)} />
              )}
            </aside>
          )}

          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[840px] px-4 py-10 md:px-8 md:py-16">
              <div className="rounded-sm bg-bg-elevated px-4 py-8 md:px-16 md:py-14">
                <textarea
                  rows={1}
                  className="entry-title mb-6"
                  placeholder="Add title"
                  value={title}
                  onChange={(e) => {
                    onTitleChange(e.target.value);
                    e.target.style.height = '0px';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
                <div
                  ref={editorRef}
                  id="editor"
                  className={tw.editor}
                  contentEditable
                  spellCheck
                  aria-label="Post content"
                  data-placeholder="Start writing, or press + to add a block"
                  suppressContentEditableWarning
                />
                <button
                  type="button"
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 text-[13px] text-ink-muted hover:bg-[var(--chip)] hover:text-ink"
                  onClick={() => setInserterOpen(true)}
                >
                  <PlusIcon size={16} /> Add a block
                </button>
              </div>
              <div className="mt-6 flex justify-end gap-4 px-2 text-[11px] tabular-nums text-ink-secondary">
                <span>{stats.words} words</span>
                <span>{stats.chars} characters</span>
                <span>{stats.minutes} min read</span>
              </div>
            </div>
          </main>

          {sidebarOpen ? (
            <aside className="absolute inset-y-14 right-0 z-20 flex w-[min(100%,280px)] flex-col border-l border-line bg-bg-elevated md:static md:z-0">
              <SettingsSidebar
                onClose={() => setSidebarOpen(false)}
                settingsPanel={settingsPanel}
                postId={postId}
                viewHref={viewHref}
                onDelete={onDelete}
              />
            </aside>
          ) : null}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImageFile}
      />
    </div>
  );
}

function SettingsSidebar({ onClose, settingsPanel, postId, viewHref, onDelete }) {
  const [tab, setTab] = useState('post');
  return (
    <div className="flex h-full flex-col text-[13px]">
      <div className="flex border-b border-line">
        {['post', 'block'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'h-12 flex-1 text-[13px] font-medium capitalize',
              tab === t ? 'border-b-2 border-ink text-ink' : 'text-ink-secondary hover:text-ink'
            )}
          >
            {t === 'post' ? 'Post' : 'Block'}
          </button>
        ))}
        <button
          type="button"
          className="grid size-12 place-items-center text-ink-secondary hover:text-ink"
          onClick={onClose}
          aria-label="Close settings"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'post' ? (
          <>
            {settingsPanel}
            <div className="space-y-2 border-t border-line px-4 py-4">
              {postId ? (
                <a href={viewHref} className="block text-[13px] text-mint no-underline hover:text-mint-hover" target="_blank" rel="noreferrer">
                  View post
                </a>
              ) : null}
              {postId ? (
                <button
                  type="button"
                  className="block border-0 bg-transparent p-0 text-[13px] text-[var(--danger)]"
                  onClick={onDelete}
                >
                  Move to trash
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="p-4 text-ink-secondary">
            Select text in the canvas and use the toolbar to format this block.
          </p>
        )}
      </div>
    </div>
  );
}

function InserterPanel({ onAdd, onClose }) {
  const [q, setQ] = useState('');
  const items = BLOCKS.filter(
    (b) => !q || b.label.toLowerCase().includes(q.toLowerCase())
  );
  const groups = ['text', 'media', 'design'];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <p className="m-0 text-[13px] font-semibold">Add a block</p>
        <button type="button" className="grid size-8 place-items-center" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      <div className="p-3">
        <input
          className={tw.formInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          autoFocus
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((g) => {
          const list = items.filter((i) => i.group === g);
          if (!list.length) return null;
          return (
            <section key={g} className="mb-5">
              <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-secondary">
                {g === 'text' ? 'Text' : g === 'media' ? 'Media' : 'Design'}
              </h2>
              <div className="inserter-grid">
                {list.map((item) => (
                  <button key={item.id} type="button" className="inserter-item" onClick={() => onAdd(item.cmd)}>
                    <span className="ic">
                      <PlusIcon size={18} />
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ListViewPanel({ title, outline, onClose }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <p className="m-0 text-[13px] font-semibold">Document</p>
        <button type="button" className="grid size-8 place-items-center" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wide text-ink-secondary">Outline</p>
        <button
          type="button"
          className="mb-1 flex h-8 w-full items-center rounded-sm px-2 text-left text-[13px] hover:bg-[var(--chip)]"
          onClick={() => document.querySelector('.entry-title')?.focus()}
        >
          {title || 'Add title'}
        </button>
        {outline.map((h, i) => (
          <div
            key={`${h.tag}-${i}`}
            className={cn('flex h-8 items-center rounded-sm px-2 text-[13px] text-ink-secondary', h.tag === 'h3' && 'pl-5', h.tag === 'h4' && 'pl-8')}
          >
            <span className="truncate">{h.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewPane({ title, html, minutes, href }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-bg-elevated">
      <article className="mx-auto max-w-[720px] px-5 py-12 md:py-20">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-secondary">Preview</p>
        <h1 className="m-0 font-serif text-[2.6rem] font-normal leading-[1.15] tracking-tight">{title || 'Untitled'}</h1>
        <p className="mt-4 text-[13px] text-ink-secondary">{minutes} min read</p>
        <div className="article-body mt-10" dangerouslySetInnerHTML={{ __html: html || '' }} />
        {href ? (
          <p className="mt-10">
            <a href={href} className="text-[13px] text-mint" target="_blank" rel="noreferrer">
              Open public preview →
            </a>
          </p>
        ) : null}
      </article>
    </div>
  );
}

export function SettingsSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="panel-section">
      <button
        type="button"
        className="flex h-11 w-full items-center justify-between px-4 text-left text-[13px] font-semibold"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span className={cn('text-ink-secondary transition-transform', open && 'rotate-180')}>
          <ChevronIcon />
        </span>
      </button>
      {open ? <div className="space-y-3 px-4 pb-4">{children}</div> : null}
    </section>
  );
}

function IconBtn({ label, onClick, active, disabled, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid size-10 place-items-center rounded-sm text-ink-secondary hover:bg-[var(--chip)] hover:text-ink disabled:opacity-30',
        active && 'bg-mint text-[var(--admin-accent-fg,#111)] hover:bg-mint hover:text-[var(--admin-accent-fg,#111)]'
      )}
    >
      {children}
    </button>
  );
}

function PlusIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 110 4h-.2a1.7 1.7 0 00-1.5 1z" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
