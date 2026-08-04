import Link from 'next/link';
import StaticPage from '../components/StaticPage/StaticPage';
import { CONTACT_EMAIL, PRIVACY_EMAIL, SITE_NAME } from '../lib/site';

export default function CookiesPage() {
  return (
    <StaticPage
      title="Cookie Policy"
      description={`Cookie policy for ${SITE_NAME}: how we and our partners (including Google) use cookies and similar technologies.`}
      lead={`This Cookie Policy explains how ${SITE_NAME} and our partners use cookies and similar technologies when you visit our website.`}
    >
      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device. Similar technologies include pixels,
        local storage, and tags. They help websites remember preferences, keep you signed in,
        measure traffic, and support advertising.
      </p>

      <h2>2. How we use cookies</h2>
      <h3>Essential / functional</h3>
      <ul>
        <li>Security and basic site operation</li>
        <li>Remembering preferences (e.g. theme)</li>
        <li>Keeping you signed in where applicable</li>
      </ul>
      <h3>Analytics</h3>
      <ul>
        <li>Understanding which pages are popular</li>
        <li>Improving performance and content</li>
      </ul>
      <h3>Advertising</h3>
      <ul>
        <li>
          Google AdSense and partners may set cookies to serve and measure ads, limit how often you
          see an ad, and (where allowed) personalize ads based on your interests
        </li>
        <li>Fraud prevention and invalid traffic detection</li>
      </ul>

      <h2>3. Google advertising cookies</h2>
      <p>
        Third parties, including Google, use cookies to serve ads on {SITE_NAME}. Google’s use of
        advertising cookies enables it and its partners to serve ads based on your visit to this
        and/or other sites. You can manage ad personalization at{' '}
        <a
          href="https://www.google.com/settings/ads"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Ads Settings
        </a>
        . Learn more:{' '}
        <a
          href="https://policies.google.com/technologies/ads"
          target="_blank"
          rel="noopener noreferrer"
        >
          How Google uses cookies in advertising
        </a>
        .
      </p>

      <h2>4. Managing cookies</h2>
      <ul>
        <li>
          <strong>Browser controls</strong> — Most browsers let you block or delete cookies. Check
          your browser’s help section.
        </li>
        <li>
          <strong>Industry opt-outs</strong> —{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
            Digital Advertising Alliance
          </a>
          ,{' '}
          <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">
            Your Online Choices (EU)
          </a>
        </li>
        <li>
          <strong>Google Analytics opt-out</strong> (if used) — browser add-on available from Google
        </li>
      </ul>
      <p>
        Note: Blocking cookies may affect site features, login, or how ads are shown (you may still
        see non-personalized ads).
      </p>

      <h2>5. Related policies</h2>
      <ul>
        <li>
          <Link href="/privacy">Privacy Notice</Link>
        </li>
        <li>
          <Link href="/terms">Terms of Use</Link>
        </li>
        <li>
          <Link href="/disclaimer">Disclaimer</Link>
        </li>
      </ul>

      <h2>6. Contact</h2>
      <p>
        Questions: <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> or{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </StaticPage>
  );
}
