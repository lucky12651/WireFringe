import useSWR from 'swr';
import StaticPage from '../components/StaticPage/StaticPage';
import { fetcher } from '../lib/api';

export default function MastheadPage() {
  const { data } = useSWR('/api/masthead', fetcher);
  return (
    <StaticPage
      title={data?.heading || 'Masthead'}
      description="Staff and newsroom contacts for Wirefringe."
      lead={data?.body || 'The people who make Wirefringe.'}
      showUpdated={false}
    >
      {(data?.staff || []).length ? (
        <ul>
          {data.staff.map((person, i) => (
            <li key={i}>
              <strong>{person.name}</strong>
              {person.role ? ` — ${person.role}` : ''}
              {person.email ? ` (${person.email})` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p>Staff listings are managed in Admin → Masthead.</p>
      )}
    </StaticPage>
  );
}
