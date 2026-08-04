import Link from 'next/link';
import StaticPage from '../components/StaticPage/StaticPage';
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from '../lib/site';

export default function TermsPage() {
  return (
    <StaticPage
      title="Terms of Use"
      description={`Terms of use for ${SITE_NAME}. Rules for using our website, content, and services.`}
      lead={`By accessing or using ${SITE_NAME} (${SITE_URL}), you agree to these Terms of Use. If you do not agree, please do not use the site.`}
    >
      <h2>1. Acceptance of terms</h2>
      <p>
        These Terms govern your use of {SITE_NAME} and related services. We may update them; the
        “Last updated” date will change when we do. Continued use after changes constitutes
        acceptance where allowed by law.
      </p>

      <h2>2. The service</h2>
      <p>
        {SITE_NAME} provides news, analysis, and related content about technology, business,
        finance, sports, and general interest topics. Content is for information only and may change
        without notice.
      </p>

      <h2>3. Accounts</h2>
      <p>
        If you create an account, you must provide accurate information and keep your credentials
        secure. You are responsible for activity under your account. We may suspend or terminate
        accounts that violate these Terms or our Community Guidelines.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Violate any law or third-party rights</li>
        <li>Post spam, malware, harassment, or illegal content</li>
        <li>Scrape, crawl, or harvest data in a way that burdens or harms the service</li>
        <li>Interfere with security or attempt unauthorized access</li>
        <li>Impersonate others or misrepresent your affiliation</li>
        <li>Use the site solely to click ads fraudulently or manipulate advertising systems</li>
      </ul>

      <h2>5. User content</h2>
      <p>
        Comments and other submissions remain yours, but you grant {SITE_NAME} a non-exclusive,
        worldwide, royalty-free license to host, display, and distribute that content in connection
        with the service. You represent that you have the rights to submit it. We may remove content
        that violates these Terms or our guidelines.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        Site design, logos, branding, and original editorial content are owned by {SITE_NAME} or
        its licensors. You may not copy, republish, or commercially exploit content without
        permission, except for ordinary personal reading and fair-use quotations with attribution.
      </p>

      <h2>7. Advertising</h2>
      <p>
        The site may display third-party ads (including Google AdSense). We are not responsible for
        advertiser products or claims. Clicking ads is optional; do not engage in invalid traffic.
        See our <Link href="/privacy">Privacy Notice</Link> and{' '}
        <Link href="/cookies">Cookie Policy</Link>.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        Content is provided “as is” without warranties of any kind, express or implied. We do not
        guarantee accuracy, completeness, or fitness for a particular purpose. Nothing on this site
        is professional legal, financial, medical, or investment advice. See also our{' '}
        <Link href="/disclaimer">Disclaimer</Link>.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE_NAME} and its operators shall not be liable
        for any indirect, incidental, special, consequential, or punitive damages, or any loss of
        profits or data, arising from your use of the site.
      </p>

      <h2>10. Third-party links</h2>
      <p>
        We may link to external sites. We do not control or endorse those sites and are not
        responsible for their content or policies.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may restrict or terminate access to the site at any time for violation of these Terms or
        for any reason permitted by law.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws applicable to the operator of {SITE_NAME}, without
        regard to conflict-of-law principles. Courts in that jurisdiction shall have exclusive
        venue, except where consumer law requires otherwise.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or our{' '}
        <Link href="/contact">Contact</Link> page.
      </p>
    </StaticPage>
  );
}
