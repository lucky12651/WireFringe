import { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

  return (
    <div
      className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-bg-card to-[#0a0a0a] border border-white/[0.07] rounded-lg p-[22px] transition-all duration-300 hover:border-mint/30 hover:shadow-[0_16px_44px_rgba(0,0,0,0.4),0_0_32px_rgba(60,255,208,0.06)] hover:-translate-y-0.5"
      aria-label="Newsletter signup"
    >
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mint/50 to-transparent opacity-70"
        aria-hidden="true"
      />
      <h3 className="text-[17px] font-extrabold mb-2 text-white tracking-tight">Get weekly briefings</h3>
      <p className="text-[13px] text-[#999] leading-normal mb-3.5">
        Top stories and analysis, delivered to your inbox.
      </p>

      {sent ? (
        <div className="text-mint text-[13px] font-semibold">Thanks — check your inbox!</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            className="h-11 px-3.5 border border-line rounded-sm bg-[#080808] text-white text-sm outline-none w-full transition-all focus:border-mint focus:shadow-[0_0_0_3px_rgba(60,255,208,0.14)]"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
          />
          <button
            className="h-11 bg-mint text-black border-0 rounded-sm font-mono text-[11px] font-bold tracking-wide uppercase cursor-pointer transition-all hover:bg-mint-hover hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(60,255,208,0.28)] active:translate-y-0"
            type="submit"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
