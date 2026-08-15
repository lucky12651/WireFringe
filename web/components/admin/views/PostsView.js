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
  refreshQueue,
  access,
  source = 'editorial',
  onSourceChange,
  filters = { q: '', status: '', dateFrom: '', dateTo: '' },
  onFiltersChange,
}) {
  const postsScrollRef = useRef(null);
  const postsScrollHideTimerRef = useRef(null);
  const isAuthor = Boolean(access?.isAuthor ?? me?.role === 'author');
  const canProcessQueue = Boolean(access?.canProcessQueue && !isAuthor);
  const canDeletePublished = Boolean(access?.canDeleteAnyPost);

  const [activeTab, setActiveTab] = useState('published');

  useEffect(() => {
    if (!canProcessQueue && activeTab === 'queue') setActiveTab('published');
    if (isAuthor && activeTab === 'bot') setActiveTab('published');
  }, [canProcessQueue, isAuthor, activeTab]);

  useEffect(() => {
    if (activeTab === 'bot' && source !== 'bot') onSourceChange?.('bot');
    if ((activeTab === 'published' || activeTab === 'draft') && source !== 'editorial') {
      onSourceChange?.('editorial');
    }
  }, [activeTab, source, onSourceChange]);

  const goTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'published') {
      onSourceChange?.('editorial');
      if (filters.status === 'draft') onFiltersChange?.({ status: '' });
    } else if (tab === 'draft') {
      onSourceChange?.('editorial');
      onFiltersChange?.({ status: 'draft' });
    } else if (tab === 'bot') {
      onSourceChange?.('bot');
    }
  };
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
      <section className={tw.adminSection}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className={tw.tabs}>
            <button
              className={cn(tw.tab, activeTab === 'published' && tw.tabActive)}
              onClick={() => goTab('published')}
            >
              All staff post <span className="ml-1 opacity-80">{activeTab === 'published' ? postsCount : ''}</span>
            </button>
            <button
              className={cn(tw.tab, activeTab === 'draft' && tw.tabActive)}
              onClick={() => goTab('draft')}
            >
              Draft <span className="ml-1 opacity-80">{activeTab === 'draft' ? postsCount : ''}</span>
            </button>
            {!isAuthor ? (
            <button
              className={cn(tw.tab, activeTab === 'bot' && tw.tabActive)}
              onClick={() => goTab('bot')}
            >
              Bot posts <span className="ml-1 opacity-80">{source === 'bot' ? postsCount : ''}</span>
            </button>
            ) : null}
            {canProcessQueue ? (
            <button
              className={cn(tw.tab, activeTab === 'queue' && tw.tabActive)}
              onClick={() => goTab('queue')}
            >
              Queue <span className="ml-1 opacity-80">{queue.length}</span>
            </button>
            ) : null}
          </div>
          <div className={tw.headerActions}>
            {activeTab === 'queue' && (
              <button className={tw.secondaryBtn} onClick={onRefreshFeeds}>
                <RefreshIcon size={16} /> Refresh feeds
              </button>
            )}
            <a href="/admin/post" className={tw.primaryBtn}>
              <PlusIcon /> New article
            </a>
          </div>
        </div>
      </section>

      <section className={tw.adminSection}>
        {activeTab === 'published' || activeTab === 'draft' || activeTab === 'bot' ? (
          <>
            {activeTab === 'published' ? (
              <div className="flex flex-wrap items-end gap-2.5 mb-4">
                <div className="flex-1 min-w-[180px]">
                  <label className={tw.formLabel} htmlFor="staff-post-search">Search</label>
                  <input
                    id="staff-post-search"
                    className={tw.formInput}
                    type="search"
                    value={filters.q || ''}
                    placeholder="Title or excerpt"
                    onChange={(e) => onFiltersChange?.({ q: e.target.value })}
                  />
                </div>
                <div className="w-[160px]">
                  <label className={tw.formLabel} htmlFor="staff-post-status">Status</label>
                  <select
                    id="staff-post-status"
                    className={tw.formSelect}
                    value={filters.status || ''}
                    onChange={(e) => onFiltersChange?.({ status: e.target.value })}
                  >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div className="w-[150px]">
                  <label className={tw.formLabel} htmlFor="staff-post-from">From</label>
                  <input
                    id="staff-post-from"
                    className={tw.formInput}
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => onFiltersChange?.({ dateFrom: e.target.value })}
                  />
                </div>
                <div className="w-[150px]">
                  <label className={tw.formLabel} htmlFor="staff-post-to">To</label>
                  <input
                    id="staff-post-to"
                    className={tw.formInput}
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => onFiltersChange?.({ dateTo: e.target.value })}
                  />
                </div>
              </div>
            ) : null}
            <div className={tw.tableWrap}>
              <table className={tw.table}>
                <thead>
                  <tr>
                    <th className={tw.th}>Article</th>
                    <th className={tw.th}>Category</th>
                    <th className={tw.th}>Status</th>
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
                            <Link href={postUrl(p)} className="no-underline text-ink hover:text-mint">
                              <span className="font-semibold text-sm block truncate">{p.title}</span>
                            </Link>
                            <span className="text-xs text-ink-tertiary">By {p.creatorName || 'Admin'}</span>
                          </div>
                        </div>
                      </td>
                      <td className={tw.td}>
                        <span className="font-mono text-xs text-ink-secondary">{p.bucket}</span>
                      </td>
                      <td className={tw.td}>
                        <span className={tw.statusBadge}>
                          {p.status || (p.date ? 'published' : 'draft')}
                        </span>
                      </td>
                      <td className={tw.td}>
                        <span className="text-ink-secondary">{formatDateShort(p.date)}</span>
                      </td>
                      <td className={cn(tw.td, tw.textRight)}>
                        <div className={tw.actionGroup}>
                          <a href={`/admin/post?id=${encodeURIComponent(p.id)}`} className={tw.iconBtn} title="Edit">
                            <EditIcon size={16} />
                          </a>
                          {canDeletePublished || (p.status || (p.date ? 'published' : 'draft')) !== 'published' ? (
                          <button className={tw.iconBtnDanger} onClick={() => handleDeleteClick(p)} title="Delete">
                            <TrashIcon size={16} />
                          </button>
                          ) : null}
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
            <div className="mb-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-ink-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={queue.length > 0 && selectedQueueLinks.size === queue.length}
                  onChange={toggleSelectAllQueue}
                  id="select-all-queue"
                />
                Select all
              </label>
              {selectedQueueLinks.size > 0 && (
                <div className="flex items-center gap-3 text-[13px] text-ink-secondary">
                  <span>{selectedQueueLinks.size} selected</span>
                  <button
                    className={tw.secondaryBtn}
                    onClick={handleBulkProcessClick}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing…' : 'Process'}
                  </button>
                  <button className={tw.iconBtnDanger} onClick={handleBulkDeleteClick}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            {queue.length === 0 ? (
              <EmptyState>No items in the news queue.</EmptyState>
            ) : (
              <table className={tw.table}>
                <thead>
                  <tr>
                    <th className={tw.th}></th>
                    <th className={tw.th}>Title</th>
                    <th className={tw.th}>Category</th>
                    <th className={cn(tw.th, tw.textRight)}> </th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((q) => (
                    <tr key={q.link}>
                      <td className={tw.td}>
                        <input
                          type="checkbox"
                          checked={selectedQueueLinks.has(q.link)}
                          onChange={() => toggleSelectQueueItem(q.link)}
                        />
                      </td>
                      <td className={tw.td}>
                        <span className="font-semibold text-ink line-clamp-2">{q.title}</span>
                      </td>
                      <td className={tw.td}>
                        <span className="font-mono text-xs text-ink-tertiary uppercase">{q.category}</span>
                      </td>
                      <td className={cn(tw.td, tw.textRight)}>
                        <div className={tw.actionGroup}>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

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
