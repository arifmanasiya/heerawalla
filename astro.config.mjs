import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE || 'https://heerawalla.com';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  integrations: [tailwind({ applyBaseStyles: false }), sitemap()],
  output: 'static',
});
