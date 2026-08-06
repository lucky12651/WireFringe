/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          elevated: 'var(--bg-elevated)',
          card: 'var(--bg-card)',
          hover: 'var(--bg-hover)',
          highlight: 'var(--bg-highlight)',
        },
        mint: {
          DEFAULT: 'var(--mint)',
          hover: 'var(--mint-hover)',
          dim: 'var(--mint-dim)',
        },
        purple: {
          DEFAULT: 'var(--purple)',
          deep: 'var(--purple-deep)',
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
          soft: 'var(--text-soft)',
          dek: 'var(--text-dek)',
        },
        line: {
          DEFAULT: 'var(--border)',
          dim: 'var(--border-dim)',
          light: 'var(--border-light)',
          strong: 'var(--border-strong)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'Helvetica', 'Arial', 'sans-serif'],
        heading: ['var(--font-heading)', 'Inter', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'SF Mono', 'Consolas', 'monospace'],
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        hero: ['var(--fs-hero)', { lineHeight: '1.12', letterSpacing: '-0.03em', fontWeight: '800' }],
        h1: ['var(--fs-h1)', { lineHeight: '1.12', letterSpacing: '-0.03em', fontWeight: '800' }],
        meta: ['var(--fs-meta)', { letterSpacing: '0.08em', fontWeight: '700' }],
      },
      maxWidth: {
        site: 'var(--max-width)',
        stream: 'var(--stream-width)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        mint: '0 6px 22px rgba(60, 255, 208, 0.35)',
        'mint-glow': '0 0 24px rgba(60, 255, 208, 0.25)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'drop-in': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'drop-in': 'drop-in 0.18s ease',
        shimmer: 'shimmer 1.4s ease infinite',
        spin: 'spin 0.7s linear infinite',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
