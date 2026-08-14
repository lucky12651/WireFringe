export function FacebookIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.48h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.15" cy="6.85" r="1.05" fill="currentColor" />
    </svg>
  );
}

export function YoutubeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 7.2a3.4 3.4 0 0 0-2.4-2.4C19.2 4.4 12 4.4 12 4.4s-7.2 0-9.1.4A3.4 3.4 0 0 0 .5 7.2 35.6 35.6 0 0 0 0 12a35.6 35.6 0 0 0 .5 4.8 3.4 3.4 0 0 0 2.4 2.4c1.9.4 9.1.4 9.1.4s7.2 0 9.1-.4a3.4 3.4 0 0 0 2.4-2.4A35.6 35.6 0 0 0 24 12a35.6 35.6 0 0 0-.5-4.8ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  );
}

export function ThreadsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.4 11.3c-.2-3.1-1.9-4.9-4.8-4.9-3.2 0-5.3 2.4-5.3 6.1 0 3.4 1.9 5.9 5.3 5.9 2.5 0 4.4-1.1 5.2-3.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9.7 11.9c.3-1.6 1.3-2.5 2.6-2.5 2.1 0 2.6 1.9 2.6 3.3 0 .7-.1 1.4-.4 1.9-.5.9-1.3 1.3-2.3 1.3-1.4 0-2.4-1-2.5-2.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M14.9 12.7c.8.5 2.2 1 3.7.7 1.8-.4 3-1.6 3.2-3.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function XIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.24 2H21l-6.52 7.45L22 22h-6.17l-4.82-6.3L5.5 22H2.73l6.97-7.97L2 2h6.32l4.36 5.77L18.24 2Zm-1.08 18.08h1.7L7.01 3.83H5.18l11.98 16.25Z" />
    </svg>
  );
}

export function ArchivesIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5h16v3.2H4V7.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6 10.7h12V19H6v-8.3Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 14h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5.2 4.8h13.6L20 7.5H4l1.2-2.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export const SOCIAL_LINKS = [
  { href: 'https://facebook.com', label: 'Facebook', Icon: FacebookIcon },
  { href: 'https://instagram.com', label: 'Instagram', Icon: InstagramIcon },
  { href: 'https://youtube.com', label: 'YouTube', Icon: YoutubeIcon },
  { href: 'https://threads.net', label: 'Threads', Icon: ThreadsIcon },
  { href: 'https://x.com', label: 'X', Icon: XIcon },
];
