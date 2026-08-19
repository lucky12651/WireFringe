import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks';
import { cn } from '../../lib/utils';

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  );
}

function ForYouIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3.5 14.2 9l5.8.5-4.4 3.7 1.4 5.6L12 15.8 6.9 18.8l1.4-5.6L4 9.5 9.8 9 12 3.5z" />
    </svg>
  );
}

function SearchIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.8'} aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5 20.5 21" />
    </svg>
  );
}

function AccountIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2c.8-3.2 3.5-5 7-5s6.2 1.8 7 5" />
    </svg>
  );
}

const ITEMS = [
  { id: 'home', label: 'Home', href: '/', Icon: HomeIcon, match: (path) => path === '/' },
  { id: 'foryou', label: 'For You', href: '/for-you', Icon: ForYouIcon, match: (path) => path.startsWith('/for-you') },
  { id: 'search', label: 'Search', href: '/search', Icon: SearchIcon, match: (path) => path.startsWith('/search') },
  { id: 'account', label: 'Account', href: '/account', Icon: AccountIcon, match: (path) => path.startsWith('/account') || path.startsWith('/login') || path.startsWith('/signup') },
];

export default function MobileBottomNav() {
  const router = useRouter();
  const { me } = useAuth();
  const path = String(router.asPath || router.pathname || '/').split('?')[0];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[10900] min-[1001px]:hidden border-t border-line bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur-[8px] pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4 m-0 p-0 list-none h-[58px]">
        {ITEMS.map((item) => {
          const active = item.match(path);
          const href =
            item.id === 'account' && !me
              ? `/login?next=${encodeURIComponent('/account')}`
              : item.href;
          const Icon = item.Icon;
          return (
            <li key={item.id} className="min-w-0">
              <Link
                href={href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 h-full no-underline px-1 transition-colors',
                  active ? 'text-mint' : 'text-ink-muted hover:text-ink'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {active ? (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-mint" />
                ) : null}
                <Icon active={active} />
                <span className="font-mono text-[9px] font-bold tracking-[0.08em] uppercase leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
