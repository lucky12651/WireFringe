import { useEffect, useMemo, useState } from 'react';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';
import { cn } from '../../../lib/utils';
import { ScreenTitle, Notice, NavTabs } from '../wp/ScreenTitle';
import { MultiSelect } from '../wp/MultiSelect';

const KINDS = [
  { id: 'package', label: 'Home package' },
  { id: 'category_row', label: 'Home category row' },
  { id: 'page', label: 'Section page / header link' },
  { id: 'most_popular', label: 'Most popular' },
  { id: 'hero', label: 'Hero' },
  { id: 'stream', label: 'Sidebar stream' },
];

function blankSection() {
  return {
    id: '',
    name: '',
    subtitle: '',
    kind: 'package',
    enabled: true,
    system: false,
    showHome: true,
    showHeader: false,
    showSidebar: false,
    homeOrder: 200,
    headerOrder: 200,
    sidebarOrder: 200,
    categories: [],
    maxPosts: 4,
    pageSlug: '',
    href: '',
  };
}

export function CatalogView() {
  const [tab, setTab] = useState('sections');
  const [data, setData] = useState({ categories: [], sections: [] });
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [draft, setDraft] = useState(blankSection());
  const [editingId, setEditingId] = useState('');

  const load = async () => {
    const out = await newsroomApi.getCatalog();
    setData({
      categories: out.categories || [],
      sections: out.sections || [],
    });
  };

  useEffect(() => {
    load().catch((e) => setError(e.message || 'Failed to load catalog'));
  }, []);

  const categoryNames = useMemo(
    () => (data.categories || []).map((c) => c.name),
    [data.categories]
  );

  const persist = async (next) => {
    setSaving(true);
    setError('');
    try {
      const saved = await newsroomApi.saveCatalog(next);
      setData({
        categories: saved.categories || [],
        sections: saved.sections || [],
      });
      setHint('Content structure saved. New sections are available in the editor and RSS feeds.');
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async (e) => {
    e?.preventDefault?.();
    const name = newCat.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if ((data.categories || []).some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError('That category already exists.');
      return;
    }
    setNewCat('');
    await persist({
      ...data,
      categories: [
        ...data.categories,
        { id, name, enabled: true, sort: (data.categories.length + 1) * 10 },
      ],
    });
  };

  const toggleCat = async (id) => {
    await persist({
      ...data,
      categories: data.categories.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    });
  };

  const removeCat = async (id) => {
    const row = data.categories.find((c) => c.id === id);
    if (!row) return;
    if (!window.confirm(`Delete category “${row.name}”? Posts keep their existing label until you recategorize them.`)) return;
    await persist({
      ...data,
      categories: data.categories.filter((c) => c.id !== id),
    });
  };

  const saveSection = async (e) => {
    e?.preventDefault?.();
    const name = draft.name.trim();
    if (!name) {
      setError('Section name is required.');
      return;
    }
    const id = editingId || draft.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const row = {
      ...draft,
      id,
      name,
      pageSlug: (draft.pageSlug || '').trim() || undefined,
      href: (draft.href || '').trim() || undefined,
    };
    const exists = data.sections.some((s) => s.id === id);
    const sections = exists
      ? data.sections.map((s) => (s.id === id ? { ...s, ...row } : s))
      : [...data.sections, row];
    await persist({ ...data, sections });
    setDraft(blankSection());
    setEditingId('');
  };

  const move = async (id, field, dir) => {
    const list = [...data.sections].sort((a, b) => (a[field] || 0) - (b[field] || 0));
    const i = list.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const a = list[i][field] || 0;
    const b = list[j][field] || 0;
    const next = data.sections.map((s) => {
      if (s.id === list[i].id) return { ...s, [field]: b };
      if (s.id === list[j].id) return { ...s, [field]: a };
      return s;
    });
    await persist({ ...data, sections: next });
  };

  const toggleSectionFlag = async (id, field) => {
    await persist({
      ...data,
      sections: data.sections.map((s) => (s.id === id ? { ...s, [field]: !s[field] } : s)),
    });
  };

  const removeSection = async (id) => {
    const row = data.sections.find((s) => s.id === id);
    if (!row || row.system) return;
    if (!window.confirm(`Delete section “${row.name}”?`)) return;
    await persist({ ...data, sections: data.sections.filter((s) => s.id !== id) });
  };

  const homeRows = useMemo(
    () => [...data.sections].filter((s) => s.showHome).sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0)),
    [data.sections]
  );
  const headerRows = useMemo(
    () => [...data.sections].filter((s) => s.showHeader).sort((a, b) => (a.headerOrder || 0) - (b.headerOrder || 0)),
    [data.sections]
  );
  const sidebarRows = useMemo(
    () => [...data.sections].filter((s) => s.showSidebar).sort((a, b) => (a.sidebarOrder || 0) - (b.sidebarOrder || 0)),
    [data.sections]
  );

  return (
    <div className="wp-wrap">
      <ScreenTitle title="Sections" />
      <p className="mb-4 mt-0 max-w-3xl text-[13px] text-ink-secondary">
        A <b>category</b> is the topic on a post (Tech, Sports). A <b>section</b> is a place on the
        site (homepage block, header link, sidebar). Assign categories to a section to control which
        posts appear there. New items show up immediately in the post editor and RSS destinations.
      </p>
      {hint ? <Notice type="success">{hint}</Notice> : null}
      {error ? <Notice type="error">{error}</Notice> : null}
      <NavTabs
        tabs={[
          { id: 'sections', label: 'Sections' },
          { id: 'categories', label: 'Categories' },
          { id: 'placements', label: 'Placements' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'categories' ? (
        <section className="postbox">
          <h2 className="hndle">Categories</h2>
          <div className="inside">
            <form onSubmit={addCategory} className="mb-4 flex max-w-xl gap-2">
              <input
                className={tw.formInput}
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="New category name"
              />
              <button type="submit" className={tw.primaryBtn} disabled={saving}>
                Add
              </button>
            </form>
            <table className="wp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>On</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <input type="checkbox" checked={!!c.enabled} onChange={() => toggleCat(c.id)} />
                    </td>
                    <td>
                      <button type="button" className="border-0 bg-transparent p-0 text-[var(--danger)]" onClick={() => removeCat(c.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'sections' ? (
        <>
          <section className="postbox">
            <h2 className="hndle">{editingId ? 'Edit section' : 'Add section'}</h2>
            <div className="inside">
              <form onSubmit={saveSection}>
                <table className="form-table">
                  <tbody>
                    <tr>
                      <th scope="row">Name</th>
                      <td>
                        <input className={cn(tw.formInput, 'max-w-md')} value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Subtitle</th>
                      <td>
                        <input className={cn(tw.formInput, 'max-w-xl')} value={draft.subtitle} onChange={(e) => setDraft((p) => ({ ...p, subtitle: e.target.value }))} />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Type</th>
                      <td>
                        <select className={cn(tw.formSelect, 'max-w-md')} value={draft.kind} onChange={(e) => setDraft((p) => ({ ...p, kind: e.target.value }))} disabled={!!draft.system}>
                          {KINDS.map((k) => (
                            <option key={k.id} value={k.id}>{k.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Categories</th>
                      <td>
                        <MultiSelect
                          options={categoryNames}
                          value={draft.categories}
                          onChange={(categories) => setDraft((p) => ({ ...p, categories }))}
                          placeholder="Filter categories…"
                        />
                        <span className="description">Posts in these categories fill this section unless you pin specific posts in the editor.</span>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Show on</th>
                      <td>
                        <label className="mr-4 inline-flex items-center gap-1.5">
                          <input type="checkbox" checked={!!draft.showHome} onChange={(e) => setDraft((p) => ({ ...p, showHome: e.target.checked }))} /> Home
                        </label>
                        <label className="mr-4 inline-flex items-center gap-1.5">
                          <input type="checkbox" checked={!!draft.showHeader} onChange={(e) => setDraft((p) => ({ ...p, showHeader: e.target.checked }))} /> Header
                        </label>
                        <label className="inline-flex items-center gap-1.5">
                          <input type="checkbox" checked={!!draft.showSidebar} onChange={(e) => setDraft((p) => ({ ...p, showSidebar: e.target.checked }))} /> Sidebar
                        </label>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Section URL slug</th>
                      <td>
                        <input className={cn(tw.formInput, 'max-w-xs')} value={draft.pageSlug || ''} onChange={(e) => setDraft((p) => ({ ...p, pageSlug: e.target.value }))} placeholder="tech" />
                        <span className="description">Used as /section/slug when this section has a page or header link.</span>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Max posts</th>
                      <td>
                        <input type="number" min="1" max="40" className={cn(tw.formInput, 'w-24')} value={draft.maxPosts} onChange={(e) => setDraft((p) => ({ ...p, maxPosts: Number(e.target.value) || 4 }))} />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="submit">
                  <button type="submit" className={tw.primaryBtn} disabled={saving}>
                    {editingId ? 'Update section' : 'Add section'}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      className={cn(tw.secondaryBtn, 'ml-2')}
                      onClick={() => {
                        setEditingId('');
                        setDraft(blankSection());
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </p>
              </form>
            </div>
          </section>

          <section className="postbox">
            <h2 className="hndle">All sections</h2>
            <div className="inside">
              <table className="wp-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Type</th>
                    <th>Categories</th>
                    <th>Home</th>
                    <th>Header</th>
                    <th>Sidebar</th>
                    <th>On</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.sections.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        {s.subtitle ? <div className="text-[12px] text-ink-secondary">{s.subtitle}</div> : null}
                      </td>
                      <td className="text-ink-secondary">{s.kind}</td>
                      <td className="text-[12px] text-ink-secondary">{(s.categories || []).join(', ') || '—'}</td>
                      <td><input type="checkbox" checked={!!s.showHome} onChange={() => toggleSectionFlag(s.id, 'showHome')} /></td>
                      <td><input type="checkbox" checked={!!s.showHeader} onChange={() => toggleSectionFlag(s.id, 'showHeader')} /></td>
                      <td><input type="checkbox" checked={!!s.showSidebar} onChange={() => toggleSectionFlag(s.id, 'showSidebar')} /></td>
                      <td><input type="checkbox" checked={!!s.enabled} onChange={() => toggleSectionFlag(s.id, 'enabled')} /></td>
                      <td>
                        <button type="button" className="mr-2 border-0 bg-transparent p-0 text-mint" onClick={() => { setEditingId(s.id); setDraft({ ...blankSection(), ...s }); }}>
                          Edit
                        </button>
                        {!s.system ? (
                          <button type="button" className="border-0 bg-transparent p-0 text-[var(--danger)]" onClick={() => removeSection(s.id)}>
                            Delete
                          </button>
                        ) : (
                          <span className="text-[11px] text-ink-tertiary">system</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {tab === 'placements' ? (
        <>
          <PlacementTable title="Homepage order" rows={homeRows} field="homeOrder" onMove={move} />
          <PlacementTable title="Header order" rows={headerRows} field="headerOrder" onMove={move} />
          <PlacementTable title="Sidebar order" rows={sidebarRows} field="sidebarOrder" onMove={move} />
        </>
      ) : null}
    </div>
  );
}

function PlacementTable({ title, rows, field, onMove }) {
  return (
    <section className="postbox">
      <h2 className="hndle">{title}</h2>
      <div className="inside">
        {rows.length === 0 ? (
          <p className="text-ink-secondary">Nothing assigned here yet. Enable Home / Header / Sidebar on a section.</p>
        ) : (
          <table className="wp-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Section</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>
                    {s.name} <span className="text-[12px] text-ink-secondary">({s.kind})</span>
                  </td>
                  <td>
                    <button type="button" className="mr-2 border-0 bg-transparent p-0 text-mint" onClick={() => onMove(s.id, field, -1)} disabled={i === 0}>
                      Up
                    </button>
                    <button type="button" className="border-0 bg-transparent p-0 text-mint" onClick={() => onMove(s.id, field, 1)} disabled={i === rows.length - 1}>
                      Down
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
