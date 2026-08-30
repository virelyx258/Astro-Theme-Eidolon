export type ThemeMode = 'auto' | 'light' | 'sunset' | 'dark';
export type BannerTextTone = 'light' | 'dark' | 'auto';

export interface LinkItem {
  label: string;
  href: string;
  external: boolean;
}

type CommentsConfig =
  | { provider: 'none' }
  | { provider: 'twikoo'; envId: string; region?: 'cn' | 'ap' | 'us'; lang?: string; path?: string };

type SearchConfig =
  | { provider: 'none' }
  | { provider: 'pagefind'; placeholder: string };

export interface WebmentionConfig {
  enabled: boolean;
  endpoint: string;
  form?: boolean;
}

export type ToolbarIcon = 'search' | 'rss' | 'settings' | 'link' | 'tram-front';

export type ToolbarItem =
  | { type: 'search'; icon: 'search'; name: string }
  | { type: 'settings'; icon: 'settings'; name: string }
  | { type: 'rss'; icon: 'rss'; name: string; href: string; external?: boolean }
  | { type: 'link'; icon: ToolbarIcon; name: string; href: string; external?: boolean };

export interface SiteConfig {
  site: {
    title: string;
    description: string;
    author: {
      name: string;
      avatar: string;
      bio: string;
      rotateAvatar?: boolean;
    };
    locale: string;
    url: string;
    favicon: string;
  };
  navigation: LinkItem[];
  appearance: {
    defaultTheme: ThemeMode;
    accentColor: `#${string}`;
  };
  banner: {
    enabled: boolean;
    title: string;
    subtitle: string;
    image?: string;
    position: string;
    desktopHeightVh: number;
    mobileHeightVh: number;
    overlay: number;
    textTone?: BannerTextTone;
  };
  cards: {
    defaultCovers: string[];
  };
  archives: {
    tagLimit: number;
  };
  footer: {
    copyright?: string;
    note?: string;
    theme?: LinkItem;
    links: LinkItem[];
  };
  comments: CommentsConfig;
  webmentions: WebmentionConfig;
  search: SearchConfig;
  pjax: {
    enabled: boolean;
  };
  toolbarItems: ToolbarItem[];
}
