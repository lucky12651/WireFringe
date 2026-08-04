import { useState } from 'react';
import Link from 'next/link';
import StaticPage from '../components/StaticPage/StaticPage';
import pageStyles from '../components/StaticPage/StaticPage.module.css';
import { EDITORIAL_EMAIL, SITE_NAME } from '../lib/site';

export default function TipUsPage() {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    const msg = message.trim();
    if (!msg) {
      setStatus('Please describe the tip or story idea.');
      return;
    }
    const body = [
      'Story tip for ' + SITE_NAME,
      contact.trim() ? `Contact (optional): ${contact.trim()}` : 'Contact: (anonymous)',
      '',
      msg,
    ].join('\n');
    window.location.href = `mailto:${EDITORIAL_EMAIL}?subject=${encodeURIComponent(
      `[Tip] ${SITE_NAME}`
    )}&body=${encodeURIComponent(body)}`;
    setStatus('Your email app should open. If not, write us at the address below.');
  };

  return (
    <StaticPage
      title="Tip us"
      description={`Send a confidential story tip to the ${SITE_NAME} editorial team.`}
      lead="Have a lead, document, or tip about tech, business, policy, or something our readers should know? We want to hear from you."
      showUpdated={false}
    >
      <h2>How to tip</h2>
      <p>
        Email <a href={`mailto:${EDITORIAL_EMAIL}`}>{EDITORIAL_EMAIL}</a> or use the form below.
        Include as much detail as you can: who, what, when, where, and any public links. Do not send
        passwords or illegal material.
      </p>

      <form className={pageStyles.form} onSubmit={onSubmit}>
        <div className={pageStyles.field}>
          <label htmlFor="tip-message">Your tip</label>
          <textarea
            id="tip-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What should we know?"
            required
          />
        </div>
        <div className={pageStyles.field}>
          <label htmlFor="tip-contact">How can we reach you? (optional)</label>
          <input
            id="tip-contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email or other contact"
          />
        </div>
        <button type="submit" className={pageStyles.submit}>
          Send tip
        </button>
        {status ? <p className={pageStyles.formStatus}>{status}</p> : null}
      </form>

      <h2>Confidentiality</h2>
      <p>
        We take source protection seriously. If you need extra caution, say so in your message and
        use a secure channel when possible. Absolute anonymity cannot be guaranteed on the public
        internet.
      </p>

      <p>
        General questions? <Link href="/contact">Contact us</Link>.
      </p>
    </StaticPage>
  );
}
