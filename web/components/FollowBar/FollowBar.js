import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { fetcher, newsroomApi } from '../../lib/api';
import { useAuth } from '../../hooks';
import { cn } from '../../lib/utils';

function sameTarget(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function FollowButton({ label, followingLabel, following, busy, justDone, onClick }) {
  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={following}
      aria-busy={busy}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 h-10 px-3.5 rounded-md font-semibold text-[13.5px] cursor-pointer transition-all duration-200 disabled:cursor-wait',
        following
          ? 'border border-mint bg-mint/15 text-mint'
          : 'border-0 bg-mint text-black hover:-translate-y-px',
        justDone && 'scale-[1.03]',
        busy && 'opacity-70'
      )}
    >
      {following ? <CheckIcon /> : <PlusIcon />}
      {busy ? 'Saving…' : following ? followingLabel : label}
    </button>
  );
}

export default function FollowBar({ topic, author, loginNext }) {
  const router = useRouter();
  const { me } = useAuth();
  const { data: follows, mutate } = useSWR(me ? '/api/me/follows' : null, fetcher, {
    revalidateOnFocus: false,
  });

  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState('');
  const [toastOk, setToastOk] = useState(true);
  const [justDone, setJustDone] = useState(null);

  const topicTarget = (topic || '').trim();
  const authorTarget = (author || '').trim();

  const followingTopic = useMemo(
    () => (follows || []).some((f) => f.kind === 'topic' && sameTarget(f.target, topicTarget)),
    [follows, topicTarget]
  );
  const followingAuthor = useMemo(
    () => (follows || []).some((f) => f.kind === 'author' && sameTarget(f.target, authorTarget)),
    [follows, authorTarget]
  );

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!justDone) return undefined;
    const t = setTimeout(() => setJustDone(null), 450);
    return () => clearTimeout(t);
  }, [justDone]);

  const toggle = async (kind, target) => {
    if (!target) return;
    if (!me) {
      router.push(`/login?next=${encodeURIComponent(loginNext || router.asPath || '/')}`);
      return;
    }
    if (busy) return;

    const on = (follows || []).some((f) => f.kind === kind && sameTarget(f.target, target));
    const next = on
      ? (follows || []).filter((f) => !(f.kind === kind && sameTarget(f.target, target)))
      : [...(follows || []), { kind, target }];

    setBusy(kind);
    await mutate(next, false);
    try {
      if (on) await newsroomApi.unfollow(kind, target);
      else await newsroomApi.follow(kind, target);
      await mutate();
      setJustDone(kind);
      setToastOk(true);
      setToast(
        on
          ? `Unfollowed ${target}`
          : `Following ${target} — more like this will show in For You`
      );
    } catch (err) {
      await mutate();
      setToastOk(false);
      setToast(err?.message || 'Could not update follow. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const both = followingTopic && followingAuthor;
  const either = followingTopic || followingAuthor;

  return (
    <div className="bg-mint/10 border border-mint/20 text-ink rounded-[14px] px-7 py-[26px] mt-6 mb-2">
      <p className="m-0 mb-4 text-[15.5px] leading-relaxed">
        {both ? (
          <>
            <strong>You&apos;re following this topic and author.</strong> New stories will land in For You.
          </>
        ) : either ? (
          <>
            <strong>You&apos;re following {followingTopic ? topicTarget : authorTarget}.</strong>
            {topicTarget && authorTarget
              ? ` Follow ${followingTopic ? 'the author' : 'the topic'} too for a fuller For You feed.`
              : ' New stories will land in For You.'}
          </>
        ) : (
          <>
            <strong>
              {topicTarget && authorTarget
                ? 'Follow this topic or author'
                : authorTarget
                  ? 'Follow this author'
                  : 'Follow this topic'}
            </strong>{' '}
            to see more like it in For You.
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {topicTarget ? (
          <FollowButton
            label={`Follow ${topicTarget}`}
            followingLabel={`Following ${topicTarget}`}
            following={followingTopic}
            busy={busy === 'topic'}
            justDone={justDone === 'topic'}
            onClick={() => toggle('topic', topicTarget)}
          />
        ) : null}
        {authorTarget ? (
          <FollowButton
            label="Follow author"
            followingLabel={`Following ${authorTarget}`}
            following={followingAuthor}
            busy={busy === 'author'}
            justDone={justDone === 'author'}
            onClick={() => toggle('author', authorTarget)}
          />
        ) : null}
      </div>

      <p
        role="status"
        aria-live="polite"
        className={cn(
          'm-0 mt-3.5 text-[13px] font-semibold min-h-[1.2em] transition-opacity',
          toast ? 'opacity-100' : 'opacity-0',
          toastOk ? 'text-mint' : 'text-[#ff6b6b]'
        )}
      >
        {toast || '\u00a0'}
      </p>
    </div>
  );
}
