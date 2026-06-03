export default async function handler(req, res) {
  // Check for secret to confirm this is a valid request
  const { secret } = req.body;

  if (secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid revalidation secret' });
  }

  try {
    // This should be the actual path we want to revalidate
    // Revalidating the homepage to show the new post
    await res.revalidate('/');
    
    // We could also revalidate category pages if needed, e.g.:
    // await res.revalidate('/category/tech');
    
    return res.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error revalidating: ' + err.message);
  }
}
