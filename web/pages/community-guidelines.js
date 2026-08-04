import Link from 'next/link';
import StaticPage from '../components/StaticPage/StaticPage';
import { CONTACT_EMAIL, SITE_NAME } from '../lib/site';

export default function CommunityGuidelinesPage() {
  return (
    <StaticPage
      title="Community Guidelines"
      description={`Community guidelines for comments and participation on ${SITE_NAME}.`}
      lead={`We want ${SITE_NAME} to be a useful, civil place for readers. These guidelines apply to comments and other interactive features.`}
      showUpdated={false}
    >
      <h2>Be respectful</h2>
      <ul>
        <li>No harassment, hate speech, threats, or personal attacks</li>
        <li>Disagree with ideas — don’t attack people</li>
        <li>No doxxing or sharing others’ private information</li>
      </ul>

      <h2>Stay on topic</h2>
      <ul>
        <li>Keep comments relevant to the article</li>
        <li>No spam, repeated posting, or off-topic promotions</li>
        <li>Disclose if you have a commercial interest in a product you recommend</li>
      </ul>

      <h2>No illegal or harmful content</h2>
      <ul>
        <li>No content that promotes crime, violence, or self-harm</li>
        <li>No malware links, scams, or phishing</li>
        <li>No sexually explicit material involving minors (or any prohibited content)</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        Don’t post content you don’t have the right to share. Quote briefly with context when
        relevant; don’t dump full copyrighted articles.
      </p>

      <h2>Advertising integrity</h2>
      <p>
        Don’t ask others to click ads, generate fake traffic, or game advertising systems. That
        hurts the site and violates ad network policies.
      </p>

      <h2>Moderation</h2>
      <p>
        We may edit, hide, or remove comments that break these rules, and may suspend accounts for
        repeated violations. Reporting issues:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or{' '}
        <Link href="/contact">Contact</Link>.
      </p>

      <h2>Related</h2>
      <ul>
        <li>
          <Link href="/terms">Terms of Use</Link>
        </li>
        <li>
          <Link href="/privacy">Privacy Notice</Link>
        </li>
      </ul>
    </StaticPage>
  );
}
