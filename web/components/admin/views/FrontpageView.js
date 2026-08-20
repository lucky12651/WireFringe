import { useEffect, useState } from 'react';
import { newsroomApi, api } from '../../../lib/api';
import { tw } from '../../../lib/tw';
import { ScreenTitle, Notice } from '../wp/ScreenTitle';
import { cn } from '../../../lib/utils';

export function FrontpageView() {
  const [posts, setPosts] = useState([]);
  const [heroIds, setHeroIds] = useState([]);
  const [topIds, setTopIds] = useState([]);
  const [breakingId, setBreakingId] = useState('');
  const [hint, setHint] = useState('');

  useEffect(() => {
    Promise.all([api('/api/admin/posts?offset=0&limit=100'), newsroomApi.frontpage()]).then(([list, front]) => {
      const rows = Array.isArray(list) ? list : list?.posts || [];
      setPosts(rows);
      setHeroIds(front.heroIds || []);
      setTopIds(front.topIds || []);
      setBreakingId(front.breakingId || '');
    });
  }, []);

  const toggle = (list, setList, id) => {
    setList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="wp-wrap">
      <ScreenTitle title="Front page" />
      {hint ? <Notice type="success">{hint}</Notice> : null}
      <section className="postbox">
        <h2 className="hndle">Homepage layout</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row"><label htmlFor="fp-breaking">Breaking story</label></th>
                <td>
                  <select id="fp-breaking" className={cn(tw.formSelect, 'max-w-md')} value={breakingId} onChange={(e) => setBreakingId(e.target.value)}>
                    <option value="">None</option>
                    {posts.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <span className="description">If empty, the homepage uses the newest published stories.</span>
                </td>
              </tr>
            </tbody>
          </table>
          <table className="wp-table">
            <thead>
              <tr>
                <th>Story</th>
                <th>Hero</th>
                <th>Top</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 40).map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>
                    <input type="checkbox" checked={heroIds.includes(p.id)} onChange={() => toggle(heroIds, setHeroIds, p.id)} aria-label="Hero" />
                  </td>
                  <td>
                    <input type="checkbox" checked={topIds.includes(p.id)} onChange={() => toggle(topIds, setTopIds, p.id)} aria-label="Top" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="submit">
            <button
              type="button"
              className={tw.primaryBtn}
              onClick={async () => {
                await newsroomApi.saveFrontpage({ heroIds, topIds, breakingId: breakingId || null });
                setHint('Front page saved.');
              }}
            >
              Save Changes
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
