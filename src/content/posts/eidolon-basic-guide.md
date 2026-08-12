---
title: "Eidolon 主题基本使用教程"
pubDate: "2026-08-13T00:25:27.180Z"
categories: ['主题']
tags: ['主题']
draft: false
---

欢迎使用 Eidolon，本文将带着您快速入手，使用 Eidolon 轻松定制您的个人博客。

---

## 站点基础信息

欲修改站点基础信息（如站点标题、Banner 大标题、副标题、背景图等），您需要编辑 `/src/site.config.ts`。

其中，`site`块代表站点总体配置。示例格式如下：

```ts
site: {
    title: 'Eidolon',
    description: '一款轻量、简洁且美观的 Astro 主题',
    author: {
      name: 'Eidolon',
      avatar: 'https://weavatar.com/avatar/302380667bdaf4e1390800e62494d4af?s=512&r=G',
      bio: '一款轻量、简洁且美观的 Astro 主题',
      rotateAvatar: true
    },
    locale: 'zh-CN',
    url: 'https://www.luming.cool',
    favicon: 'https://image.luming.cool/i/2026/05/10/6a001b4129893.png'
  },
```

每个字段的含义如下表：

|         字段         |                       含义                       |  类型  |
| :------------------: | :----------------------------------------------: | :----: |
|        title         |     站点名称，也作为显示在浏览器标签页的标题     | 文本型 |
|     description      |            站点简介，也用于 SEO 描述             | 文本型 |
|     author: name     |                     博主昵称                     | 文本型 |
|    author: avatar    |              博主头像，填写图片链接              | 文本型 |
|     author: bio      |                  博主的个性签名                  | 文本型 |
| author: rotateAvatar |          是否开启关于页面的头像旋转动画          | 布尔型 |
|        locale        |                     站点语言                     | 文本型 |
|         url          |                    站点的域名                    | 文本型 |
|       favicon        | 站点图标，同时作为浏览器标签页图标，填写图片链接 | 文本型 |

## 导航栏设置

`navigation`块代表导航项目。示例格式如下：

```ts
navigation: [
    { label: '首页', href: '/', external: false },
    { label: '归档', href: '/archives/', external: false },
    { label: '友人', href: '/links/', external: false },
    { label: '关于', href: '/about/', external: false }
  ],
```

每个字段的含义如下表：

|   字段   |                       含义                       |  类型  |
| :------: | :----------------------------------------------: | :----: |
|  label   |                对外显示的导航名称                | 文本型 |
|   href   | 点击后跳转的链接，支持站内相对地址和站外绝对地址 | 文本型 |
| external |   是否为外部链接，它决定链接是否在新标签页打开   | 布尔型 |

[hint type="info" title="提示"]无论是顶栏还是侧栏，都有一个“分类”选项，以展示博客里存在的所有分类。该项目无法删除。[/hint]

## Pjax 无刷新加载

`pjax`块代表无刷新加载开关。示例代码：

```ts
  pjax: {
    enabled: true
  },
```

本主题默认开启 Pjax 以获得更好的浏览体验。如果存在兼容性问题，可将 `enabled` 属性设置为 false 以关闭。

## 颜色设置

`appearance`块代表着主题的样式设置。包括深浅色模式和强调色。

示例代码如下：

```ts
  appearance: {
    defaultTheme: 'auto',
    accentColor: '#1abc9c'
  },
```

每个字段的含义如下表：

|     字段     |                             含义                             |        类型         |
| :----------: | :----------------------------------------------------------: | :-----------------: |
| defaultTheme | 用户首次访问博客时，默认采用的主题类型。`auto`代表自动，`light`代表浅色主题，`sunset`代表日落主题，`dark`代表深色主题。 |       文本型        |
| accentColor  |   强调色。会影响部分手机浏览器，决定系统状态栏的氛围颜色。   | HEX颜色值（文本型） |

## Banner 设置

`Banner`块代表首页的 Banner 设置。示例代码如下：

```ts
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
```

各字段含义如下表：

|      字段       |                             含义                             |  类型  |
| :-------------: | :----------------------------------------------------------: | :----: |
|     enabled     | 是否启用 Banner。如果设为 false，则下方所有项目都不起作用。  | 布尔型 |
|      title      |                            大标题                            | 文本型 |
|    subtitle     |                            小标题                            | 文本型 |
|      image      |                    背景图片，填写图片链接                    | 文本型 |
|    position     |   图片的对齐方式，填写格式为 “方向 方向”（方向 空格 方向）   | 文本型 |
| desktopHeightVh | 桌面端 Banner 高度占比，譬如上例代表 Banner 高度占页面可视高度的 55% | 数值型 |
| mobileHeightVh  |                    移动端 Banner 高度占比                    | 数值型 |
|     overlay     | 横幅上方黑色遮罩的透明度。此功能是为了防止 Banner 图过亮导致遮挡文字。0 为完全没有遮罩，1 为暗到纯黑。 | 小数型 |
|    textTone     | Banner 文字的色调。推荐保持 `auto`，这样 Banner 文字就能够根据图片的亮暗来调整文字的颜色。如果实在需要，可选 `light`、`Dark`。 | 文本型 |

## 文章卡片默认封面图

`cards`块代表文章卡片设置。示例代码如下：

```ts
  cards: {
    defaultCovers: ['https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80']
  },
```

其中，defaultCovers 是一个 JSON 数组，你可以往里面填写一个多个图片的地址。当有文章未设置封面，且文章里没有图片可被自动设为封面时，系统会从 defaultCovers 里随机抽选一个图片作为封面。

## 页脚

`footer`块代表页脚部分。示例代码如下：

```ts
  footer: {
    copyright: `© 2023-${new Date().getFullYear()} 你的名字`, // 记得把"你的名字"改成你自己的名字。
    // 外链（如果有）
    links: [
      { label: 'BlogsClub', href: 'https://blogs.club', external: true }
    ]
  },
```

首先，你需要把 Copyright 中的“你的名字”改为你自己的名字。

其次，如果你有外链需求（比如加入了某博客组织），你可以在 links 这个 JSON 数组里添加外链。`external`代表是否在新标签页打开。

## 评论系统

Eidolon 支持使用 Twikoo 作为评论系统。你只需要自行部署 Twikoo 云函数并获取 envID，将其填写到 comments: envID 中即可。

如果你不需要评论系统，只需将 comments: provider 改为 `none`，然后删除 comments 里剩余的子项即可。

## 顶栏/侧栏按钮自定义

Eidolon 支持自定义按钮。该按钮项目会在顶栏和侧栏同步显示。

示例代码如下：

```ts
  toolbarItems: [
    { type: 'search', icon: 'search', name: '搜索文章' },
    { type: 'rss', icon: 'rss', name: 'RSS 订阅', href: '/rss.xml' },
    { type: 'settings', icon: 'settings', name: '阅读设置' }
  ]
```

其中，`search`、`rss`、`settings`这三个 type 都是系统自带的按钮类型，分别对应搜索按钮、RSS 按钮、阅读设置按钮。其分别具有独立的功能，不建议删除。

如果你要新增带图标的外链按钮，需要经历以下这几步：

### 选择图标

Eidolon 使用 [Lucide](https://lucide.dev/icons/) 图标库。先前往该站点选择你要使用的图标，并将其名称复制下来。

### 注册图标名称

编辑 `src/types/config.ts`,第 18 行，有一个

```ts
export type ToolbarIcon = 'search' | 'rss' | 'settings' | 'link' | 'tram-front';
```

只需要将你要添加的图标名称，规范地加在 ToolbarIcon 后面即可。

譬如我新增了一个名为 check 的图标，那么我修改后的代码就是：

```ts
export type ToolbarIcon = 'search' | 'rss' | 'settings' | 'link' | 'tram-front' | 'check';
```

### 导入并建立映射

编辑 `/src/components/ToolbarIcon.astro`，第 2 行

```ts
import { Link, Rss, Search, TramFront, Type } from '@lucide/astro';
```

在这个数组的最前方添加你的图标名称。同上例，如果我要添加名为 check 的图标，那么实际代码就是：

```ts
import { Check, Link, Rss, Search, TramFront, Type } from '@lucide/astro';
```

是的，在第 2 行添加图标名时，需要将图标名首字母大写。

接下来看到第 7 行：

```ts
const icons = { link: Link, rss: Rss, search: Search, settings: Type, 'tram-front': TramFront } as const;
```

只需要在数组的末端加入`图标名（首字母小写）: 图标名（首字母大写）`，即可。

同上例，加入 check 这个图标后，代码应为：

```ts
const icons = { link: Link, rss: Rss, search: Search, settings: Type, 'tram-front': TramFront, check: Check } as const;
```

### 添加按钮

回到 site.config.ts，在 toolbarItems 里加入自定义链接按钮。

譬如我添加的是开往，图标名是`tram-front`，那么我的代码就是这样的：

```json
{ type: 'link', icon: 'tram-front', name: '开往', href: 'https://www.travellings.cn/plain.html', external: true },
```

其中，type: 'link' 定义了这是一个自定义链接；icon 制定了我想要的图标；name 就是鼠标悬浮之上时显示的气泡标题；href 即自定义外链跳转的的地址；external 即是否在新标签页中打开。

---

至此，Eidolon 的自定义教程结束。
