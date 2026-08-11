import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;
export type TaxonomyItem = {
  name: string;
  count: number;
};

export const POSTS_PER_PAGE = 8;

export function getContentCacheKey(scope: string, entries: Array<{ id: string; body?: string; data: unknown; digest?: string | number }>): string {
  const fingerprints = entries
    .map((entry) => `${entry.id}:${entry.digest ?? JSON.stringify([entry.data, entry.body ?? ''])}`)
    .sort()
    .join('|');
  return `${scope}:${fingerprints}`;
}

export async function getPublicPosts(): Promise<PostEntry[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((left, right) => {
    const dateDifference = right.data.pubDate.getTime() - left.data.pubDate.getTime();
    return dateDifference || left.id.localeCompare(right.id);
  });
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function getPostPath(post: PostEntry): string {
  const source = post.id.replace(/\\/g, '/').replace(/\.(md|mdx)$/i, '');
  const slug = source.split('/').map(slugify).filter(Boolean).join('/');
  return `/posts/${slug}/`;
}

export function getPostCardImage(post: PostEntry, defaultCovers: readonly string[], siteUrl: string): string | undefined {
  if (post.data.cover) return post.data.cover;
  if (post.data.hero) return post.data.hero;

  const source = post.body ?? '';
  const markdownImage = /!\[[^\]]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g;
  const htmlImage = /<img\b[^>]*\bsrc\s*=\s*(?:["']([^"']+)["']|([^\s>]+))[^>]*>/gi;
  const markdownMatch = markdownImage.exec(source);
  const htmlMatch = htmlImage.exec(source);
  const firstMatch = !htmlMatch || (markdownMatch && markdownMatch.index < htmlMatch.index) ? markdownMatch : htmlMatch;
  const bodyImage = firstMatch?.[1] ?? firstMatch?.[2];

  if (bodyImage) {
    const base = new URL(getPostPath(post), siteUrl);
    const resolved = new URL(bodyImage, base);
    return resolved.origin === base.origin ? `${resolved.pathname}${resolved.search}${resolved.hash}` : resolved.href;
  }

  if (!defaultCovers.length) return undefined;
  let hash = 0;
  for (const character of post.id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return defaultCovers[hash % defaultCovers.length];
}

export function getExcerpt(post: PostEntry, length = 180): string {
  if (post.data.description) return post.data.description;
  const text = (post.body ?? '').replace(/```[\s\S]*?```/g, '').replace(/[#*_>`~\[\]()]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}

export function getPostTaxonomy(post: PostEntry): { categories: string[]; tags: string[] } {
  return {
    categories: [...new Set(post.data.categories)].sort((a, b) => a.localeCompare(b)),
    tags: [...new Set(post.data.tags)].sort((a, b) => a.localeCompare(b))
  };
}

export function deriveTaxonomy(
  posts: PostEntry[],
  field: 'categories' | 'tags'
): TaxonomyItem[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const name of new Set(post.data[field])) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getTaxonomyPosts(posts: PostEntry[], field: 'categories' | 'tags', slug: string): PostEntry[] {
  return posts.filter((post) => post.data[field].some((name) => slugify(name) === slug));
}

export function getArchiveYears(posts: PostEntry[]): Map<number, Map<number, PostEntry[]>> {
  const archives = new Map<number, Map<number, PostEntry[]>>();
  for (const post of posts) {
    const year = post.data.pubDate.getFullYear();
    const month = post.data.pubDate.getMonth() + 1;
    const months = archives.get(year) ?? new Map<number, PostEntry[]>();
    const entries = months.get(month) ?? [];
    entries.push(post);
    months.set(month, entries);
    archives.set(year, months);
  }
  return archives;
}
