import { cn } from '../../../lib/utils';

export function ScreenTitle({ title, actionHref, actionLabel, children }) {
  return (
    <>
      <h1 className="wp-heading-inline">{title}</h1>
      {actionHref ? (
        <a href={actionHref} className="page-title-action">
          {actionLabel || 'Add New'}
        </a>
      ) : null}
      {children}
      <hr className="wp-header-end" />
    </>
  );
}

export function Postbox({ title, children, className }) {
  return (
    <div className={cn('postbox', className)}>
      {title ? (
        <div className="postbox-header">
          <h2 className="hndle">{title}</h2>
        </div>
      ) : null}
      <div className="inside">{children}</div>
    </div>
  );
}

export function Notice({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div className={cn('notice', `notice-${type}`)}>
      <p>{children}</p>
    </div>
  );
}

export function ToggleField({ on, title, description, onToggle, disabled }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 select-none">
      <input
        type="checkbox"
        className="mt-1"
        checked={!!on}
        disabled={disabled}
        onChange={() => onToggle(!on)}
      />
      <span>
        <span className="block text-[14px] font-semibold text-ink">{title}</span>
        {description ? <span className="description mt-1 block">{description}</span> : null}
      </span>
    </label>
  );
}

export function NavTabs({ tabs, active, onChange }) {
  return (
    <nav className="nav-tab-wrapper" aria-label="Sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={cn('nav-tab', active === t.id && 'nav-tab-active')}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null ? <span className="count"> ({t.count})</span> : null}
        </button>
      ))}
    </nav>
  );
}
