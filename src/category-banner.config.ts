import { siteConfig } from '@/site.config';
import type { BannerTextTone } from '@/types/config';

export interface TaxonomyBanner {
  image?: string;
  position?: string;
  title?: string;
  subtitle?: string;
  textTone?: BannerTextTone;
}

// Keys are taxonomy slugs, as returned by slugify().
export const categoryBanners = {
  '随笔': {
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=2000&q=85',
    position: 'center center',
    subtitle: '留住日常里值得重读的片段。'
  },
  '写作': {
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=2000&q=85',
    position: 'center center',
    subtitle: '把零散的念头整理成文字。'
  }
} satisfies Record<string, TaxonomyBanner>;

export const tagBanners = {
  '开始': {
    image: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=2000&q=85',
    position: 'center center'
  },
  '写作': {
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=2000&q=85',
    position: 'center center'
  }
} satisfies Record<string, TaxonomyBanner>;

export interface ResolvedTaxonomyBanner {
  title: string;
  subtitle: string;
  image?: string;
  position: string;
  textTone?: BannerTextTone;
}

export function resolveTaxonomyBanner(
  banners: Readonly<Record<string, TaxonomyBanner>>,
  slug: string,
  fallback: Pick<ResolvedTaxonomyBanner, 'title' | 'subtitle'>
): ResolvedTaxonomyBanner {
  const configured = Object.prototype.hasOwnProperty.call(banners, slug) ? banners[slug] : undefined;
  const defaultImage = siteConfig.cards.defaultCovers[0];

  return {
    title: configured?.title ?? fallback.title,
    subtitle: configured?.subtitle ?? fallback.subtitle,
    image: configured?.image ?? siteConfig.banner.image ?? defaultImage,
    position: configured?.position ?? siteConfig.banner.position,
    textTone: configured?.textTone ?? siteConfig.banner.textTone
  };
}
