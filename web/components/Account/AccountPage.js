import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../Layout/Layout';
import Loader from '../Loader/Loader';
import { useAuth } from '../../hooks';
import { authApi, newsroomApi } from '../../lib/api';
import { postUrl } from '../../lib/utils';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'subscription', label: 'Newsletter' },
  { id: 'following', label: 'Following' },
  { id: 'notifications', label: 'Notification Settings' },
  { id: 'comments', label: 'Comments' },
];

function formatWhen(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AccountPage() {
  const router = useRouter();
  const auth = useAuth();
  const { me, isAuthed, isInitialLoading, logout, updateProfile, changePassword } = auth;

  const tab = useMemo(() => {
    const raw = router.query?.tab;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (TABS.some((t) => t.id === value)) return value;
    return 'profile';
  }, [router.query?.tab]);

  const [nameDraft, setNameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (signingOut) return;
    if (!isInitialLoading && !isAuthed) {
      router.replace('/login?next=/account');
    }
  }, [isAuthed, isInitialLoading, router, signingOut]);

  useEffect(() => {
    if (!me) return;
    setNameDraft(me.displayName || '');
    setEmailDraft(me.email || '');
  }, [me]);

  useEffect(() => {
    if (!isAuthed || tab !== 'comments') return;
    let cancelled = false;
    setCommentsLoading(true);
    authApi
      .myComments()
      .then((rows) => {
        if (!cancelled) setComments(rows || []);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthed, tab]);

  const goTab = (id) => {
    setStatus('');
    setError('');
    const href = id === 'profile' ? '/account' : `/account?tab=${id}`;
    router.replace(href, undefined, { shallow: true });
  };

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
    window.location.href = '/';
  };

  const saveName = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setStatus('');
    const result = await updateProfile({ displayName: nameDraft.trim() });
    setSaving(false);
    if (result.success) {
      setEditingName(false);
      setStatus('Commenting name saved.');
    } else {
      setError(result.error || 'Could not save name');
    }
  };

  const saveEmail = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setStatus('');
    const result = await updateProfile({ email: emailDraft.trim() });
    setSaving(false);
    if (result.success) {
      setEditingEmail(false);
      setStatus('Email saved.');
    } else {
      setError(result.error || 'Could not save email');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setStatus('');
    const result = await changePassword(currentPassword, newPassword);
    setSaving(false);
    if (result.success) {
      setResetOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setStatus('Password updated.');
    } else {
      setError(result.error || 'Could not update password');
    }
  };

  if (isInitialLoading || !isAuthed || !me) {
    return (
      <Layout title="Your Account – Wirefringe" showAdRails={false}>
        <div className="h-[50vh] flex items-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  const staff = me.role && me.role !== 'user';

  return (
    <Layout title="Your Account – Wirefringe" showAdRails={false}>
      <div className="relative max-w-[920px] mx-auto pt-6 pb-24 px-1 md:px-2">
        <h1 className="relative font-display font-black text-[clamp(3.4rem,8vw,5.6rem)] leading-[0.88] tracking-[-0.045em] text-ink m-0 mb-14 pt-10">
          Your Account
        </h1>

        <div className="relative grid grid-cols-1 min-[760px]:grid-cols-[220px_minmax(0,1fr)] gap-10 min-[760px]:gap-16 items-start">
          <nav aria-label="Account">
            <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
              {TABS.map((item) => {
                const active = tab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => goTab(item.id)}
                      className="bg-transparent border-0 cursor-pointer p-0 text-left text-[15px] leading-snug"
                      style={{
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: active ? 700 : 400,
                        boxShadow: active ? 'inset 3px 0 0 currentColor' : 'none',
                        paddingLeft: active ? 10 : 13,
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
              {staff ? (
                <li>
                  <Link
                    href="/admin"
                    className="block text-[15px] text-ink-secondary no-underline pl-[13px] hover:text-ink"
                  >
                    Dashboard
                  </Link>
                </li>
              ) : null}
              <li className="pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-transparent border-0 cursor-pointer p-0 text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-tertiary pl-[13px] hover:text-ink"
                >
                  Log out
                </button>
              </li>
            </ul>
          </nav>

          <section className="min-w-0 max-w-[520px]">
            {error ? <p className="text-[#c0392b] text-sm m-0 mb-4">{error}</p> : null}
            {status ? <p className="text-[#0b8f72] text-sm m-0 mb-4">{status}</p> : null}

            {tab === 'profile' ? (
              <ProfileTab
                me={me}
                nameDraft={nameDraft}
                setNameDraft={setNameDraft}
                emailDraft={emailDraft}
                setEmailDraft={setEmailDraft}
                editingName={editingName}
                setEditingName={setEditingName}
                editingEmail={editingEmail}
                setEditingEmail={setEditingEmail}
                resetOpen={resetOpen}
                setResetOpen={setResetOpen}
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                saving={saving}
                onSaveName={saveName}
                onSaveEmail={saveEmail}
                onSavePassword={savePassword}
              />
            ) : null}

            {tab === 'subscription' ? <NewsletterTab /> : null}
            {tab === 'following' ? <FollowingTab /> : null}
            {tab === 'notifications' ? <NotifyTab me={me} /> : null}

            {tab === 'comments' ? (
              <CommentsTab comments={comments} loading={commentsLoading} />
            ) : null}
          </section>
        </div>
      </div>
    </Layout>
  );
}

function ProfileTab({
  me,
  nameDraft,
  setNameDraft,
  emailDraft,
  setEmailDraft,
  editingName,
  setEditingName,
  editingEmail,
  setEditingEmail,
  resetOpen,
  setResetOpen,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  saving,
  onSaveName,
  onSaveEmail,
  onSavePassword,
}) {
  const email = (me.email || '').trim();
  const commentingName = (me.displayName || '').trim();

  return (
    <>
      <h2 className="font-sans font-extrabold text-[34px] leading-none m-0 mb-7 text-ink">
        Hi there!
      </h2>

      <div className="mb-5">
        <p className="m-0 mb-1 text-[12px] text-ink-tertiary">Email</p>
        {editingEmail ? (
          <form onSubmit={onSaveEmail} className="flex flex-col gap-2 max-w-[360px]">
            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              className="h-10 px-2.5 border border-line bg-bg-elevated text-ink text-[15px] outline-none focus:border-mint"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="h-9 px-3 border border-mint bg-transparent text-mint text-[11px] font-semibold tracking-[0.1em] uppercase cursor-pointer hover:bg-mint/10"
              >
                {saving ? 'Saving…' : 'Save email'}
              </button>
              <button
                type="button"
                className="bg-transparent border-0 text-[12px] text-[#888] cursor-pointer"
                onClick={() => {
                  setEditingEmail(false);
                  setEmailDraft(email);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="m-0 text-[15px] text-ink">{email || 'No email'}</p>
        )}
      </div>

      {!editingEmail ? (
        <button
          type="button"
          className="h-9 px-3.5 mb-4 border border-mint bg-transparent text-mint text-[11px] font-semibold tracking-[0.12em] uppercase cursor-pointer hover:bg-mint/10"
          onClick={() => {
            setEditingEmail(true);
            setResetOpen(false);
          }}
        >
          Verify email
        </button>
      ) : null}

      <div className="mb-6">
        <button
          type="button"
          className="bg-transparent border-0 p-0 text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2 cursor-pointer text-mint hover:text-mint-hover"
          onClick={() => {
            setResetOpen((v) => !v);
            setEditingEmail(false);
          }}
        >
          Reset password
        </button>
        {resetOpen ? (
          <form onSubmit={onSavePassword} className="flex flex-col gap-2 mt-3 max-w-[360px]">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="h-10 px-2.5 border border-line bg-bg-elevated text-ink text-[15px] outline-none focus:border-mint"
              autoComplete="current-password"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="h-10 px-2.5 border border-line bg-bg-elevated text-ink text-[15px] outline-none focus:border-mint"
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={saving || !currentPassword || newPassword.length < 8}
              className="h-9 px-3 border border-mint bg-transparent text-mint text-[11px] font-semibold tracking-[0.1em] uppercase cursor-pointer hover:bg-mint/10 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Update password'}
            </button>
          </form>
        ) : null}
      </div>

      <div className="border-t border-line pt-6 mt-2">
        <p className="m-0 mb-1 text-[12px] text-ink-tertiary">commenting name</p>
        <div className="flex items-start justify-between gap-4">
          {editingName ? (
            <form onSubmit={onSaveName} className="flex-1 flex flex-col gap-2 max-w-[360px]">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={80}
                className="h-10 px-2.5 border border-line bg-bg-elevated text-ink text-[15px] outline-none focus:border-mint"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-3 border border-mint bg-transparent text-mint text-[11px] font-semibold tracking-[0.1em] uppercase cursor-pointer hover:bg-mint/10"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="bg-transparent border-0 text-[12px] text-[#888] cursor-pointer"
                  onClick={() => {
                    setEditingName(false);
                    setNameDraft(commentingName);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="m-0 text-[15px] italic text-ink">
              {commentingName || 'No commenting name'}
            </p>
          )}
          {!editingName ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 bg-transparent border-0 p-0 text-[14px] cursor-pointer shrink-0 text-mint hover:text-mint-hover"
              onClick={() => setEditingName(true)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

function CommentsTab({ comments, loading }) {
  return (
    <>
      <h2 className="font-sans font-extrabold text-[32px] leading-none m-0 mb-6 text-ink">
        Comments
      </h2>
      {loading ? (
        <p className="text-[15px] text-ink-secondary">Loading your comments…</p>
      ) : comments.length === 0 ? (
        <p className="m-0 text-[15px] leading-relaxed text-ink-secondary">
          You haven&apos;t commented on any stories yet. Open an article and join the conversation.
        </p>
      ) : (
        <ul className="list-none m-0 p-0">
          {comments.map((c) => (
            <li key={c.id} className="py-5 border-t border-line first:border-t-0 first:pt-0">
              <Link
                href={postUrl({ id: c.postId, title: c.postTitle })}
                className="block font-sans font-extrabold text-[17px] leading-snug text-ink no-underline hover:text-mint"
              >
                {c.postTitle || 'Untitled story'}
              </Link>
              <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-dek whitespace-pre-wrap">
                {c.comment}
              </p>
              <p className="m-0 mt-2 text-[12px] text-ink-tertiary">
                {formatWhen(c.createdAt)}
                {' · '}
                {c.approved ? 'Published' : 'Pending approval'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function NewsletterTab() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  return (
    <>
      <h2 className="font-sans font-extrabold text-[32px] leading-none m-0 mb-5 text-ink">
        Newsletter
      </h2>
      <p className="m-0 text-[15px] leading-relaxed text-ink-secondary">
        Wirefringe is free. Subscribe to the briefing — we store your address in the newsroom list.
        There is no paid billing yet.
      </p>
      <form
        className="flex gap-2 mt-5 max-w-[420px]"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await newsroomApi.subscribe(email.trim(), 'account');
            setStatus('You are on the list.');
          } catch (err) {
            setStatus(err.message || 'Could not subscribe.');
          }
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 h-11 px-3 border border-line bg-bg-elevated"
        />
        <button type="submit" className="h-11 px-4 bg-mint text-black border-0 font-semibold">
          Subscribe
        </button>
      </form>
      {status ? <p className="text-sm mt-3">{status}</p> : null}
    </>
  );
}

function FollowingTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    newsroomApi.follows().then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <>
      <h2 className="font-sans font-extrabold text-[32px] leading-none m-0 mb-5 text-ink">
        Following
      </h2>
      {rows.length ? (
        <ul className="list-none m-0 p-0">
          {rows.map((r) => (
            <li key={`${r.kind}-${r.target}`} className="py-3 border-b border-line flex justify-between">
              <span>
                <strong>{r.kind}</strong> · {r.target}
              </span>
              <button
                type="button"
                className="border-0 bg-transparent text-mint cursor-pointer"
                onClick={async () => {
                  await newsroomApi.unfollow(r.kind, r.target);
                  setRows((prev) => prev.filter((x) => !(x.kind === r.kind && x.target === r.target)));
                }}
              >
                Unfollow
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-secondary">You are not following anything yet. Use Follow on a story.</p>
      )}
      <Link href="/for-you" className="inline-block mt-5 text-mint">
        Open For You
      </Link>
    </>
  );
}

function NotifyTab({ me }) {
  const [replies, setReplies] = useState(me?.notifyReplies !== false);
  const [editorial, setEditorial] = useState(me?.notifyEditorial !== false);
  const [status, setStatus] = useState('');
  return (
    <>
      <h2 className="font-sans font-extrabold text-[32px] leading-none m-0 mb-5 text-ink">
        Notification Settings
      </h2>
      <label className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={replies} onChange={(e) => setReplies(e.target.checked)} />
        Email me about comment replies
      </label>
      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" checked={editorial} onChange={(e) => setEditorial(e.target.checked)} />
        Editorial / newsletter emails
      </label>
      <button
        type="button"
        className="h-10 px-4 bg-mint text-black border-0 font-semibold"
        onClick={async () => {
          await newsroomApi.saveNotify({ notifyReplies: replies, notifyEditorial: editorial });
          setStatus('Saved.');
        }}
      >
        Save
      </button>
      {status ? <p className="text-sm mt-3">{status}</p> : null}
    </>
  );
}
