export const SECTIONS = [
  { slug: 'tech', name: 'Tech', buckets: ['Tech', 'Gadgets'] },
  { slug: 'ai', name: 'AI', buckets: ['AI & Future Tech'] },
  { slug: 'business', name: 'Business', buckets: ['Business & Markets'] },
  { slug: 'finance', name: 'Finance', buckets: ['Personal Finance'] },
  { slug: 'india', name: 'India', buckets: ['India News'] },
  { slug: 'sports', name: 'Sports', buckets: ['Sports'] },
];

export function sectionForBucket(bucket) {
  const name = String(bucket || '');
  return SECTIONS.find((s) => s.buckets.includes(name)) || null;
}

export function sectionPath(bucketOrSlug) {
  const bySlug = SECTIONS.find((s) => s.slug === bucketOrSlug);
  if (bySlug) return `/section/${bySlug.slug}`;
  const byBucket = sectionForBucket(bucketOrSlug);
  return byBucket ? `/section/${byBucket.slug}` : '/';
}

export function authorPath(post) {
  if (post?.authorSlug) return `/author/${encodeURIComponent(post.authorSlug)}`;
  const name = post?.creatorName || post?.creator;
  if (!name) return '/';
  const slug = String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `/author/${encodeURIComponent(slug)}` : '/';
}
