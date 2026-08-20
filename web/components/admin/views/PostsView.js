import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EmptyState } from '../shared/EmptyState';
import { DeleteConfirmModal, SuccessToast } from '../shared';
import { formatDateShort, postUrl, cn } from '../../../lib/utils';
import { PlusIcon, EditIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, RefreshIcon } from '../Layout/icons';
import { tw } from '../../../lib/tw';
import { ScreenTitle, Notice } from '../wp/ScreenTitle';

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

  const botOn = source === 'bot';

  useEffect(() => {
    if (!canProcessQueue && activeTab === 'queue') setActiveTab('published');
  }, [canProcessQueue, activeTab]);

  const goTab = (tab) => {
    setActiveTab(tab);
  };

  const setBotPosts = (on) => {
    onSourceChange?.(on ? 'bot' : 'editorial');
    if (activeTab === 'queue') setActiveTab('published');
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
  const [deleteError, setDeleteError] = useState('');

  const totalPages = Math.ceil(postsCount / limit);
  const hasNext = page < totalPages - 1;
  const hasPrev = page > 0;

  const handleDeleteClick = (post) => {
    setDeleteError('');
    setPostToDelete(post);
  };

  const handleConfirmDelete = async () => {
    if (postToDelete) {
      const deletedTitle = postToDelete.title;
      setIsDeleting(true);
      try {
        const result = await onDelete(postToDelete.id);
        if (result?.success === false) {
          setDeleteError(result.error || 'Failed to delete post.');
          return;
        }
        setDeleteError('');
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
    setDeleteError('');
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
    <div className="wp-wrap">
      <ScreenTitle title="Posts" actionHref="/admin/post" actionLabel="Add New" />
      {successMessage ? <Notice type="success">{successMessage}</Notice> : null}
      <section className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className={tw.tabs}>
          {[
            { id: 'published', label: botOn ? 'Bot posts' : 'All', count: postsCount },
            canProcessQueue ? { id: 'queue', label: 'Queue', count: queue.length } : null,
          ]
            .filter(Boolean)
            .map((tab, i) => (
              <span key={tab.id} className="flex items-center gap-3">
                {i > 0 ? <span className="text-line-strong">|</span> : null}
                <button
                  type="button"
                  className={cn(tw.tab, activeTab === tab.id && tw.tabActive)}
                  onClick={() => goTab(tab.id)}
                >
                  {tab.label}
                  <span className="ml-1 text-ink-secondary">({tab.count})</span>
                </button>
              </span>
            ))}
        </div>
        <div className={tw.headerActions}>
          {activeTab === 'queue' && (
            <button className={tw.secondaryBtn} onClick={onRefreshFeeds}>
              <RefreshIcon size={16} /> Refresh feeds
            </button>
          )}
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">{activeTab === 'queue' ? 'Queue' : botOn ? 'Bot posts' : 'All Posts'}</h2>
        <div className="inside">
        {activeTab === 'published' ? (
          <>
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
                {!isAuthor ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={botOn}
                    aria-label="Show bot posts"
                    onClick={() => setBotPosts(!botOn)}
                    className="h-8 px-2.5 mb-0 flex items-center gap-2 border border-line rounded-sm bg-bg-elevated text-ink cursor-pointer select-none"
                  >
                    <span
                      className={cn(
                        'relative shrink-0 w-[42px] h-6 rounded-full border transition-colors',
                        botOn ? 'bg-mint/15 border-mint' : 'bg-bg-hover border-line'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-all duration-200',
                          botOn ? 'translate-x-[18px] bg-mint' : 'bg-[#888]'
                        )}
                      />
                    </span>
                    <span className="text-[13px] font-semibold whitespace-nowrap">
                      Bot posts
                    </span>
                  </button>
                ) : null}
              </div>
            <div className={tw.tableWrap}>
              <table className="wp-table">
                <thead>
                  <tr>
                    <th className="w-[42%]">Title</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Author</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-ink-secondary">
                        Loading posts…
                      </td>
                    </tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-ink-secondary">
                        No posts found.
                      </td>
                    </tr>
                  ) : (
                    posts.map((p) => {
                      const st = p.status || (p.date ? 'published' : 'draft');
                      const canTrash = canDeletePublished || st !== 'published';
                      return (
                        <tr key={p.id}>
                          <td>
                            <a
                              href={`/admin/post?id=${encodeURIComponent(p.id)}`}
                              className="row-title"
                            >
                              {p.title || '(no title)'}
                            </a>
                            <div className="row-actions">
                              <a
                                href={`/admin/post?id=${encodeURIComponent(p.id)}`}
                                className="text-mint no-underline"
                              >
                                Edit
                              </a>
                              {' | '}
                              <Link href={postUrl(p)} className="text-mint no-underline">
                                {st === 'published' ? 'View' : 'Preview'}
                              </Link>
                              {canTrash ? (
                                <>
                                  {' | '}
                                  <button
                                    type="button"
                                    className="border-0 bg-transparent p-0 text-[var(--danger)]"
                                    onClick={() => handleDeleteClick(p)}
                                  >
                                    Trash
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <span className={cn('status-pill', st)}>
                              <i />
                              {st}
                            </span>
                          </td>
                          <td className="text-ink-secondary">{p.bucket || '—'}</td>
                          <td className="text-ink-secondary">{p.creatorName || 'Admin'}</td>
                          <td className="whitespace-nowrap text-ink-secondary">
                            {st === 'published'
                              ? `Published ${formatDateShort(p.date) || '—'}`
                              : `Last modified ${formatDateShort(p.date) || '—'}`}
                          </td>
                        </tr>
                      );
                    })
                  )}
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
        </div>
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
        error={deleteError}
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
