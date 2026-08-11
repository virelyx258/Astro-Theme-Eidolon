import rss from '@astrojs/rss';
import { siteConfig } from '@/site.config';
import { getExcerpt, getPostPath, getPublicPosts } from '@/lib/content';
import { renderMarkdown } from '@/lib/shortcodes';

export async function GET(context) {
  const posts = (await getPublicPosts()).slice(0, 10);
  return rss({
    title: siteConfig.site.title,
    description: siteConfig.site.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: getExcerpt(post),
      content: renderMarkdown(post.body ?? ''),
      pubDate: post.data.pubDate,
      link: getPostPath(post)
    }))
  });
}
