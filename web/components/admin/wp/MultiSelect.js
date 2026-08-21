import { useMemo, useState } from 'react';
import { cn } from '../../../lib/utils';

export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select…',
  getId = (o) => (typeof o === 'string' ? o : o.id),
  getLabel = (o) => (typeof o === 'string' ? o : o.name || o.label),
}) {
  const [q, setQ] = useState('');
  const selected = Array.isArray(value) ? value : [];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return options.filter((o) => {
      const label = String(getLabel(o) || '');
      return !needle || label.toLowerCase().includes(needle);
    });
  }, [options, q, getLabel]);

  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  };

  return (
    <div className="max-w-xl rounded border border-[var(--border)] bg-bg">
      <input
        className="w-full border-0 border-b border-[var(--border)] bg-transparent px-2 py-1.5 text-[13px] outline-none"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
      />
      <div className="max-h-[180px] overflow-auto p-1.5">
        {filtered.length === 0 ? (
          <p className="m-0 px-1 py-2 text-[12px] text-ink-tertiary">No matches.</p>
        ) : (
          filtered.map((o) => {
            const id = getId(o);
            return (
              <label key={id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-[13px] hover:bg-bg-hover">
                <input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} />
                <span>{getLabel(o)}</span>
              </label>
            );
          })
        )}
      </div>
      {selected.length ? (
        <p className="m-0 border-t border-[var(--border)] px-2 py-1 text-[11px] text-ink-secondary">
          {selected.length} selected
        </p>
      ) : null}
    </div>
  );
}
