import Link from 'next/link';
import BrandLogo from '../../BrandLogo/BrandLogo';
import { cn } from '../../../lib/utils';

const COLLAGE = [
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=70',
];

export const authInputClass =
  'w-full h-[46px] px-3 border border-line-strong rounded-sm bg-bg-elevated text-ink text-[15px] outline-none transition-[border-color,box-shadow] duration-150 focus:border-mint focus:shadow-[0_0_0_3px_var(--mint-dim)]';

export const authSubmitClass =
  'mt-1 h-12 w-full border-none rounded-sm bg-mint text-black font-mono text-xs font-extrabold tracking-[0.1em] uppercase cursor-pointer transition-all duration-150 enabled:hover:bg-mint-hover enabled:hover:shadow-mint enabled:hover:-translate-y-px disabled:opacity-55 disabled:cursor-not-allowed';

export function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-hidden bg-bg text-ink font-sans">
      <div
        className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[3px] z-0 max-sm:grid-cols-2 max-sm:grid-rows-4"
        aria-hidden="true"
      >
        {COLLAGE.map((src, i) => (
          <div
            key={i}
            className={cn('relative overflow-hidden bg-bg-elevated', i >= 8 && 'max-sm:hidden')}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover block saturate-[0.85] brightness-[0.55]"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 z-[1] bg-black/55 backdrop-blur-[1px]" aria-hidden="true" />

      <div className="relative z-[2] min-h-screen min-h-[100dvh] flex flex-col items-center justify-center pt-12 px-4 pb-[100px] max-sm:pt-8 max-sm:px-3 max-sm:pb-[110px]">
        <div className="on-media mb-[22px] max-sm:mb-4 [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
          <BrandLogo size="lg" className="text-white" />
        </div>

        <div className="w-[min(440px,100%)] bg-bg-card text-ink border border-line rounded p-9 px-8 pb-7 shadow-xl max-sm:p-7 max-sm:px-5 max-sm:pb-[22px]">
          {children}
        </div>
      </div>

      <footer className="on-media absolute left-0 right-0 bottom-0 z-[2] pt-4 px-5 pb-5 text-center">
        <nav
          className="flex flex-wrap justify-center gap-x-3.5 gap-y-2 mb-2 [&_a]:text-white/55 [&_a]:text-[11px] [&_a]:no-underline [&_a]:font-mono [&_a]:tracking-wide hover:[&_a]:text-mint"
          aria-label="Legal"
        >
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Notice</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/about">About</Link>
        </nav>
        <p className="m-0 text-[11px] text-white/35 font-mono">
          © {new Date().getFullYear()} Wirefringe. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
