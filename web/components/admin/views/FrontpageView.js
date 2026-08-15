import { useEffect, useState } from 'react';
import { newsroomApi, api } from '../../../lib/api';
import { tw } from '../../../lib/tw';
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
    <div className={tw.adminView}>
      <section className={tw.adminSection}>
        <h3 className={tw.adminSectionTitle}>Front page</h3>
        <p className={tw.adminSectionDesc}>
          Pick hero stories and a breaking item. If you leave this empty, the homepage uses the newest published stories.
        </p>
        <div className={tw.formGroup}>
          <label className={tw.formLabel}>Breaking story</label>
          <select className={tw.formSelect} value={breakingId} onChange={(e) => setBreakingId(e.target.value)}>
            <option value="">None</option>
            {posts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          {posts.slice(0, 40).map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-line">
              <span className="flex-1 text-sm text-ink">{p.title}</span>
              <label className="text-xs">
                <input
                  type="checkbox"
                  checked={heroIds.includes(p.id)}
                  onChange={() => toggle(heroIds, setHeroIds, p.id)}
                />{' '}
                Hero
              </label>
              <label className="text-xs">
                <input
                  type="checkbox"
                  checked={topIds.includes(p.id)}
                  onChange={() => toggle(topIds, setTopIds, p.id)}
                />{' '}
                Top
              </label>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={cn(tw.primaryBtn, 'mt-4')}
          onClick={async () => {
            await newsroomApi.saveFrontpage({ heroIds, topIds, breakingId: breakingId || null });
            setHint('Front page saved.');
          }}
        >
          Save front page
        </button>
        {hint ? <p className={tw.formHintSuccess}>{hint}</p> : null}
      </section>
    </div>
  );
}
