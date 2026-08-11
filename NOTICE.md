# Mirages Astro

Mirages 是一个基于 Astro 的静态博客主题，用于发布文章和独立页面。旧版 PHP 文件位于本项目之外，保持不变。

本文档说明 Astro 主题的常用配置、Twikoo 评论和文章 Frontmatter。

## 运行项目

运行项目需要 Node.js 和 Corepack。

```sh
corepack pnpm install
corepack pnpm dev
```

`corepack pnpm check` 用于执行 Astro 类型和内容检查；`corepack pnpm build` 用于构建静态站点并生成 Pagefind 搜索索引；`corepack pnpm preview` 用于预览构建后的站点。

## 基本配置

主要配置文件是 `src/site.config.ts`。发布前至少修改以下内容：

| 配置 | 位置 | 用途 |
| --- | --- | --- |
| 站点名称 | `site.title` | 页面标题、导航站点名 |
| 站点描述 | `site.description` | 默认 description、RSS 描述 |
| 作者信息 | `site.author` | 头像、作者名、简介 |
| 正式域名 | `site.url` | canonical、RSS、sitemap、robots.txt 和社交分享地址 |
| 导航菜单 | `navigation` | 顶部和移动端导航 |
| Banner | `banner` | 首页横幅标题、图片、尺寸和遮罩 |
| 默认封面 | `cards.defaultCovers` | 文章没有封面时使用的候选图片 |
| 标签云数量 | `archives.tagLimit` | 归档页显示的最多标签数，设为 `0` 显示全部 |
| 页脚 | `footer` | 版权、说明和页脚链接 |

`site.url` 必须替换为真实的 HTTPS 域名，不要保留 `https://example.com`，否则 sitemap、canonical 和 Open Graph URL 都会指向错误地址。

### 网站图标 Favicon

当前 `src/layouts/BaseLayout.astro` 中的默认配置使用空白 data URI 图标。添加自己的图标时：

1. 将图标放入 `public/`，例如 `public/favicon.svg` 或 `public/favicon.png`。
2. 编辑 `src/layouts/BaseLayout.astro` 的 `<head>`，把默认图标：

```astro
<link rel="icon" href="data:," />
```

替换为：

```astro
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

PNG 图标示例：

```astro
<link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
```

如需 Apple 设备图标，可同时添加：

```astro
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
```

`public/` 下的文件会原样复制到站点根目录。修改后运行 `pnpm build`，并使用强制刷新检查浏览器缓存。

### 其他基本信息

颜色主题、默认主题和主题色位于 `appearance`；RSS、搜索、导航和自定义工具按钮也都在 `src/site.config.ts` 中配置。自定义工具按钮可按 `toolbarItems` 的类型定义添加 `link` 或 `rss` 项。`astro.config.mjs` 会读取 `site.url` 用于 sitemap 和站点构建配置。

## Twikoo 配置

Twikoo 评论默认关闭。完整配置入口是：

```text
astro/src/site.config.ts
```

将：

```ts
comments: { provider: 'none' },
```

改为：

```ts
comments: {
  provider: 'twikoo',
  envId: '你的 Twikoo 云函数地址',
  region: 'cn',
  lang: 'zh-CN'
},
```

其中 `envId` 就是 Twikoo 云函数或后端服务地址。例如使用 Vercel、Netlify、CloudBase 或自有服务器部署后，填写部署平台提供的公开访问地址：

```ts
envId: 'https://your-twikoo-api.example.com'
```

不要填写管理后台地址，也不要填写带具体文章路径的 URL。这里填写的是 Twikoo 服务根地址，前端会将它传给 `twikoo.init()`。

只有使用腾讯云 CloudBase 环境 ID 时才需要填写 `region`；填写 URL 型云函数或自托管服务地址时不要填写它。`lang` 可按需要修改，默认使用站点语言。

然后在需要评论的文章 Frontmatter 中启用：

```yaml
comments: true
```

Twikoo 客户端脚本由 `src/components/TwikooComments.astro` 从 jsDelivr 延迟加载，只有评论区域接近视口时才初始化。评论数量由 `src/components/TwikooCommentCounts.astro` 读取。修改配置后重新构建并部署：

```sh
pnpm build
```

如果页面显示“评论暂时不可用”，依次检查云函数地址是否能从浏览器直接访问、CORS 配置、Twikoo 环境变量和 `envId` 是否包含多余路径或空格。

## 文章 Frontmatter

文章位于 `src/content/posts`，独立页面位于 `src/content/pages`。两者使用相同的字段结构：

```yaml
title: 文章标题 # 必填
description: 简短摘要 # 可选，文章摘要和 SEO 描述
pubDate: 2026-07-30
updatedDate: 2026-08-01
draft: false
slug: custom-url
cover: https://images.example.com/article-cover.jpg
hero: https://images.example.com/article-hero.jpg
categories: [Notes]
tags: [astro]
textTone: auto
toc:
  enabled: true
  position: right
comments: true
math: false
mermaid: false
```

### 字段说明

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | 字符串 | 必填 | 文章标题。用于文章页标题、卡片和 SEO 标题。 |
| `description` | 字符串 | 无 | 文章摘要；用于 SEO description，未填写时会从正文生成摘要。 |
| `pubDate` | 日期 | 必填 | 发布日期，支持 `YYYY-MM-DD` 等可被 JavaScript 解析的日期格式。 |
| `updatedDate` | 日期 | 无 | 修改日期，适合在文章有实质更新时填写。 |
| `draft` | 布尔值 | `false` | `true` 时不生成文章路由，也不会出现在列表、RSS 和 sitemap 中。 |
| `slug` | 字符串 | 文件名/路径 | 自定义文章 URL slug。建议只使用稳定的英文、数字和短横线。 |
| `cover` | 字符串 | 无 | 文章卡片和文章 Banner 的封面 URL。支持绝对 URL 和项目内路径。 |
| `hero` | 字符串 | 无 | 兼容旧内容的 Banner 图片字段；没有 `cover` 时可作为图片来源。 |
| `categories` | 字符串数组 | `[]` | 文章分类，例如 `[随笔, 写作]`。 |
| `tags` | 字符串数组 | `[]` | 文章标签，例如 `[Astro, 前端]`。 |
| `textTone` | `light` / `dark` / `auto` | 无 | Banner 文字颜色。`auto` 会在图片加载后根据图片亮度判断。 |
| `toc` | 布尔值或对象 | `false` | 是否显示目录。对象可设置 `enabled` 和 `position: left/right`。 |
| `comments` | 布尔值 | `false` | 是否显示 Twikoo 评论区；还需要先在站点配置中启用 Twikoo。 |
| `math` | 布尔值 | `false` | 是否加载 KaTeX，用于 LaTeX 数学公式。 |
| `mermaid` | 布尔值 | `false` | 是否加载 Mermaid，用于 `mermaid` 代码块。 |

Frontmatter 必须放在 Markdown 文件开头的两个 `---` 之间。数组可以使用行内格式，也可以使用多行格式：

```yaml
categories:
  - 随笔
  - 写作
tags:
  - Astro
  - 网站
```

目录配置示例：

```yaml
toc:
  enabled: true
  position: left
```

文章卡片在构建时按以下顺序选择图片：`cover`、兼容旧内容的 `hero`、Markdown/MDX 正文中的第一张标准 Markdown 图片或 HTML `img`，最后使用 `siteConfig.cards.defaultCovers` 中的确定性候选图片。正文中的相对图片地址会根据最终文章 URL 解析，例如 `/posts/hello/` 中的 `images/photo.jpg` 会解析为 `/posts/hello/images/photo.jpg`。如果 `defaultCovers` 为空且没有其他图片，卡片会使用确定性的纯色背景作为兜底。

如果文章没有 `cover` 或 `hero`，只在正文中添加图片也可以：

```md
![Article image](./images/article.jpg)
```

`src/content/posts/first-light.md`、`content-workflow.md` 和 `quiet-default.md` 分别演示了 Frontmatter 封面、正文图片和默认封面路径。

`draft: true` 会将文章从文章列表、RSS、sitemap 和生成路由中排除。`toc` 也可以直接设置为 `true` 或 `false`；对象形式支持 `position: left` 或 `right`。目录标题由 Astro `render()` 返回的 headings 生成，并使用真实的 `#slug` 锚点。桌面端显示侧边目录，较小屏幕使用原生 `details` 控件，不会导致页面整体偏移。

包含 LaTeX 公式时设置 `math: true`。Markdown 通过 `remark-math` 和 `rehype-katex` 构建，只有这些页面会加载 KaTeX CSS。这是构建时渲染，不会加载 MathJax。

包含 `mermaid` 代码块时设置 `mermaid: true`。Mermaid 只会在这些页面中动态加载，渲染主题会跟随当前深色模式设置。

## 路由和工具

- `/` 是文章首页；`/posts/.../` 是公开文章页面。
- `/about/` 和其他非保留路径由 `src/content/pages` 生成。
- `/archives/`、`/categories/.../` 和 `/tags/.../` 提供归档及分类、标签页面。
- `/rss.xml` 是公开文章 RSS Feed。
- `/sitemap-index.xml` 由 `@astrojs/sitemap` 生成；`/robots.txt` 会将搜索引擎指向 sitemap。
- `build` 会为 `dist` 生成 Pagefind 索引；也可以使用 `search:index` 单独重新生成索引。
- Twikoo 通过 `siteConfig.comments` 按需启用。浏览器端 CDN 地址固定使用已安装的 `twikoo` `1.7.15` 版本，并以延迟方式加载评论和评论数量。

## Markdown 短代码

短代码由 `src/lib/shortcodes.ts` 在构建时处理；现有 `.md` 文件继续支持，不需要迁移到 MDX。块级语法是 `[name key="value"]...[/name]`；GitHub 卡片还支持 `[github repo="owner/repo" /]`；`[!] text` 和 `[!/ ] text` 是行内提示。属性支持 ASCII 引号、中文排版引号、不加引号的值和布尔标记。代码围栏不会被短代码处理。

| 语法 | 支持情况 | 说明 |
| --- | --- | --- |
| `[!]`、`[!/ ]` | 支持 | 行内提示，仅识别这些明确形式 |
| `button`、`btn` | 支持 | 支持 `href`、`url` 或 `link`；仅允许 http/https/mailto/tel 和相对地址 |
| `file` | 支持 | URL 规则与按钮相同 |
| `tag`、`label` | 支持 | `type` 支持 primary、success、warning、danger、info、default；支持 `outline` |
| `hint`、`tip` | 支持 | `type` 支持 warn、warning、error、danger、success、info；可选 `title` |
| `collapse` | 支持 | 使用原生且可访问的 `details`/`summary`；支持 Markdown 和嵌套折叠 |
| `tabs`、`tab` | 支持 | 静态可访问标签页，通过少量原生客户端脚本切换；多个实例互不影响 |
| `github` | 支持 | 构建时生成 GitHub 仓库卡片，并验证 `owner/repo`。可选 `description`、`stars`、`forks`、`lastCommit` 或 `commitDate`、`readMore`、`download` |
| 未知或不安全的值 | 安全兜底 | 无效链接和仓库会作为普通文本输出 |

`selected` 用于指定初始标签页。执行 `build` 时，`[github repo="owner/repo" /]` 使用的仓库会从 GitHub 公开仓库 API 获取，并缓存到 `.astro-cache/github.json`，缓存时间为 24 小时。可以设置 `GITHUB_CACHE_TTL_MS` 或 `GITHUB_API_TIMEOUT_MS` 调整默认值，也可以设置 `GITHUB_TOKEN` 以提高 API 访问限制；Token 不会写入缓存或构建输出。项目只使用公开仓库元数据。API 出错或处于开发模式时，会安全降级为仓库链接和 `—`，不会阻断构建。短代码中显式填写的属性始终优先于 API 数据；`readMore` 默认使用 `html_url`，`download` 使用 API 返回的 `default_branch`。浏览器端不会请求 GitHub API。已移除的短代码会触发构建错误，而不会作为普通 Markdown 输出。
