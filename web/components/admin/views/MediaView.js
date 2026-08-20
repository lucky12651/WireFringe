import React, { useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort, cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';
import { ScreenTitle, Notice } from '../wp/ScreenTitle';

export function MediaView({ media, mediaCount, onUpload, onRefresh }) {
  const [hint, setHint] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHint('Uploading...');
    const result = await onUpload(file);
    if (result.success) {
      setHint('Uploaded.');
    } else {
      setHint(result.error);
    }
    e.target.value = '';
  };

  return (
    <div className="wp-wrap">
      <ScreenTitle title="Media Library">
        <label className="page-title-action cursor-pointer">
          Add New
          <input type="file" hidden accept="image/*" onChange={handleFileChange} />
        </label>
      </ScreenTitle>
      {hint ? <Notice type={hint.includes('Uploaded') ? 'success' : 'info'}>{hint}</Notice> : null}
      <section className="postbox">
        <h2 className="hndle">Library</h2>
        <div className="inside">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className={cn(tw.adminSectionDesc, 'mb-0')}>{mediaCount} items</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button type="button" className={tw.secondaryBtn} onClick={onRefresh}>
              Refresh
            </button>
            {hint ? <p className={tw.formHint}>{hint}</p> : null}
          </div>
        </div>
        {media.length ? (
          <div className={cn(tw.mediaGrid, 'mt-4')}>
            {media.map((m) => (
              <figure key={m.name} className="overflow-hidden border border-line bg-bg-elevated">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-[3/2] bg-[var(--chip)] overflow-hidden"
                  title={m.name}
                >
                  <img src={m.url} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                </a>
                <figcaption className="flex flex-col gap-0.5 min-w-0 px-2 py-1.5">
                  <span className="text-xs text-ink truncate font-medium" title={m.name}>{m.name}</span>
                  <span className="text-[11px] text-ink-tertiary">{formatDateShort(m.modifiedAt || m.date)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState>No files in your library yet.</EmptyState>
        )}
        </div>
      </section>
    </div>
  );
}
