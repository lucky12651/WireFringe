import React, { useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort, cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

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
    <div className={tw.adminView}>
      <section className={tw.adminSection}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className={tw.adminSectionTitle}>Library</h3>
            <p className={cn(tw.adminSectionDesc, 'mb-0')}>{mediaCount} files</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <label className={cn(tw.primaryBtn, 'cursor-pointer')}>
              Upload image
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </label>
            <button type="button" className={tw.secondaryBtn} onClick={onRefresh}>
              Refresh
            </button>
            {hint ? <p className={tw.formHint}>{hint}</p> : null}
          </div>
        </div>
      </section>

      <section className={tw.adminSection}>
        {media.length ? (
          <div className={tw.mediaGrid}>
            {media.map((m) => (
              <div key={m.name} className="overflow-hidden">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-video bg-bg-hover overflow-hidden border border-line"
                  title={m.name}
                >
                  <img src={m.url} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                </a>
                <div className="pt-2 flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs text-ink truncate font-medium" title={m.name}>{m.name}</span>
                  <span className="text-[11px] text-ink-tertiary font-mono">{formatDateShort(m.modifiedAt || m.date)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No files in your library yet.</EmptyState>
        )}
      </section>
    </div>
  );
}
