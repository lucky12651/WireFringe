import StaticPage from '../components/StaticPage/StaticPage';
import Link from 'next/link';

export default function SourcingPage() {
  return (
    <StaticPage
      title="Sourcing &amp; AI policy"
      description="How Wirefringe sources stories, labels rewritten copy, and handles corrections."
      lead="Readers should always know where a story came from and when it was changed."
      showUpdated={false}
    >
      <h2>Original reporting</h2>
      <p>
        Staff stories are written by named authors. Those pieces do not carry a “rewritten from”
        line.
      </p>
      <h2>Wire and partner copy</h2>
      <p>
        Some stories begin as publicly available wires or RSS items and are rewritten in the
        newsroom. Those articles show a <strong>Rewritten from</strong> source line with the
        original publisher or URL. They stay in <em>Review</em> until an editor publishes them.
      </p>
      <h2>Corrections</h2>
      <p>
        If we change a fact after publication, a corrections box appears on the story with the
        update time. See the <Link href="/masthead">masthead</Link> for contacts.
      </p>
    </StaticPage>
  );
}
