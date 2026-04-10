import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState, ActionButton } from '../../shared';
import { formatDateShort } from '../../../../lib/utils';
import { Icons } from '../../Layout/icons';

export default function LatestPosts({ latestPosts }) {
  const EditIcon = Icons.edit;

  return (
    <section className="side-card admin-mini-table" aria-label="Latest posts" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="side-header" style={{ padding: '20px 24px' }}>
        <h3>Latest Posts</h3>
        <span>{latestPosts.length}</span>
      </div>

      {latestPosts.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="actions-head"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestPosts.map((p) => (
              <TableRow key={p.id}>
                <TableCell style={{ fontWeight: '600' }}>{p.title}</TableCell>
                <TableCell>
                  <span className={`status ${p.date ? 'published' : 'draft'}`}>
                    {p.date ? 'Published' : 'Draft'}
                  </span>
                </TableCell>
                <TableCell className="meta">{formatDateShort(p.date)}</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <ActionButton
                    icon={EditIcon}
                    href={`/admin/post?id=${encodeURIComponent(p.id)}`}
                    style={{ width: 'fit-content', marginLeft: 'auto' }}
                  >
                    Edit
                  </ActionButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div style={{ padding: '24px' }}>
          <EmptyState>No posts yet.</EmptyState>
        </div>
      )}
    </section>
  );
}
