import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { postUrl, stripHtml, cn } from '../../lib/utils';
import { relativeUpdated, shouldShowUpdated } from '../../lib/articleExtras';

export function FadeImg({ src, alt = '', className = '', ...rest }) {
  const [on, setOn] = useState(!src);
  return src ? (
    <img
      src={src}
      alt={alt}
      onLoad={() => setOn(true)}
      className={cn('transition-opacity duration-700 ease-out', on ? 'opacity-100' : 'opacity-0', className)}
      {...rest}
    />
  ) : null;
}

export function KeyPoints({ points = [] }) {
  if (!points.length) return null;
  return (
    <aside className="mb-8 border border-line bg-bg-elevated px-5 py-4">
      <p className="m-0 mb-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-mint">Key points</p>
      <ul className="m-0 list-disc space-y-1.5 pl-5">
        {points.map((p) => (
          <li key={p} className="text-[14.5px] leading-snug text-ink-dek">
            {p}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function UpdatedStamp({ post }) {
  if (!shouldShowUpdated(post)) return null;
  return (
    <p className="m-0 mb-4 font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">
      {relativeUpdated(post.correctedAt || post.updatedAt)}
    </p>
  );
}

export function PrevNext({ prev, next }) {
  if (!prev && !next) return null;
  return (
    <nav className="mt-10 grid grid-cols-1 gap-3 border-t border-line pt-6 sm:grid-cols-2" aria-label="More stories">
      {prev ? (
        <Link href={postUrl(prev)} className="group block border border-line p-4 no-underline hover:border-mint">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mint">Previous</span>
          <span className="mt-1.5 block font-extrabold leading-snug text-ink group-hover:text-mint">{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link href={postUrl(next)} className="group block border border-line p-4 no-underline hover:border-mint sm:text-right">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mint">Next</span>
          <span className="mt-1.5 block font-extrabold leading-snug text-ink group-hover:text-mint">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}

export function TableOfContents({ headings = [] }) {
  if (!headings || headings.length < 2) return null;
  return (
    <nav className="relative z-[1] mb-6 border-b border-line pb-4" aria-label="In this story">
      <h3 className="font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-mint mt-4 mb-2">In this story</h3>
      <ol className="m-0 list-none p-0">
        {headings.map((h, i) => (
          <li key={h.id} className="py-1.5">
            <a href={`#${h.id}`} className="text-[13.5px] font-semibold leading-snug text-ink-dek no-underline hover:text-mint">
              <span className="mr-1.5 font-mono text-[11px] text-mint">{String(i + 1).padStart(2, '0')}</span>
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ImageLightbox({ src, onClose }) {
  if (!src || typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[13000] flex items-center justify-center bg-black/88 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image"
    >
      <button
        type="button"
        className="absolute right-4 top-4 border-0 bg-transparent text-2xl text-white"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="max-h-[90vh] max-w-[min(1100px,96vw)] object-contain" onClick={(e) => e.stopPropagation()} />
    </div>,
    document.body
  );
}

export function ReaderView({ post, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  const html = post?.content || `<p>${stripHtml(post?.excerpt || '')}</p>`;
  return createPortal(
    <div className="reader-view fixed inset-0 z-[12500] overflow-y-auto bg-bg text-ink">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-4 py-3">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-mint">Reader view</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="border border-line bg-transparent px-3 py-1.5 text-[12px] font-semibold text-ink hover:border-mint"
            onClick={() => window.print()}
          >
            Print
          </button>
          <button type="button" className="border-0 bg-transparent text-[13px] text-ink" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <article className="reader-article mx-auto max-w-[42rem] px-5 py-10">
        <p className="m-0 mb-2 font-mono text-[11px] uppercase tracking-wide text-mint">{post?.bucket}</p>
        <h1 className="mb-3 text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-tight text-ink">{post?.title}</h1>
        <p className="mb-8 text-[13px] text-ink-secondary">
          {post?.creatorName || post?.creator || ''}
          {post?.readMinutes ? ` · ${post.readMinutes} min read` : ''}
        </p>
        <div className="article-body article-body--magazine" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>,
    document.body
  );
}
