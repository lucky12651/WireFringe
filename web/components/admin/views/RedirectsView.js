import { useEffect, useState } from 'react';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';

export function RedirectsView() {
  const [rows, setRows] = useState([]);
  const [fromPath, setFromPath] = useState('');
  const [toPath, setToPath] = useState('');

  const refresh = () => newsroomApi.redirects().then(setRows).catch(() => setRows([]));
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className={tw.adminView}>
      <section className={tw.adminSection}>
        <h3 className={tw.adminSectionTitle}>Redirects</h3>
        <p className={tw.adminSectionDesc}>Old URL → new URL. Title changes also create these automatically.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end max-w-[800px] mb-5">
          <input className={tw.formInput} placeholder="/post/old-slug" value={fromPath} onChange={(e) => setFromPath(e.target.value)} />
          <input className={tw.formInput} placeholder="/post/new-slug" value={toPath} onChange={(e) => setToPath(e.target.value)} />
          <button
            type="button"
            className={tw.primaryBtn}
            onClick={async () => {
              await newsroomApi.addRedirect(fromPath, toPath);
              setFromPath('');
              setToPath('');
              refresh();
            }}
          >
            Add
          </button>
        </div>
        <ul>
          {rows.map((r) => (
            <li key={r.id} className="py-2 border-b border-line flex justify-between">
              <span>
                {r.fromPath} → {r.toPath}
              </span>
              <button type="button" className={tw.secondaryBtn} onClick={() => newsroomApi.deleteRedirect(r.id).then(refresh)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
