// Vercel Serverless Function – Dynamic OG / social-media preview tags
// ESM format (package.json has "type": "module")

const API_BASE  = 'https://theplatformserver.vercel.app/api';
const SITE_URL  = 'https://www.thepeoplesplatform.online';
const SITE_NAME = "The People's Platform";
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

  <!-- Instant redirect for any human visitor who lands here -->
  <meta http-equiv="refresh" content="0; url=${esc(redirectUrl)}"/>

  <!-- Open Graph – Facebook, WhatsApp, LinkedIn, Telegram, etc. -->
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

  <!-- Twitter / X Card -->
  <meta name="twitter:card"            content="summary_large_image"/>
  <meta name="twitter:title"           content="${esc(title)}"/>
  <meta name="twitter:description"     content="${esc(description)}"/>
  <meta name="twitter:image"           content="${esc(image)}"/>
  <meta name="twitter:image:alt"       content="${esc(title)}"/>
  <meta name="twitter:site"            content="@thepeoplesplatform"/>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
  <p>Redirecting… <a href="${esc(redirectUrl)}">Click here if not redirected</a>.</p>
</body>
</html>`;
}

export default async function handler(req, res) {
  // Parse ?path= from the rewritten URL
  let pathStr = '';
  try {
    const url = new URL(req.url, 'http://localhost');
    const raw = url.searchParams.get('path') || '';
    pathStr = raw.replace(/^\/+/, '');
  } catch {
    pathStr = '';
  }

  const pageUrl     = pathStr ? `${SITE_URL}/${pathStr}` : SITE_URL;
  const redirectUrl = pageUrl;

  // Safety net: if a real browser somehow reaches this endpoint (vercel.json
  // should prevent it), send a 302 redirect straight to the React SPA.
  const ua = req.headers['user-agent'] || '';
  if (!CRAWLER_RE.test(ua)) {
    return res
      .setHeader('Location', redirectUrl)
      .setHeader('Cache-Control', 'no-store')
      .status(302)
      .send('');
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

  try {
    const resp = await fetch(`${API_BASE}/articles/${articleId}/og`);
    if (!resp.ok) throw new Error('not found');
    const data = await resp.json();

    const title       = data.title || SITE_NAME;
    const description = data.description || `Read "${title}" on ${SITE_NAME}`;
    const image       = data.hasImage
      ? `${API_BASE}/articles/${articleId}/og-image`
      : `${API_BASE}/og-default-image`;

    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
      .send(buildHTML({ title, description, image, url: pageUrl, redirectUrl }));

  } catch {
    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'public, s-maxage=60')
      .send(buildHTML({ ...defaultMeta, url: pageUrl, redirectUrl }));
  }
}
