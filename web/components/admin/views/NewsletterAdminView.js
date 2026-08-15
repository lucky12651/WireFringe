import { useEffect, useState } from 'react';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';
import { formatDateShort } from '../../../lib/utils';

export function NewsletterAdminView() {
  const [subs, setSubs] = useState([]);
  const [issues, setIssues] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [hint, setHint] = useState('');

  const refresh = () => {
    newsroomApi.subscribers().then(setSubs).catch(() => setSubs([]));
    newsroomApi.issues().then(setIssues).catch(() => setIssues([]));
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className={tw.adminView}>
      <section className={tw.adminSection}>
        <h3 className={tw.adminSectionTitle}>Subscribers</h3>
        <p className={tw.adminSectionDesc}>{subs.length} addresses on the list.</p>
        <div className={tw.tableWrap}>
          <table className={tw.table}>
            <thead>
              <tr>
                <th className={tw.th}>Email</th>
                <th className={tw.th}>Source</th>
                <th className={tw.th}>Added</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className={tw.td}>{s.email}</td>
                  <td className={tw.td}>{s.source}</td>
                  <td className={tw.td}>{formatDateShort(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={tw.adminSection}>
        <h3 className={tw.adminSectionTitle}>Archive a send</h3>
        <p className={tw.adminSectionDesc}>
          Saves an issue in the archive. Configure SMTP later to actually email the list.
        </p>
        <input className={tw.formInput} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        <textarea className={cnText()} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" />
        <button
          type="button"
          className={tw.primaryBtn}
          onClick={async () => {
            await newsroomApi.createIssue(subject, body);
            setSubject('');
            setBody('');
            setHint('Issue archived.');
            refresh();
          }}
        >
          Save issue
        </button>
        {hint ? <p className={tw.formHintSuccess}>{hint}</p> : null}
        <ul className="mt-4 pl-5">
          {issues.map((i) => (
            <li key={i.id}>
              {i.subject} — {formatDateShort(i.sentAt || i.createdAt)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function cnText() {
  return 'min-h-[120px] w-full mt-2 mb-3 p-3 border border-line bg-bg-elevated text-ink';
}
