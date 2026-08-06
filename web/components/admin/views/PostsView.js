import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EmptyState } from '../shared/EmptyState';
import { DeleteConfirmModal, SuccessToast } from '../shared';
import { formatDateShort, postUrl, cn } from '../../../lib/utils';
import { PlusIcon, EditIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, RefreshIcon } from '../Layout/icons';
import { tw } from '../../../lib/tw';

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
    <div className={tw.adminView}>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <div className={tw.titleGroup}>
          <h2 className="m-0 text-xl font-extrabold text-white tracking-tight">Articles</h2>
          <div className={tw.tabs}>
            <button
              className={cn(tw.tab, activeTab === 'published' && tw.tabActive)}
              onClick={() => setActiveTab('published')}
            >
              Published <span className="ml-1 opacity-80">{postsCount}</span>
            </button>
            <button
              className={cn(tw.tab, activeTab === 'queue' && tw.tabActive)}
              onClick={() => setActiveTab('queue')}
            >
              Queue <span className="ml-1 opacity-80">{queue.length}</span>
            </button>
          </div>
        </div>
        <div className={tw.headerActions}>
          {activeTab === 'queue' && (
            <button className={tw.secondaryBtn} onClick={onRefreshFeeds}>
              <RefreshIcon size={16} /> Refresh Feeds
            </button>
          )}
          <a href="/admin/post" className={tw.primaryBtn}>
            <PlusIcon /> New Article
          </a>
        </div>
      </div>

      <div className={tw.card}>
        {activeTab === 'published' ? (
          <>
            <div className={tw.tableWrap}>
              <table className={tw.table}>
                <thead>
                  <tr>
                    <th className={tw.th}>Article</th>
                    <th className={tw.th}>Category</th>
                    <th className={tw.th}>Date</th>
                    <th className={cn(tw.th, tw.textRight)}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id}>
                      <td className={tw.td}>
                        <div className={tw.postCell}>
                          <div className={tw.postThumb}>
                            <img src={p.ogImg || '/placeholder-post.jpg'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <Link href={postUrl(p)} className="no-underline text-white hover:text-mint">
                              <span className="font-semibold text-sm block truncate">{p.title}</span>
                            </Link>
                            <span className="text-xs text-[#888]">By {p.creatorName || 'Admin'}</span>
                          </div>
                        </div>
                      </td>
                      <td className={tw.td}>
                        <span className="font-mono text-xs text-mint">{p.bucket}</span>
                      </td>
                      <td className={tw.td}>
                        <span className="text-[#e0e0e0]">{formatDateShort(p.date)}</span>
                      </td>
                      <td className={cn(tw.td, tw.textRight)}>
                        <div className={tw.actionGroup}>
                          <a href={`/admin/post?id=${encodeURIComponent(p.id)}`} className={tw.iconBtn} title="Edit">
                            <EditIcon size={16} />
                          </a>
                          <button className={tw.iconBtnDanger} onClick={() => handleDeleteClick(p)} title="Delete">
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
              <div className={tw.pagination}>
                <button className={tw.pageBtn} disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
                  <ChevronLeftIcon /> Prev
                </button>
                <span className={tw.pageInfo}>Page {page + 1} of {totalPages}</span>
                <button className={tw.pageBtn} disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
                  Next <ChevronRightIcon />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={tw.tableWrap}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={queue.length > 0 && selectedQueueLinks.size === queue.length}
                  onChange={toggleSelectAllQueue}
                  id="select-all-queue"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
              {selectedQueueLinks.size > 0 && (
                <div className="m-0 py-2 px-4 rounded-xl flex items-center gap-3 bg-bg-elevated border border-line">
                  <span>{selectedQueueLinks.size} selected</span>
                  <div className="flex gap-2">
                    <button
                      className={tw.iconBtnApprove}
                      onClick={handleBulkProcessClick}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Process'}
                    </button>
                    <button className={tw.iconBtnDanger} onClick={handleBulkDeleteClick}>
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {queue.map((q) => (
                <div
                  key={q.link}
                  className={cn(
                    'rounded-lg border border-line bg-[#101010] p-3 cursor-pointer transition-colors hover:border-mint/30',
                    selectedQueueLinks.has(q.link) && 'border-mint/50 bg-mint/[0.04]'
                  )}
                  onClick={() => toggleSelectQueueItem(q.link)}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedQueueLinks.has(q.link)}
                        onChange={() => toggleSelectQueueItem(q.link)}
                      />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-mint bg-mint/10 px-2 py-0.5 rounded">
                      {q.category}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm font-semibold text-white line-clamp-2" title={q.title}>{q.title}</div>
                  </div>

                  <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={tw.iconBtnApprove}
                      onClick={() => handleProcessQueueItem(q.link)}
                      title="Process"
                      disabled={isProcessing || processingLinks.has(q.link)}
                    >
                      {processingLinks.has(q.link) ? <RefreshIcon size={16} className={tw.spin} /> : <CheckIcon size={16} />}
                    </button>
                    <button className={tw.iconBtnDanger} onClick={() => { setQueueItemToDelete(q); }} title="Remove">
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {queue.length === 0 && (
              <EmptyState>No items in the news queue.</EmptyState>
            )}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!postToDelete || !!queueItemToDelete || bulkQueueDelete}
        title="Confirm Deletion"
        message={
          bulkQueueDelete
            ? `Are you sure you want to remove ${selectedQueueLinks.size} selected items from the queue?`
            : `Are you sure you want to remove "${postToDelete?.title || queueItemToDelete?.title}"?`
        }
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
