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
    <div className="admin-view-container-v2">
      <div className="section-header">
        <h2 className="section-title">Media Library</h2>
        <span className="title-count-v2">{mediaCount} Files</span>
      </div>

      <div className="admin-card-v2 upload-media-card">
        <h3 className="card-title-v2">Upload New Media</h3>
        <div className="upload-area-v2">
          <label className="upload-dropzone-v2">
            <div className="upload-icon-v2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className="upload-text-v2">Click or drag to upload image</span>
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
          <div className="upload-actions-v2">
            <button className="secondary-btn-v2" onClick={onRefresh}>Refresh Library</button>
            {hint && <p className="form-hint-v2">{hint}</p>}
          </div>
        </div>
      </div>

      <div className="admin-card-v2 library-card">
        <h3 className="card-title-v2">Recent Uploads</h3>
        {media.length ? (
          <div className="admin-media-grid-v2">
            {media.map((m) => (
              <div key={m.name} className="media-item-v2">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="media-thumb-v2"
                  title={m.name}
                >
                  <img src={m.url} alt={m.name} loading="lazy" />
                </a>
                <div className="media-info-v2">
                  <span className="media-name-v2" title={m.name}>{m.name}</span>
                  <span className="media-date-v2">{formatDateShort(m.modifiedAt || m.date)}</span>
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
