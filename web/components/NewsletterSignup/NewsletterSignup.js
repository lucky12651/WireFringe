import { useState } from 'react';
import { newsroomApi } from '../../lib/api';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    try {
      await newsroomApi.subscribe(email.trim(), 'homepage');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not subscribe.');
    }
  };

  return (
    <div
      className="group relative overflow-hidden bg-gradient-to-br from-bg-elevated via-bg-card to-bg-secondary border border-line rounded-lg p-[22px] transition-all duration-300 hover:border-mint/30 hover:shadow-md hover:-translate-y-0.5"
      aria-label="Newsletter signup"
    >
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mint/50 to-transparent opacity-70"
        aria-hidden="true"
      />
      <h3 className="text-[17px] font-extrabold mb-2 text-ink tracking-tight">Get weekly briefings</h3>
      <p className="text-[13px] text-ink-tertiary leading-normal mb-3.5">
        Top stories and analysis, delivered to your inbox.
      </p>

      {sent ? (
        <div className="text-mint text-[13px] font-semibold">Thanks — check your inbox!</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            className="h-11 px-3.5 border border-line rounded-sm bg-bg text-ink text-sm outline-none w-full transition-all focus:border-mint focus:shadow-[0_0_0_3px_var(--mint-dim)]"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
          />
          <button
            className="h-11 bg-mint text-black border-0 rounded-sm font-mono text-[11px] font-bold tracking-wide uppercase cursor-pointer transition-all hover:bg-mint-hover hover:-translate-y-px hover:shadow-mint active:translate-y-0"
            type="submit"
          >
            Subscribe
          </button>
          {error ? <p className="m-0 text-[12px] text-[#c0392b]">{error}</p> : null}
        </form>
      )}
    </div>
  );
}
