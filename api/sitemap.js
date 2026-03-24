export default async function handler(req, res) {
  try {
    const response = await fetch('https://theplatformserver.vercel.app/api/sitemap.xml');
    const xml = await response.text();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.status(200).send(xml);
  } catch {
    res.status(500).send('Error fetching sitemap');
  }
}
