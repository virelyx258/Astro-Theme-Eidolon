import type { SiteConfig } from './types/config';

export const siteConfig: SiteConfig = {
  site: {
    title: '路明笔记',
    description: '一名高中生的技术与生活博客',
    author: {
      name: 'RiseForever',
      avatar: 'https://weavatar.com/avatar/302380667bdaf4e1390800e62494d4af?s=512&r=G',
      bio: '不慌张，不绝望，不狂妄，不投降。',
      rotateAvatar: true
    },
    locale: 'zh-CN',
    url: 'https://www.luming.cool',
    favicon: 'https://image.luming.cool/i/2026/05/10/6a001b4129893.png'
  },
  navigation: [
    { label: '首页', href: '/', external: false },
    { label: '归档', href: '/archives/', external: false },
    { label: '测试页面', href: '/test-page/', external: false }
  ],
  pjax: {
    enabled: true
  },
  appearance: {
    defaultTheme: 'auto',
    accentColor: '#1abc9c'
  },
  banner: {
    enabled: true,
    title: '路明笔记',
    subtitle: '一名高中生的技术与生活博客',
    image: 'https://image.luming.cool/i/2026/07/26/6a6628967fe03.webp',
    position: 'center center',
    desktopHeightVh: 55,
    mobileHeightVh: 40,
    overlay: 0.25,
    textTone: 'auto'
  },
  cards: {
    defaultCovers: ['https://image.luming.cool/i/2026/08/03/6a6f79cc091ac.webp']
  },
  archives: {
    tagLimit: 30
  },
  footer: {
    copyright: `© 2023-${new Date().getFullYear()} RiseForever`,
    links: [
      { label: 'BlogsClub', href: 'https://blogs.quest/luming', external: true },
      { label: '笔墨迹', href: 'https://blogscn.fun/blogs/01k7zk4mhndsr6atqd1wm11f7b', external: true },
      { label: '十年之约', href: 'https://www.foreverblog.cn/blog/6506.html', external: true },
      { label: '博友圈', href: 'https://www.boyouquan.com/blogs/luming.cool', external: true },
      { label: '好站网', href: 'https://haozhan.wang/site_detail.php?id=176', external: true },
      { label: '集博栈', href: 'https://www.heyblog.net/site/019eff04-b025-76c9-b8f2-388deb7195cd', external: true },
      { label: '博客大联盟', href: 'https://bo.ke/luming.cool/', external: true }
    ]
  },
  comments: {
    provider: 'twikoo',
    envId: 'https://twokii.luming.cool/',
    region: 'cn',
    lang: 'zh-CN'
  },
  search: { provider: 'pagefind', placeholder: '搜索文章' },
  toolbarItems: [
    { type: 'search', icon: 'search', name: '搜索文章' },
    { type: 'rss', icon: 'rss', name: 'RSS 订阅', href: '/rss.xml' },
    { type: 'link', icon: 'tram-front', name: '开往', href: 'https://www.travellings.cn/plain.html', external: true },
    { type: 'settings', icon: 'settings', name: '阅读设置' }
  ]
};
