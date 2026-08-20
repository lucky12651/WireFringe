import { useEffect, useState } from 'react';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';
import { formatDateShort } from '../../../lib/utils';
import { ScreenTitle, Notice } from '../wp/ScreenTitle';

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
    <div className="wp-wrap">
      <ScreenTitle title="Newsletter" />
      {hint ? <Notice type="success">{hint}</Notice> : null}
      <section className="postbox">
        <h2 className="hndle">Subscribers <span className="font-normal text-ink-secondary">({subs.length})</span></h2>
        <div className="inside">
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
        </div>
      </section>
      <section className="postbox">
        <h2 className="hndle">Archive a send</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row"><label htmlFor="nl-subject">Subject</label></th>
                <td>
                  <input id="nl-subject" className={tw.formInput + ' max-w-md'} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="nl-body">Body</label></th>
                <td>
                  <textarea id="nl-body" className={tw.formTextarea + ' max-w-xl'} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" />
                  <span className="description">Saves an issue in the archive. Configure SMTP later to email the list.</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="submit">
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
          </p>
          <table className="wp-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i.id}>
                  <td>{i.subject}</td>
                  <td>{formatDateShort(i.sentAt || i.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
