import React, { useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort } from '../../../lib/utils';
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
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="m-0 text-xl font-extrabold text-white tracking-tight">Media Library</h2>
        <span className={tw.titleCount}>{mediaCount} Files</span>
      </div>

      <div className={tw.card}>
        <h3 className={tw.cardTitle}>Upload New Media</h3>
        <div className={tw.uploadArea}>
          <label className="flex flex-col items-center cursor-pointer">
            <div className={tw.uploadIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className={tw.uploadText}>Click or drag to upload image</span>
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <button className={tw.secondaryBtn} onClick={onRefresh}>Refresh Library</button>
            {hint && <p className={tw.formHint}>{hint}</p>}
          </div>
        </div>
      </div>

      <div className={tw.card}>
        <h3 className={tw.cardTitle}>Recent Uploads</h3>
        {media.length ? (
          <div className={tw.mediaGrid}>
            {media.map((m) => (
              <div key={m.name} className="rounded-md border border-line bg-[#0a0a0a] overflow-hidden">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-video bg-[#111] overflow-hidden"
                  title={m.name}
                >
                  <img src={m.url} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                </a>
                <div className="p-2.5 flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs text-white truncate font-medium" title={m.name}>{m.name}</span>
                  <span className="text-[11px] text-[#666] font-mono">{formatDateShort(m.modifiedAt || m.date)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No files in your library yet.</EmptyState>
        )}
      </div>
    </div>
  );
}
