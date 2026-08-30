import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const baseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  categories: z.array(z.string()).nullable().transform((value) => value ?? []).default([]),
  tags: z.array(z.string()).nullable().transform((value) => value ?? []).default([]),
  slug: z.string().optional(),
  originalSlug: z.string().optional(),
  cover: z.string().optional(),
  originalCover: z.string().url().optional(),
  hero: z.string().optional(),
  textTone: z.enum(['light', 'dark', 'auto']).optional(),
  toc: z.union([
    z.boolean(),
    z.object({ enabled: z.boolean().default(true), position: z.enum(['left', 'right']).default('right') })
  ]).default(true),
  comments: z.boolean().default(false),
  webmention: z.boolean().default(false),
  math: z.boolean().default(false),
  mermaid: z.boolean().default(false)
});

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: baseSchema
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
  schema: baseSchema
});

export const collections = { posts, pages };
