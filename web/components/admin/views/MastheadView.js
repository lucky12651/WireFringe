import { useEffect, useState } from 'react';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';
import { ScreenTitle, Notice } from '../wp/ScreenTitle';

export function MastheadView() {
  const [heading, setHeading] = useState('Masthead');
  const [body, setBody] = useState('');
  const [staffText, setStaffText] = useState('');
  const [hint, setHint] = useState('');

  useEffect(() => {
    newsroomApi.masthead().then((data) => {
      setHeading(data.heading || 'Masthead');
      setBody(data.body || '');
      setStaffText((data.staff || []).map((p) => [p.name, p.role, p.email].filter(Boolean).join(' | ')).join('\n'));
    });
  }, []);

  return (
    <div className="wp-wrap">
      <ScreenTitle title="Masthead" />
      {hint ? <Notice type="success">{hint}</Notice> : null}
      <section className="postbox">
        <h2 className="hndle">Masthead &amp; legal</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row"><label htmlFor="mh-heading">Heading</label></th>
                <td>
                  <input id="mh-heading" className={tw.formInput + ' max-w-md'} value={heading} onChange={(e) => setHeading(e.target.value)} />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="mh-body">Body</label></th>
                <td>
                  <textarea id="mh-body" className={tw.formTextarea + ' max-w-xl min-h-[120px]'} value={body} onChange={(e) => setBody(e.target.value)} />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="mh-staff">Staff</label></th>
                <td>
                  <textarea
                    id="mh-staff"
                    className={tw.formTextarea + ' max-w-xl min-h-[140px]'}
                    value={staffText}
                    onChange={(e) => setStaffText(e.target.value)}
                  />
                  <span className="description">One person per line: Name | Role | email</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="submit">
            <button
              type="button"
              className={tw.primaryBtn}
              onClick={async () => {
                const staff = staffText
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const [name, role, email] = line.split('|').map((s) => s.trim());
                    return { name, role, email };
                  });
                await newsroomApi.saveMasthead({ heading, body, staff });
                setHint('Saved.');
              }}
            >
              Save Changes
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
