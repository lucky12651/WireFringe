import Link from 'next/link';
import StaticPage from '../components/StaticPage/StaticPage';
import { CONTACT_EMAIL, SITE_NAME } from '../lib/site';

export default function DisclaimerPage() {
  return (
    <StaticPage
      title="Disclaimer"
      description={`Editorial, financial, and advertising disclaimer for ${SITE_NAME}.`}
      lead={`${SITE_NAME} provides general information only. Please read this disclaimer carefully.`}
    >
      <h2>General information</h2>
      <p>
        Content on {SITE_NAME} is for general informational and educational purposes. We strive for
        accuracy but do not warrant that all information is complete, current, or error-free.
        Articles may be updated over time.
      </p>

      <h2>Not professional advice</h2>
      <p>
        Nothing on this site constitutes professional legal, financial, tax, investment, medical, or
        other advice. Always consult a qualified professional before making decisions based on
        information you read here. You use the site at your own risk.
      </p>

      <h2>Finance and markets</h2>
      <p>
        Market data, prices (including gold/silver), tax commentary, and investment-related topics
        can change quickly and may not apply to your situation. Past performance is not a guarantee
        of future results.
      </p>

      <h2>External links</h2>
      <p>
        We may link to third-party websites. We are not responsible for their content, privacy
        practices, or availability.
      </p>

      <h2>Advertising</h2>
      <p>
        {SITE_NAME} may display advertisements, including Google AdSense and similar networks. Ads
        are provided by third parties. We do not control every ad shown and are not responsible for
        advertiser products, services, or claims. Editorial content is not for sale unless clearly
        labeled as sponsored or paid partnership.
      </p>

      <h2>User comments</h2>
      <p>
        Opinions expressed in comments are those of the commenters, not necessarily {SITE_NAME}. We
        may moderate comments under our <Link href="/community-guidelines">Community Guidelines</Link>
        .
      </p>

      <h2>Limitation</h2>
      <p>
        To the fullest extent permitted by law, {SITE_NAME} disclaims liability for any loss or
        damage arising from use of the site or reliance on its content. See also our{' '}
        <Link href="/terms">Terms of Use</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ·{' '}
        <Link href="/contact">Contact form</Link>
      </p>
    </StaticPage>
  );
}
