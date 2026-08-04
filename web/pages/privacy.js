import Link from 'next/link';
import StaticPage from '../components/StaticPage/StaticPage';
import {
  ADSENSE_PUB_ID,
  CONTACT_EMAIL,
  PRIVACY_EMAIL,
  SITE_NAME,
  SITE_URL,
} from '../lib/site';

export default function PrivacyPage() {
  return (
    <StaticPage
      title="Privacy Notice"
      description={`Privacy policy for ${SITE_NAME}: how we collect, use, and protect your information, including cookies and advertising.`}
      lead={`${SITE_NAME} respects your privacy. This notice explains what information we collect, how we use it, and your choices — including advertising cookies used by Google and other partners.`}
    >
      <h2>1. Who we are</h2>
      <p>
        This website is operated by <strong>{SITE_NAME}</strong> (“we”, “us”, “our”). Website:{' '}
        <a href={SITE_URL}>{SITE_URL}</a>. Contact:{' '}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> or{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li>Contact form details (name, email, message)</li>
        <li>Account details if you register or sign in (email, display name)</li>
        <li>Comments or other content you voluntarily submit</li>
        <li>Newsletter or tip submissions, if offered</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li>Device and browser type, language, and approximate location (from IP)</li>
        <li>Pages viewed, referring URL, time spent, and click paths</li>
        <li>Cookies, pixels, and similar technologies (see our Cookie Policy)</li>
      </ul>

      <h2>3. How we use information</h2>
      <ul>
        <li>To operate, secure, and improve the website</li>
        <li>To respond to messages and provide customer support</li>
        <li>To publish and moderate user-generated content (e.g. comments)</li>
        <li>To measure audience and understand which stories are useful</li>
        <li>To show advertising and measure ad performance</li>
        <li>To comply with law and enforce our terms</li>
      </ul>

      <h2>4. Advertising and Google AdSense</h2>
      <p>
        We use third-party advertising services, including <strong>Google AdSense</strong>{' '}
        (publisher ID: <code>{ADSENSE_PUB_ID}</code>), to display ads. Google and its partners may
        use cookies and similar technologies to:
      </p>
      <ul>
        <li>Serve ads based on your prior visits to this site or other sites</li>
        <li>Show personalized or non-personalized ads</li>
        <li>Measure ad effectiveness and detect fraud/abuse</li>
      </ul>
      <p>
        Google’s use of advertising cookies enables it and its partners to serve ads based on your
        visit to this site and/or other sites on the Internet. You may opt out of personalized
        advertising by visiting{' '}
        <a
          href="https://www.google.com/settings/ads"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Ads Settings
        </a>
        . You can also visit{' '}
        <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">
          aboutads.info
        </a>{' '}
        for more industry opt-out tools.
      </p>
      <p>
        For more information, see{' '}
        <a
          href="https://policies.google.com/technologies/ads"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google’s Advertising policies
        </a>{' '}
        and{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google Privacy Policy
        </a>
        . Our full cookie details are in the <Link href="/cookies">Cookie Policy</Link>.
      </p>

      <h2>5. Cookies and similar technologies</h2>
      <p>
        We and our partners use cookies for essential site functions, analytics, preferences, and
        advertising. You can control cookies through your browser settings. Blocking some cookies
        may affect site features. Details: <Link href="/cookies">Cookie Policy</Link>.
      </p>

      <h2>6. Analytics</h2>
      <p>
        We may use analytics tools (for example Google Analytics or similar services) to understand
        traffic and improve content. These tools may set cookies and collect usage data as described
        in the provider’s privacy policy.
      </p>

      <h2>7. Sharing of information</h2>
      <p>We do not sell your personal information. We may share data with:</p>
      <ul>
        <li>Service providers who host, secure, or analyze the site</li>
        <li>Advertising partners (including Google) as described above</li>
        <li>Authorities when required by law or to protect rights and safety</li>
        <li>Successors in a merger, acquisition, or asset sale (with notice where required)</li>
      </ul>

      <h2>8. Data retention</h2>
      <p>
        We keep personal data only as long as needed for the purposes above, including legal,
        accounting, or reporting requirements, unless a longer period is required or permitted by
        law.
      </p>

      <h2>9. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect information. No method of
        transmission or storage is 100% secure; please use the site responsibly.
      </p>

      <h2>10. Children</h2>
      <p>
        This site is not directed at children under 13 (or the minimum age in your jurisdiction). We
        do not knowingly collect personal information from children. If you believe a child has
        provided us data, contact us and we will delete it where required.
      </p>

      <h2>11. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, delete, or restrict
        processing of your personal data, or to object to certain processing (including direct
        marketing). To exercise rights, email{' '}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. You may also lodge a complaint with
        a supervisory authority where applicable.
      </p>

      <h2>12. International users</h2>
      <p>
        If you access the site from outside the country where our servers or providers operate, your
        information may be transferred and processed in other countries that may have different data
        protection laws.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update this Privacy Notice from time to time. The “Last updated” date at the top will
        change when we do. Continued use of the site after changes means you accept the updated
        notice, where permitted by law.
      </p>

      <h2>14. Contact</h2>
      <p>
        Privacy questions: <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
        <br />
        General contact: <Link href="/contact">Contact page</Link> or{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </StaticPage>
  );
}
