import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import shortcodes from './src/lib/shortcodes.ts';
import externalLinks from './src/lib/external-links.ts';
import { siteConfig } from './src/site.config.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let githubData = {};
try {
  const githubCachePath = resolve(process.cwd(), process.env.GITHUB_CACHE_PATH ?? '.astro-cache/github.json');
  githubData = JSON.parse(readFileSync(githubCachePath, 'utf8')).repositories ?? {};
} catch {
  // The build script creates this cache before Astro loads the config.
}

export default defineConfig({
  site: siteConfig.site.url,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      defaultColor: false
    },
    processor: unified({
      remarkPlugins: [remarkMath, [shortcodes, { githubData, siteUrl: siteConfig.site.url }]],
      rehypePlugins: [rehypeKatex, [externalLinks, { siteUrl: siteConfig.site.url }]]
    })
  }
});
