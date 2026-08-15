import { useEffect, useState } from 'react';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';

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
    <div className={tw.adminView}>
      <section className={tw.adminSection}>
        <h3 className={tw.adminSectionTitle}>Masthead &amp; legal</h3>
        <p className={tw.adminSectionDesc}>Shown on /masthead. One staff member per line: Name | Role | email</p>
        <input className={tw.formInput} value={heading} onChange={(e) => setHeading(e.target.value)} />
        <textarea className="min-h-[120px] w-full my-3 p-3 border border-line bg-bg-elevated text-ink" value={body} onChange={(e) => setBody(e.target.value)} />
        <textarea
          className="min-h-[140px] w-full mb-3 p-3 border border-line bg-bg-elevated text-ink"
          value={staffText}
          onChange={(e) => setStaffText(e.target.value)}
        />
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
          Save masthead
        </button>
        {hint ? <p className={tw.formHintSuccess}>{hint}</p> : null}
      </section>
    </div>
  );
}
