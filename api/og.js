// Vercel Serverless Function: Dynamic OG tags for social media link previews
const API_BASE = 'https://theplatformserver.vercel.app/api';
const SITE_URL = 'https://www.thepeoplesplatform.online';
const SITE_NAME = "The People's Platform";
const SITE_SLOGAN = 'Empowering voices';

export default async function handler(req, res) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : path || '';

  // Match /article/:id or /article/:id/slug
  const match = pathStr.match(/^article\/([a-f0-9]{24})/i);
  if (!match) {
    // Not an article URL — serve default OG for homepage
    return res.setHeader('Content-Type', 'text/html; charset=utf-8').send(buildHTML({
      title: `${SITE_NAME} - ${SITE_SLOGAN}`,
      description: 'Your trusted source for Nigerian news and beyond. Empowering voices.',
      image: `${SITE_URL}/og-default.png`,
      url: SITE_URL
    }));
  }

  const articleId = match[1];
  try {
    const resp = await fetch(`${API_BASE}/articles/${articleId}/og`);
    if (!resp.ok) throw new Error('Not found');
    const data = await resp.json();

    const title = data.title || SITE_NAME;
    const description = data.description || '';
    const imageUrl = data.hasImage ? `${API_BASE}/articles/${articleId}/og-image` : `${SITE_URL}/og-default.png`;
    const articleUrl = `${SITE_URL}/${pathStr}`;

    return res.setHeader('Content-Type', 'text/html; charset=utf-8').send(buildHTML({
      title, description, image: imageUrl, url: articleUrl
    }));
  } catch {
    // Fallback to default
    return res.setHeader('Content-Type', 'text/html; charset=utf-8').send(buildHTML({
      title: `${SITE_NAME} - ${SITE_SLOGAN}`,
      description: 'Your trusted source for Nigerian news and beyond. Empowering voices.',
      image: `${SITE_URL}/og-default.png`,
      url: `${SITE_URL}/${pathStr}`
    }));
  }
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildHTML({ title, description, image, url }) {
  // Return a small HTML page with OG tags + a JS redirect to the SPA
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(description)}"/>
  <meta property="og:image" content="${esc(image)}"/>
  <meta property="og:url" content="${esc(url)}"/>
  <meta property="og:site_name" content="${esc(SITE_NAME)}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(description)}"/>
  <meta name="twitter:image" content="${esc(image)}"/>
  <script>window.location.replace("${esc(url)}");</script>
</head>
<body></body>
</html>`;
}
