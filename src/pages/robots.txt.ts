import legal from '../data/legal.json';
import release from '../data/release.json';

export const prerender = true;

export function GET() {
  const site = import.meta.env.SITE || 'https://wunschausbau.de';
  const isPreview = site.includes('hapo3005.github.io');
  const releaseReady = legal.launchApproved === true
    && release.serviceCatalogApproved === true
    && release.serviceAreaApproved === true
    && release.projectMediaApproved === true
    && release.smtpDeliveryTestPassed === true;

  const body = (isPreview || !releaseReady)
    ? 'User-agent: *\nDisallow: /\n'
    : 'User-agent: *\nAllow: /\n\nSitemap: https://wunschausbau.de/sitemap-index.xml\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
