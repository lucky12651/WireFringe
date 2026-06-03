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
    <>
      <div className="admin-title-row">
        <h2>Posts</h2>
        <div className="accent-line"></div>
        <div className="admin-subtabs">
          <button
            className={`subtab-btn ${activeTab === 'published' ? 'active' : ''}`}
            onClick={() => setActiveTab('published')}
          >
            Published
            <span className="subtab-count">{postsCount}</span>
          </button>
          <button
            className={`subtab-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('queue');
              refreshQueue?.();
            }}
          >
            Queue (CSV)
            <span className="subtab-count">{queue?.length || 0}</span>
          </button>
        </div>
        
        {activeTab === 'queue' && selectedQueueLinks.size > 0 && (
          <div className="bulk-actions-bar">
            <span className="selection-count">{selectedQueueLinks.size} items selected</span>
            <div style={{ display: 'flex', gap: '8px' }}>
               <ActionButton 
                icon={CheckIcon} 
                size="sm" 
                onClick={handleBulkProcessClick}
                disabled={isProcessing}
              >
                Bulk Process
              </ActionButton>
              <ActionButton 
                icon={TrashIcon} 
                variant="danger" 
                size="sm" 
                onClick={handleBulkDeleteClick}
              >
                Bulk Delete
              </ActionButton>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'queue' && (
            <ActionButton 
              icon={RefreshIcon} 
              onClick={async () => {
                setSuccessMessage('Fetching latest RSS feeds...');
                const res = await onRefreshFeeds();
                if (res.success) {
                  setSuccessMessage('Successfully pulled latest news items.');
                }
              }}
              size="sm"
              title="Pull latest news from Google RSS feeds"
            >
              Rescrape Feeds
            </ActionButton>
          )}
          <ActionButton icon={PlusIcon} href="/admin/post" size="sm">
            New Post
          </ActionButton>
        </div>

      </div>


      <div className="side-card admin-posts-card" aria-label="All posts">

        <div className="admin-posts-scroll" ref={postsScrollRef}>
          {activeTab === 'published' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : posts.length ? (
                  posts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className={`status ${p.date ? 'published' : 'draft'}`}>
                          {p.date ? (
                            <span className="status-dot" title="Published"></span>
                          ) : (
                            'Draft'
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="title">{p.title}</TableCell>
                      <TableCell className="meta author">
                        {String(p.creator || '').trim() || 'Unknown'}
                      </TableCell>

                      <TableCell className="meta">{formatDateShort(p.date)}</TableCell>
                      <TableCell className="actions">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {!p.date && !isAuthor && (
                            <ActionButton
                              icon={CheckIcon}
                              onClick={() => onPublish(p.id)}
                              title="Publish this draft"
                            >
                              Publish
                            </ActionButton>
                          )}
                          <ActionButton
                            icon={EditIcon}
                            href={`/admin/post?id=${encodeURIComponent(p.id)}`}
                          >
                            Edit
                          </ActionButton>
                          <ActionButton
                            icon={TrashIcon}
                            onClick={() => handleDeleteClick(p)}
                            title="Delete this post"
                            variant="danger"
                          >
                            Delete
                          </ActionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState>No posts yet.</EmptyState>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={queue.length > 0 && selectedQueueLinks.size === queue.length}
                      onChange={toggleSelectAllQueue}
                    />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Source URL</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue?.length ? (
                  queue.map((item, idx) => (
                    <TableRow key={idx} className={selectedQueueLinks.has(item.link) ? 'row-selected' : ''}>
                      <TableCell>
                        <input 
                          type="checkbox" 
                          checked={selectedQueueLinks.has(item.link)}
                          onChange={() => toggleSelectQueueItem(item.link)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className={`status ${item.status === 'pending' ? 'draft' : 'failed'}`}>
                          {item.status === 'pending' ? 'Pending' : 'Failed'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="status draft" style={{ textTransform: 'capitalize' }}>
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell className="title">{item.title}</TableCell>
                      <TableCell className="meta">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--brand-primary)', textDecoration: 'underline', fontSize: '12px' }}
                        >
                          View Source
                        </a>
                      </TableCell>
                      <TableCell className="actions">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <ActionButton
                            icon={CheckIcon}
                            onClick={() => handleProcessQueueItem(item.link)}
                            disabled={isProcessing}
                            title="Process and publish now"
                          >
                            {isProcessing ? 'Processing...' : 'Process'}
                          </ActionButton>
                          <ActionButton
                            icon={TrashIcon}
                            onClick={() => setQueueItemToDelete(item)}
                            title="Remove from queue"
                            variant="danger"
                          >
                            Delete
                          </ActionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState>No pending items in queue.</EmptyState>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {activeTab === 'published' && totalPages > 1 && (
          <div className="admin-pagination">
            <div className="pagination-info">
              Page {page + 1} of {totalPages}
            </div>
            <div className="pagination-controls">
              <ActionButton
                icon={ChevronLeftIcon}
                onClick={() => onPageChange(page - 1)}
                disabled={!hasPrev}
              >
                Previous
              </ActionButton>
              <ActionButton
                icon={ChevronRightIcon}
                onClick={() => onPageChange(page + 1)}
                disabled={!hasNext}
              >
                Next
              </ActionButton>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        item={postToDelete || queueItemToDelete || (bulkQueueDelete ? { title: 'Selected Items' } : null)}
        title={postToDelete ? "Delete Post" : "Remove from Queue"}
        itemName={postToDelete?.title || queueItemToDelete?.title || (bulkQueueDelete ? `${selectedQueueLinks.size} selected items` : null)}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      {successMessage && (
        <SuccessToast
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </>
  );
}
