// Frontend image proxy for article OG images.
// Keeps the image fetching in the same Vercel deployment as og.js so
// the backend is already warming up by the time this function runs.
// ESM format (package.json has "type": "module")

const API_BASE = 'https://theplatformserver.vercel.app/api';

export default async function handler(req, res) {
  // Extract article id from ?id=<24-char hex>
  let id = '';
  try {
    const url = new URL(req.url, 'http://localhost');
    id = (url.searchParams.get('id') || '').trim();
  } catch { /* ignore */ }

  const defaultImageUrl = `${API_BASE}/og-default-image`;

  if (!id || !/^[a-f0-9]{24}$/i.test(id)) {
    return res
      .setHeader('Location', defaultImageUrl)
      .setHeader('Cache-Control', 'public, s-maxage=3600')
      .status(302)
      .send('');
  }

  try {
    // Longer timeout (12 s) – the crawler fetches images separately and
    // allows more time than for the initial HTML page request.
    const ac    = new AbortController();
    const timer = setTimeout(() => ac.abort(), 12000);
    const resp  = await fetch(`${API_BASE}/articles/${id}/og-image`, { signal: ac.signal });
    clearTimeout(timer);

    if (!resp.ok) throw new Error(`Backend returned ${resp.status}`);

    const buf         = Buffer.from(await resp.arrayBuffer());
    const contentType = resp.headers.get('content-type') || 'image/jpeg';

    return res
      .setHeader('Content-Type', contentType)
      // Cache for 24 hours at CDN edge; serve stale for 7 days while revalidating
      .setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
      .send(buf);

  } catch {
    // Forward to the default image on any failure
    return res
      .setHeader('Location', defaultImageUrl)
      .setHeader('Cache-Control', 'public, s-maxage=60')
      .status(302)
      .send('');
  }
}
