import { useEffect, useState } from 'react';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';
import { ScreenTitle } from '../wp/ScreenTitle';

export function RedirectsView() {
  const [rows, setRows] = useState([]);
  const [fromPath, setFromPath] = useState('');
  const [toPath, setToPath] = useState('');

  const refresh = () => newsroomApi.redirects().then(setRows).catch(() => setRows([]));
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="wp-wrap">
      <ScreenTitle title="Redirects" />
      <section className="postbox">
        <h2 className="hndle">Add redirect</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row"><label htmlFor="redir-from">From</label></th>
                <td>
                  <input id="redir-from" className={tw.formInput + ' max-w-md'} placeholder="/post/old-slug" value={fromPath} onChange={(e) => setFromPath(e.target.value)} />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="redir-to">To</label></th>
                <td>
                  <input id="redir-to" className={tw.formInput + ' max-w-md'} placeholder="/post/new-slug" value={toPath} onChange={(e) => setToPath(e.target.value)} />
                </td>
              </tr>
            </tbody>
          </table>
          <p className="submit">
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
              Add redirect
            </button>
          </p>
        </div>
      </section>
      <section className="postbox">
        <h2 className="hndle">Redirects</h2>
        <div className="inside">
          <table className="wp-table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.fromPath}</td>
                  <td>{r.toPath}</td>
                  <td>
                    <button type="button" className="border-0 bg-transparent p-0 text-[var(--danger)]" onClick={() => newsroomApi.deleteRedirect(r.id).then(refresh)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
