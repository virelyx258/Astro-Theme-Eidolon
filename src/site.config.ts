import type { SiteConfig } from './types/config';

export const siteConfig: SiteConfig = {
  site: {
    title: 'Eidolon',
    description: '一款轻量、简洁且美观的 Astro 主题',
    author: {
      name: 'Eidolon',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=85',
      bio: '一款轻量、简洁且美观的 Astro 主题',
      rotateAvatar: true
    },
    locale: 'zh-CN',
    url: 'https://www.luming.cool',
    favicon: 'https://image.luming.cool/i/2026/05/10/6a001b4129893.png'
  },
  navigation: [
    { label: '首页', href: '/', external: false },
    { label: '归档', href: '/archives/', external: false },
    { label: '友人', href: '/links/', external: false },
    { label: '关于', href: '/about/', external: false }
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
    title: 'Eidolon',
    subtitle: '一款轻量、简洁且美观的 Astro 主题',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=85',
    position: 'center center',
    desktopHeightVh: 55,
    mobileHeightVh: 40,
    overlay: 0.25,
    textTone: 'auto'
  },
  cards: {
    defaultCovers: ['https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80']
  },
  archives: {
    tagLimit: 30
  },
  footer: {
    copyright: `© 2023-${new Date().getFullYear()} 你的名字`, // 记得把"你的名字"改成你自己的名字。
    // 外链（如果有）
    links: [
      { label: 'BlogsClub', href: 'https://blogs.club', external: true }
    ]
  },
  // 评论系统采用 Twikoo，请自行部署云函数后，并在下方填写你的云函数 URL
  comments: {
    provider: 'twikoo',
    envId: 'https://link.to.your.twikoo.service/',
    region: 'cn',
    lang: 'zh-CN'
  },
  // WebMention 采用 webmentiond 自托管，请将 endpoint 换成你的接收端地址
  webmentions: {
    enabled: true,
    endpoint: 'https://webmention.example.com',
    form: true
  },
  // 搜索服务默认使用 PageFind，无需理会
  search: { provider: 'pagefind', placeholder: '搜索文章' },
  // 这是顶栏右上角及侧栏底部的工具按钮，可自定义。下方示例已涵盖了站内功能、RSS 复制、外链跳转等场景。
  toolbarItems: [
    { type: 'search', icon: 'search', name: '搜索文章' },
    { type: 'rss', icon: 'rss', name: 'RSS 订阅', href: '/rss.xml' },
    { type: 'settings', icon: 'settings', name: '阅读设置' }
  ]
};
