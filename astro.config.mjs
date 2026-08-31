import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const isProductionLaunch = process.env.PRODUCTION_LAUNCH === 'true';
const isGitHubPages =
  !isProductionLaunch &&
  process.env.GITHUB_ACTIONS === 'true' &&
  process.env.GITHUB_REPOSITORY === 'hapo3005/wunschausbau_2';

export default defineConfig({
  site: isGitHubPages ? 'https://hapo3005.github.io' : 'https://wunschausbau.de',
  base: isGitHubPages ? '/wunschausbau_2' : '/',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.endsWith('/danke/') &&
        !page.endsWith('/freigabe/') &&
        !page.endsWith('/agb/')
    })
  ],
  build: { inlineStylesheets: 'always' }
});
