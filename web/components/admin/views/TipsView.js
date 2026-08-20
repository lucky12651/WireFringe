import { useEffect, useState } from 'react';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';
import { formatDateShort, cn } from '../../../lib/utils';
import { TrashIcon } from '../Layout/icons';
import { EmptyState } from '../shared/EmptyState';
import { ScreenTitle } from '../wp/ScreenTitle';

export function TipsView() {
  const [tips, setTips] = useState([]);

  const refresh = () => newsroomApi.tips().then(setTips).catch(() => setTips([]));
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="wp-wrap">
      <ScreenTitle title="Tips" />
      <section className="postbox">
        <h2 className="hndle">Confidential tips</h2>
        <div className="inside">
        <p className={tw.adminSectionDesc}>Submitted from the Tip Us page. Treat as confidential.</p>
        <div className={tw.tableWrap}>
          <table className={tw.table}>
            <thead>
              <tr>
                <th className={tw.th}>Contact</th>
                <th className={tw.th}>Tip</th>
                <th className={cn(tw.th, tw.textRight)}> </th>
              </tr>
            </thead>
            <tbody>
              {tips.length ? (
                tips.map((t) => (
                  <tr key={t.id} className={t.isRead ? '' : 'bg-mint/5'}>
                    <td className={tw.td}>
                      <div>{t.contact || 'Anonymous'}</div>
                      <div className="text-xs text-ink-tertiary">{formatDateShort(t.createdAt)}</div>
                    </td>
                    <td className={tw.td}>
                      <p className="m-0 whitespace-pre-wrap text-sm">{t.message}</p>
                    </td>
                    <td className={cn(tw.td, tw.textRight)}>
                      <button className={tw.secondaryBtn} onClick={() => newsroomApi.markTipRead(t.id).then(refresh)}>
                        Read
                      </button>
                      <button className={tw.iconBtnDanger} onClick={() => newsroomApi.deleteTip(t.id).then(refresh)}>
                        <TrashIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className={tw.td}>
                    <EmptyState>No tips yet.</EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </section>
    </div>
  );
}
