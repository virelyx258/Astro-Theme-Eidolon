import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import shortcodes from './src/lib/shortcodes.ts';
import externalLinks from './src/lib/external-links.ts';
import responsiveTables from './src/lib/responsive-tables.ts';
import noticeShortcode from './src/lib/notice-shortcode.ts';
import { siteConfig } from './src/site.config.ts';
import { copyFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootGif = resolve(process.cwd(), '88x31.gif');

const copyRootGif = {
  name: 'copy-root-gif',
  hooks: {
    'astro:build:done': ({ dir }) => {
      copyFileSync(rootGif, resolve(fileURLToPath(dir), '88x31.gif'));
    }
  }
};

let githubData = {};
try {
  const githubCachePath = resolve(process.cwd(), process.env.GITHUB_CACHE_PATH ?? '.astro-cache/github.json');
  githubData = JSON.parse(readFileSync(githubCachePath, 'utf8')).repositories ?? {};
} catch {
  // The build script creates this cache before Astro loads the config.
}

export default defineConfig({
  site: siteConfig.site.url,
  integrations: [sitemap(), copyRootGif],
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
      rehypePlugins: [rehypeKatex, noticeShortcode, responsiveTables, [externalLinks, { siteUrl: siteConfig.site.url }]]
    })
  }
});
