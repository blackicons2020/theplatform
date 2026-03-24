// Vercel Edge Middleware: Route social media bots to OG serverless function
const BOT_PATTERN = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Googlebot|bingbot|Pinterestbot/i;

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);

  // Only intercept /article/* paths from social media bots
  if (url.pathname.startsWith('/article/') && BOT_PATTERN.test(ua)) {
    const ogUrl = new URL('/api/og', request.url);
    ogUrl.searchParams.set('path', url.pathname.slice(1)); // remove leading /
    return fetch(ogUrl);
  }

  // All other requests pass through normally
}

export const config = {
  matcher: '/article/:path*',
};
