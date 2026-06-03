import React, { useEffect, useRef, useState } from 'react';
import { ActionButton } from '../shared/ActionButton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../shared/Table';
import { EmptyState } from '../shared/EmptyState';
import { DeleteConfirmModal, SuccessToast } from '../shared';
import Loader from '../../Loader/Loader';
import { formatDateShort } from '../../../lib/utils';
import { PlusIcon, EditIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, RefreshIcon } from '../Layout/icons';

export function PostsView({
  posts,
  postsCount,
  onPublish,
  onDelete, 
  onProcessQueue,
  onDeleteQueue,
  onBulkDeleteQueue,
  onBulkProcessQueue,
  onRefreshFeeds,
  me,
  page,
  onPageChange,
  limit,
  isLoading,
  queue,
  refreshQueue
}) {
  const postsScrollRef = useRef(null);
  const postsScrollHideTimerRef = useRef(null);
  const isAuthor = me?.role === 'author';

  const [activeTab, setActiveTab] = useState('published');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLinks, setProcessingLinks] = useState(new Set());
  const [selectedQueueLinks, setSelectedQueueLinks] = useState(new Set());

  // Delete confirmation state
  const [postToDelete, setPostToDelete] = useState(null);
  const [queueItemToDelete, setQueueItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success toast state
  const [successMessage, setSuccessMessage] = useState(null);

  const totalPages = Math.ceil(postsCount / limit);
  const hasNext = page < totalPages - 1;
  const hasPrev = page > 0;

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
  };

  const handleConfirmDelete = async () => {
    if (postToDelete) {
      const deletedTitle = postToDelete.title;
      setIsDeleting(true);
      try {
        await onDelete(postToDelete.id);
        setPostToDelete(null);
        setSuccessMessage(`"${deletedTitle}" has been deleted successfully.`);
      } finally {
        setIsDeleting(false);
      }
    } else if (queueItemToDelete) {
      const deletedTitle = queueItemToDelete.title;
      setIsDeleting(true);
      try {
        await onDeleteQueue(queueItemToDelete.link);
        setQueueItemToDelete(null);
        setSuccessMessage(`Queue item "${deletedTitle}" has been removed.`);
      } finally {
        setIsDeleting(false);
      }
    } else if (bulkQueueDelete) {
      setIsDeleting(true);
      try {
        await onBulkDeleteQueue(Array.from(selectedQueueLinks));
        setSelectedQueueLinks(new Set());
        setBulkQueueDelete(false);
        setSuccessMessage(`Selected queue items have been removed.`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCancelDelete = () => {
    setPostToDelete(null);
    setQueueItemToDelete(null);
    setBulkQueueDelete(false);
  };

  const [bulkQueueDelete, setBulkQueueDelete] = useState(false);

  const handleBulkDeleteClick = () => {
    if (selectedQueueLinks.size === 0) return;
    setBulkQueueDelete(true);
  };

  const handleBulkProcessClick = async () => {
    if (selectedQueueLinks.size === 0 || isProcessing) return;
    
    const linksToProcess = Array.from(selectedQueueLinks);
    
    // Set all selected as processing
    setProcessingLinks((prev) => {
      const next = new Set(prev);
      linksToProcess.forEach(l => next.add(l));
      return next;
    });

    try {
      setSuccessMessage(`AI is starting to bulk process ${linksToProcess.length} articles...`);
      const res = await onBulkProcessQueue(linksToProcess);
      if (res.success) {
        setSuccessMessage(`Bulk processing completed. Articles are being published.`);
        setSelectedQueueLinks(new Set());
      }
    } finally {
      setProcessingLinks((prev) => {
        const next = new Set(prev);
        linksToProcess.forEach(l => next.delete(l));
        return next;
      });
    }
  };

  const toggleSelectAllQueue = () => {
    if (selectedQueueLinks.size === queue.length) {
      setSelectedQueueLinks(new Set());
    } else {
      setSelectedQueueLinks(new Set(queue.map(item => item.link)));
    }
  };

  const toggleSelectQueueItem = (link) => {
    setSelectedQueueLinks((prev) => {
      const next = new Set(prev);
      if (next.has(link)) {
        next.delete(link);
      } else {
        next.add(link);
      }
      return next;
    });
  };

  const handleProcessQueueItem = async (link) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await onProcessQueue(link);
      if (res.success) {
        setSuccessMessage('Article processed and published successfully.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-hide scrollbar for posts list
  useEffect(() => {
    const el = postsScrollRef.current;
    if (!el) return;

    const showTemporarily = () => {
      el.classList.add('show-scrollbar');
      if (postsScrollHideTimerRef.current) {
        window.clearTimeout(postsScrollHideTimerRef.current);
      }
      postsScrollHideTimerRef.current = window.setTimeout(() => {
        el.classList.remove('show-scrollbar');
      }, 800);
    };

    el.addEventListener('scroll', showTemporarily, { passive: true });
    return () => {
      el.removeEventListener('scroll', showTemporarily);
      el.classList.remove('show-scrollbar');
      if (postsScrollHideTimerRef.current) {
        window.clearTimeout(postsScrollHideTimerRef.current);
      }
    };
  }, [posts.length]);

  return (
    <div className="admin-view-container-v2">
      <div className="section-header">
        <div className="title-group-v2">
          <h2 className="section-title">Articles</h2>
          <div className="v2-tabs">
            <button
              className={`v2-tab-btn ${activeTab === 'published' ? 'active' : ''}`}
              onClick={() => setActiveTab('published')}
            >
              Published <span className="tab-count-v2">{postsCount}</span>
            </button>
            <button
              className={`v2-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('queue')}
            >
              Queue <span className="tab-count-v2">{queue.length}</span>
            </button>
          </div>
        </div>
        <div className="header-actions-v2">
          {activeTab === 'queue' && (
            <button className="secondary-btn-v2" onClick={onRefreshFeeds}>
              <RefreshIcon size={16} /> Refresh Feeds
            </button>
          )}
          <a href="/admin/post" className="primary-btn-v2">
            <PlusIcon /> New Article
          </a>
        </div>
      </div>

      <div className="admin-card-v2 posts-card-v2">
        {activeTab === 'published' ? (
          <>
            <div className="v2-table-wrapper">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="post-cell-v2">
                          <div className="post-thumb-mini">
                            <img src={p.ogImg || '/placeholder-post.jpg'} alt="" />
                          </div>
                          <div className="post-title-info">
                            <span className="post-title-v2">{p.title}</span>
                            <span className="post-author-v2">By {p.creatorName || 'Admin'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="count-badge-v2">{p.bucket}</span>
                      </td>
                      <td>
                        <span className="date-v2">{formatDateShort(p.date)}</span>
                      </td>
                      <td className="text-right">
                        <div className="action-group-v2">
                          <a href={`/admin/post?id=${encodeURIComponent(p.id)}`} className="edit-btn-v2" title="Edit">
                            <EditIcon size={16} />
                          </a>
                          <button className="delete-btn-v2" onClick={() => handleDeleteClick(p)} title="Delete">
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="v2-pagination">
                <button className="page-btn-v2" disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
                  <ChevronLeftIcon /> Prev
                </button>
                <span className="page-info-v2">Page {page + 1} of {totalPages}</span>
                <button className="page-btn-v2" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
                  Next <ChevronRightIcon />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="v2-table-wrapper">
            <table className="v2-table">
              <thead>
                <tr>
                  <th>Queue Item</th>
                  <th>Source</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.link}>
                    <td>
                      <div className="queue-title-v2">{q.title}</div>
                    </td>
                    <td>
                      <span className="source-badge-v2">{q.category}</span>
                    </td>
                    <td className="text-right">
                      <div className="action-group-v2">
                        <button className="approve-btn-v2" onClick={() => onProcessQueue(q.link)} title="Process">
                          <CheckIcon size={16} />
                        </button>
                        <button className="delete-btn-v2" onClick={() => { setQueueItemToDelete(q); }} title="Remove">
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!postToDelete || !!queueItemToDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to remove "${postToDelete?.title || queueItemToDelete?.title}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      {successMessage && (
        <SuccessToast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}
