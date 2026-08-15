import PostPage, { getServerSideProps as postGssp } from '../post';
import { api } from '../../lib/api';

export async function getServerSideProps(ctx) {
  const result = await postGssp(ctx);
  if (result?.props?.initialPost || result?.notFound) return result;
  const slug = ctx.params?.slug;
  if (!slug) return result;
  try {
    const path = `/post/${encodeURIComponent(String(slug))}`;
    const dest = await api(`/api/redirect?path=${encodeURIComponent(path)}`);
    if (dest?.to) {
      return { redirect: { destination: dest.to, permanent: true } };
    }
  } catch {
    /* no redirect */
  }
  return result;
}

export default PostPage;
