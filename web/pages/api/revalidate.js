export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const secret = req.body && req.body.secret;
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid revalidation secret' });
  }

  try {
    await res.revalidate('/');
    await res.revalidate('/archives');
    return res.json({ revalidated: true });
  } catch (err) {
    console.error('Revalidate failed', err);
    return res.status(500).json({ message: 'Revalidation failed' });
  }
}
