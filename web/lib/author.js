/**
 * Author helpers - post brand byline (logo instead of username text).
 * Site header/footer brand is separate and never controlled by these fields.
 */

export const WIREFRINGE_LOGO = '/wirefringe.png';
export const WIREFRINGE_AVATAR = '/static/uploads/wirefringe-avatar.png';

function compact(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isBrandBylineAuthor(post) {
  if (!post) return false;
  if (post.creatorBrandByline === true || post.creatorBrandByline === 'true') return true;
  if (post.creatorBrandByline === false || post.creatorBrandByline === 'false') return false;
  return isWirefringeAuthor(post);
}

export function isWirefringeAuthor(source) {
  if (!source) return false;
  if (typeof source === 'string') return compact(source).includes('wirefringe');
  const parts = [source.creator, source.creatorName, source.username, source.displayName, source.name];
  return parts.some((p) => compact(p).includes('wirefringe'));
}

export function authorDisplayName(post, fallback = 'Staff') {
  const name = String(post?.creatorName || post?.creator || fallback || '').trim();
  return name || fallback;
}

export function brandLogoUrl(post) {
  const fromApi = String(post?.creatorBrandLogoUrl || '').trim();
  if (fromApi) return fromApi;
  if (isWirefringeAuthor(post)) return WIREFRINGE_LOGO;
  return '';
}

export function authorAvatarUrl(post) {
  return String(post?.creatorAvatarUrl || '').trim();
}