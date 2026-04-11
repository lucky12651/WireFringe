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
import { PlusIcon, EditIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon } from '../Layout/icons';

export function PostsView({ posts, postsCount, onPublish, onDelete, me, page, onPageChange, limit, isLoading }) {
  const postsScrollRef = useRef(null);
  const postsScrollHideTimerRef = useRef(null);
  const isAuthor = me?.role === 'author';
  
  // Delete confirmation state
  const [postToDelete, setPostToDelete] = useState(null);
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
    if (!postToDelete) return;
    const deletedTitle = postToDelete.title;
    setIsDeleting(true);
    try {
      await onDelete(postToDelete.id);
      setPostToDelete(null);
      setSuccessMessage(`"${deletedTitle}" has been deleted successfully.`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCancelDelete = () => {
    setPostToDelete(null);
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
        <span className="admin-title-count">{postsCount}</span>
      
      </div>
      

      <div className="side-card admin-posts-card" aria-label="All posts">
        
        <div className="admin-posts-scroll" ref={postsScrollRef}>
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
        </div>

        {totalPages > 1 && (
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
        item={postToDelete}
        title="Delete Post"
        itemName={postToDelete?.title}
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
