import React, { useState } from 'react';
import { ActionButton } from '../shared/ActionButton';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort } from '../../../lib/utils';

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
    <>
      <div className="admin-title-row">
        <h2>Media</h2>
        <div className="accent-line"></div>
      </div>

      <section className="side-card">
        <div className="side-header">
          <h3>Upload Image</h3>
          <span>{mediaCount} files</span>
        </div>

        <div className="row">
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          <ActionButton onClick={onRefresh}>Refresh</ActionButton>
          <div className="hint">{hint}</div>
        </div>
      </section>

      <section className="side-card">
        <div className="side-header">
          <h3>Library</h3>
          <span>latest first</span>
        </div>

        {media.length ? (
          <div className="admin-media-grid">
            {media.map((m) => (
              <a
                key={m.name}
                className="admin-media-item"
                href={m.url}
                target="_blank"
                rel="noreferrer"
                title={m.name}
              >
                <div className="admin-media-thumb">
                  <img src={m.url} alt={m.name} loading="lazy" />
                </div>
                <div className="admin-media-meta">
                  <div className="name">{m.name}</div>
                  <div className="meta">{formatDateShort(m.modifiedAt)}</div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState>No uploads yet.</EmptyState>
        )}
      </section>
    </>
  );
}
