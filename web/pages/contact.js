import { useState } from 'react';
import Link from 'next/link';
import StaticPage from '../components/StaticPage/StaticPage';
import pageStyles from '../components/StaticPage/StaticPage.module.css';
import { CONTACT_EMAIL, EDITORIAL_EMAIL, SITE_NAME } from '../lib/site';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General inquiry');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    setStatus('');

    const n = name.trim();
    const em = email.trim();
    const msg = message.trim();
    if (!n || !em || !msg) {
      setError('Please fill in your name, email, and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError('Please enter a valid email address.');
      return;
    }

    const body = [
      `Name: ${n}`,
      `Email: ${em}`,
      `Subject: ${subject}`,
      '',
      msg,
    ].join('\n');

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      `[${SITE_NAME}] ${subject}`
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setStatus(
      'Your email app should open with the message ready to send. If it does not, email us directly at the address below.'
    );
  };

  return (
    <StaticPage
      title="Contact"
      description={`Contact ${SITE_NAME} for questions, feedback, corrections, or partnership inquiries.`}
      lead="We read every message. For the fastest response, include a clear subject and relevant links."
      showUpdated={false}
    >
      <h2>Email us</h2>
      <ul>
        <li>
          General &amp; business: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </li>
        <li>
          Tips &amp; story ideas: <a href={`mailto:${EDITORIAL_EMAIL}`}>{EDITORIAL_EMAIL}</a>
        </li>
      </ul>
      <p>
        Prefer a form? Fill this out — it opens your email client with the details filled in.
      </p>

      <form className={pageStyles.form} onSubmit={onSubmit} noValidate>
        <div className={pageStyles.field}>
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className={pageStyles.field}>
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={pageStyles.field}>
          <label htmlFor="contact-subject">Subject</label>
          <select
            id="contact-subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option>General inquiry</option>
            <option>Correction / update</option>
            <option>Advertising &amp; partnerships</option>
            <option>Privacy request</option>
            <option>Technical issue</option>
            <option>Other</option>
          </select>
        </div>
        <div className={pageStyles.field}>
          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={pageStyles.submit}>
          Send message
        </button>
        {error ? <p className={pageStyles.formError}>{error}</p> : null}
        {status ? <p className={pageStyles.formStatus}>{status}</p> : null}
      </form>

      <h2>Other pages</h2>
      <ul>
        <li>
          <Link href="/tip-us">Tip Us</Link> — confidential story tips
        </li>
        <li>
          <Link href="/privacy">Privacy Notice</Link> — data &amp; ads
        </li>
        <li>
          <Link href="/about">About us</Link>
        </li>
      </ul>

      <div className={pageStyles.note}>
        We typically respond within a few business days. Messages about privacy or legal requests
        may take longer. Do not send passwords or sensitive personal data through this form.
      </div>
    </StaticPage>
  );
}
