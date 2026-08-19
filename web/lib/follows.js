function compact(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function splitFollows(follows) {
  const topics = new Set();
  const authors = new Set();
  for (const row of follows || []) {
    const target = String(row?.target || '').trim();
    if (!target) continue;
    if (row.kind === 'topic') {
      topics.add(target.toLowerCase());
      topics.add(compact(target));
    } else if (row.kind === 'author') {
      authors.add(target.toLowerCase());
      authors.add(compact(target));
    }
  }
  return { topics, authors };
}

export function postMatchesFollows(post, follows) {
  if (!post || !follows?.length) return false;
  const { topics, authors } = splitFollows(follows);
  const bucket = String(post.bucket || '').trim();
  if (bucket && (topics.has(bucket.toLowerCase()) || topics.has(compact(bucket)))) {
    return true;
  }
  for (const name of [post.creator, post.creatorName]) {
    const value = String(name || '').trim();
    if (value && (authors.has(value.toLowerCase()) || authors.has(compact(value)))) {
      return true;
    }
  }
  return false;
}
