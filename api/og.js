// Vercel Serverless Function – Dynamic OG / social-media preview tags
// ESM format (package.json has "type": "module")

const API_BASE   = 'https://theplatformserver.vercel.app/api';
const SITE_URL   = 'https://www.thepeoplesplatform.online';
const SITE_NAME  = "The People's Platform";
const SITE_SLOGAN = 'Empowering voices';

// Patterns that identify social-media / search crawlers
const CRAWLER_RE = /bot|crawl|spider|facebookexternalhit|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|applebot|vkshare|googlebot|bingbot|yandex|duckduckbot|baiduspider|ahrefsbot|semrushbot|proximic|ia_archiver/i;

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHTML({ title, description, image, url, redirectUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}"/>
  <link rel="canonical" href="${esc(url)}"/>
  <meta http-equiv="refresh" content="0; url=${esc(redirectUrl)}"/>

  <!-- Open Graph – Facebook, WhatsApp, LinkedIn, Telegram, Messenger -->
  <meta property="og:type"             content="article"/>
  <meta property="og:title"            content="${esc(title)}"/>
  <meta property="og:description"      content="${esc(description)}"/>
  <meta property="og:image"            content="${esc(image)}"/>
  <meta property="og:image:secure_url" content="${esc(image)}"/>
  <meta property="og:image:type"       content="image/jpeg"/>
  <meta property="og:image:width"      content="1200"/>
  <meta property="og:image:height"     content="630"/>
  <meta property="og:image:alt"        content="${esc(title)}"/>
  <meta property="og:url"              content="${esc(url)}"/>
  <meta property="og:site_name"        content="${esc(SITE_NAME)}"/>
  <meta property="og:locale"           content="en_NG"/>
  <meta property="article:author"      content="${esc(SITE_NAME)}"/>
  <meta property="article:published_time" content="${new Date().toISOString()}"/>

  <!-- Twitter / X Card -->
  <meta name="twitter:card"            content="summary_large_image"/>
  <meta name="twitter:title"           content="${esc(title)}"/>
  <meta name="twitter:description"     content="${esc(description)}"/>
  <meta name="twitter:image"           content="${esc(image)}"/>
  <meta name="twitter:image:alt"       content="${esc(title)}"/>
  <meta name="twitter:site"            content="@thepeoplesplatform"/>
  <meta name="twitter:creator"         content="@thepeoplesplatform"/>

  <!-- WhatsApp / Messenger / Discord -->
  <meta name="theme-color"             content="#008751"/>
  <meta property="og:video"            content="${esc(image)}"/>
  <meta property="og:video:secure_url" content="${esc(image)}"/>
  <meta property="og:video:type"       content="image/jpeg"/>
  <meta property="og:video:width"      content="1200"/>
  <meta property="og:video:height"     content="630"/>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
  <p><a href="${esc(redirectUrl)}">Read on The People's Platform</a></p>
  <img src="${esc(image)}" alt="${esc(title)}" style="max-width:100%;"/>
</body>
</html>`;
}

export default async function handler(req, res) {
  // Parse ?path= param
  let pathStr = '';
  try {
    const url = new URL(req.url, 'http://localhost');
    pathStr = (url.searchParams.get('path') || '').replace(/^\/+/, '');
  } catch { pathStr = ''; }

  const pageUrl     = pathStr ? `${SITE_URL}/${pathStr}` : SITE_URL;
  const redirectUrl = pageUrl;

  // Safety net: real browser → 302 straight to the SPA
  const ua = req.headers['user-agent'] || '';
  if (!CRAWLER_RE.test(ua)) {
    return res.setHeader('Location', redirectUrl).setHeader('Cache-Control', 'no-store').status(302).send('');
  }

  const defaultMeta = {
    title:       `${SITE_NAME} - ${SITE_SLOGAN}`,
    description: 'Reinventing news reporting without bias.',
    image:       `${API_BASE}/og-default-image`,
    url:         SITE_URL,
    redirectUrl: SITE_URL,
  };

  // Match /article/<24-char hex id>
  const match = pathStr.match(/^article\/([a-f0-9]{24})/i);
  if (!match) {
    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'public, s-maxage=3600')
      .send(buildHTML(defaultMeta));
  }

  const articleId = match[1];
  // Point og:image at the FRONTEND proxy (/api/og-img) rather than the
  // backend directly. The proxy runs in the same Vercel deployment with a
  // 12-second timeout and aggressively caches the result at CDN edge.
  const articleImage = `${SITE_URL}/api/og-img?id=${articleId}`;

  // Pre-warm the backend image endpoint in parallel with the metadata fetch.
  // This way the backend is already handling a request by the time the crawler
  // separately fetches the og:image URL.
  fetch(`${API_BASE}/articles/${articleId}/og-image`, {
    signal: AbortSignal.timeout(5000)
  }).catch(() => {});

  try {
    // 4-second timeout – WhatsApp/Facebook crawlers abort quickly
    const ac    = new AbortController();
    const timer = setTimeout(() => ac.abort(), 4000);
    const resp  = await fetch(`${API_BASE}/articles/${articleId}/og`, { signal: ac.signal });
    clearTimeout(timer);

    if (!resp.ok) throw new Error('not found');
    const data = await resp.json();

    const title       = data.title || SITE_NAME;
    const description = data.description
      ? data.description.slice(0, 350)
      : `Read "${title}" on ${SITE_NAME}`;
    const image = data.hasImage ? articleImage : `${API_BASE}/og-default-image`;

    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
      .send(buildHTML({ title, description, image, url: pageUrl, redirectUrl }));

  } catch {
    // Metadata fetch failed / timed out.
    // Still serve the article image so the platform at least shows a photo.
    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'public, s-maxage=30')
      .send(buildHTML({
        title:       SITE_NAME,
        description: 'Read this article on The People\'s Platform',
        image:       articleImage,   // ← article-specific image, not the green default!
        url:         pageUrl,
        redirectUrl,
      }));
  }
}
