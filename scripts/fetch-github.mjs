import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = process.cwd();
const cacheDir = join(root, '.astro-cache');
const cachePath = process.env.GITHUB_CACHE_PATH ? join(root, process.env.GITHUB_CACHE_PATH) : join(cacheDir, 'github.json');
const contentDir = join(root, 'src', 'content');
const ttlMs = Number(process.env.GITHUB_CACHE_TTL_MS ?? 24 * 60 * 60 * 1000);
const timeoutMs = Number(process.env.GITHUB_API_TIMEOUT_MS ?? 8000);
const validRepository = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38})\/[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,99})$/;

async function contentFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await contentFiles(path));
    else if (/\.(md|mdx)$/i.test(entry.name)) files.push(path);
  }
  return files;
}

function repositoriesFrom(source) {
  const repositories = [];
  let fence = null;
  for (const line of source.matchAll(/^[^\n]*(?:\n|$)/gm)) {
    const text = line[0].trim();
    const fenceMatch = text.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    const tag = text.match(/^\[github\b([^\]]*)/i);
    const value = tag?.[1].match(/(?:^|\s)(?:repo|repository)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/i);
    const repository = value?.[1] ?? value?.[2] ?? value?.[3];
    if (repository && validRepository.test(repository.trim())) repositories.push(repository.trim().toLowerCase());
  }
  return repositories;
}

async function readCache() {
  try {
    const cache = JSON.parse(await readFile(cachePath, 'utf8'));
    return cache?.repositories && typeof cache.repositories === 'object' ? cache : { repositories: {} };
  } catch (error) {
    if (error?.code !== 'ENOENT') console.warn('[github] Could not read .astro-cache/github.json; rebuilding it.');
    return { repositories: {} };
  }
}

async function fetchRepository(repository) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'mirages-astro-build' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}`, { headers, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.private) throw new Error('private repositories are not supported');
    if (typeof data.stargazers_count !== 'number' || typeof data.forks_count !== 'number' || typeof data.html_url !== 'string') throw new Error('unexpected API response');
    return {
      stars: String(data.stargazers_count),
      forks: String(data.forks_count),
      description: typeof data.description === 'string' ? data.description : '',
      commitDate: typeof data.pushed_at === 'string' ? data.pushed_at : '',
      htmlUrl: data.html_url,
      defaultBranch: typeof data.default_branch === 'string' && data.default_branch ? data.default_branch : 'main',
      fetchedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(timeout);
  }
}

const repositories = new Set();
for (const file of await contentFiles(contentDir)) {
  for (const repository of repositoriesFrom(await readFile(file, 'utf8'))) repositories.add(repository);
}

const cache = await readCache();
const now = Date.now();
let successful = 0;
for (const repository of repositories) {
  const cached = cache.repositories[repository];
  if (cached?.fetchedAt && now - Date.parse(cached.fetchedAt) < ttlMs) continue;
  try {
    cache.repositories[repository] = await fetchRepository(repository);
    successful += 1;
    console.log(`[github] fetched ${repository}`);
  } catch (error) {
    console.warn(`[github] ${repository}: ${error instanceof Error ? error.message : 'request failed'}; using ${cached ? 'cached data' : 'fallback values'}.`);
  }
}

await mkdir(dirname(cachePath), { recursive: true });
await writeFile(cachePath, `${JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), repositories: cache.repositories }, null, 2)}\n`);
await rm(join(root, '.astro'), { recursive: true, force: true });
console.log(`[github] cache ${cachePath} (${successful} request${successful === 1 ? '' : 's'}, ${repositories.size} repos)`);
