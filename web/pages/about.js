import Link from 'next/link';
import StaticPage from '../components/StaticPage/StaticPage';
import { CONTACT_EMAIL, SITE_NAME, SITE_TAGLINE } from '../lib/site';

export default function AboutPage() {
  return (
    <StaticPage
      title="About us"
      description={`Learn about ${SITE_NAME} — an independent digital publication covering tech, AI, business, finance, and news.`}
      lead={SITE_TAGLINE}
      showUpdated={false}
    >
      <h2>Who we are</h2>
      <p>
        <strong>{SITE_NAME}</strong> is an independent online publication focused on technology,
        artificial intelligence, business and markets, personal finance, India and world news,
        sports, and culture. We publish original reporting, explainers, and analysis for readers
        who want clear, useful context — not noise.
      </p>

      <h2>What we cover</h2>
      <ul>
        <li>
          <strong>AI &amp; Future Tech</strong> — enterprise AI, cyber security, platforms, and
          emerging tools
        </li>
        <li>
          <strong>Tech</strong> — cloud, products, infrastructure, and how technology changes daily
          life
        </li>
        <li>
          <strong>Business &amp; Markets</strong> — strategy, markets, and company news that
          matters
        </li>
        <li>
          <strong>Personal Finance</strong> — tax, savings, prices, and practical money guidance
        </li>
        <li>
          <strong>India News &amp; World News</strong> — politics, policy, and major headlines
        </li>
        <li>
          <strong>Sports</strong> — scores, transfers, and stories from the field
        </li>
      </ul>

      <h2>Our standards</h2>
      <p>
        We aim for accuracy, clarity, and fairness. When we correct a material error, we update the
        article. Opinion and analysis pieces are labeled as such when needed. Advertising and
        sponsored content (if any) are disclosed and kept separate from editorial decisions.
      </p>
      <p>
        Read our{' '}
        <Link href="/community-guidelines">Community Guidelines</Link>,{' '}
        <Link href="/disclaimer">Disclaimer</Link>, and{' '}
        <Link href="/privacy">Privacy Notice</Link> for more detail.
      </p>

      <h2>Advertising</h2>
      <p>
        {SITE_NAME} uses advertising (including Google AdSense and similar partners) to keep the
        site free for readers. Ads do not control what we publish. See our{' '}
        <Link href="/privacy">Privacy Notice</Link> and <Link href="/cookies">Cookie Policy</Link>{' '}
        for how ad technology works on this site.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, feedback, or partnership inquiries:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p>
        Story tips: visit our <Link href="/tip-us">Tip Us</Link> page. For a general message, use
        the <Link href="/contact">Contact</Link> form.
      </p>
    </StaticPage>
  );
}
