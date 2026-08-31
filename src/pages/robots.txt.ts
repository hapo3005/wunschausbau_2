import legal from '../data/legal.json';

export const prerender = true;

export function GET() {
  const site = import.meta.env.SITE || 'https://wunschausbau.de';
  const isPreview = site.includes('hapo3005.github.io');
  const launchApproved = legal.launchApproved === true;

  const body = (isPreview || !launchApproved)
    ? 'User-agent: *\nDisallow: /\n'
    : 'User-agent: *\nAllow: /\n\nSitemap: https://wunschausbau.de/sitemap-index.xml\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
