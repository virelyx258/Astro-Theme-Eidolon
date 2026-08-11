import { rm } from 'node:fs/promises';

await Promise.all([
  rm('dist', { recursive: true, force: true }),
  rm('.astro', { recursive: true, force: true }),
  rm('node_modules/.astro', { recursive: true, force: true })
]);
