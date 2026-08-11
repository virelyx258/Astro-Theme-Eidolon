import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { toHtml } from 'hast-util-to-html';
import { toHast } from 'mdast-util-to-hast';
import { gfm } from 'micromark-extension-gfm';
import { visit } from 'unist-util-visit';
import { applyExternalLinks } from './external-links';

const URL_SCHEME = /^(https?:|mailto:|tel:)/i;
const TAG_TYPES = new Set(['primary', 'success', 'warning', 'danger', 'info', 'default']);
const HINT_TYPES = new Set(['warn', 'warning', 'error', 'danger', 'success', 'info']);
const BLOCK_NAMES = new Set(['hint', 'tip', 'collapse', 'tabs', 'tools']);
const INLINE_NAMES = new Set(['button', 'btn', 'file', 'tag', 'label']);
type GithubData = { stars?: string; forks?: string; description?: string; commitDate?: string; htmlUrl?: string; defaultBranch?: string };
let githubData: Record<string, GithubData> = {};
let siteUrl = '';

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

function attrs(source: string): Record<string, string> {
  const normalized = source.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  const result: Record<string, string> = {};
  const pattern = /([\w-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?/g;
  for (const match of normalized.matchAll(pattern)) result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  return result;
}

const safeUrl = (value: string | undefined) => {
  const candidate = value?.trim();
  if (!candidate || candidate.startsWith('//') || /[\u0000-\u001f\u007f]/.test(candidate) || /^(javascript|data|vbscript):/i.test(candidate)) return null;
  if (URL_SCHEME.test(candidate) || (candidate.startsWith('/') && !candidate.startsWith('//')) || candidate.startsWith('./') || candidate.startsWith('../') || !/^[\w+.-]+:/.test(candidate)) return candidate;
  return null;
};
const safeHttpUrl = (value: string | undefined) => {
  const candidate = safeUrl(value);
  if (!candidate) return null;
  if (!/^[\w+.-]+:/.test(candidate)) return candidate;
  if (!/^https?:\/\//i.test(candidate)) return null;
  try {
    const parsed = new URL(candidate);
    return /^https?:$/.test(parsed.protocol) && Boolean(parsed.hostname) ? candidate : null;
  } catch {
    return null;
  }
};
const inline = (value: string) => escape(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');

function normalizeMarkdownHeadings(source: string): string {
  source = source.replace(/^(<!--markdown-->)\s*(?=#{1,6})/gm, '$1\n');
  let fence: string | null = null;
  return source.split('\n').map((line) => {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = null;
      return line;
    }
    if (fence) return line;
    return line.replace(/^(#{1,6})([^ #])/, '$1 $2');
  }).join('\n');
}

function markdown(source: string, preserveHtml = false): string {
  const normalized = normalizeMarkdownHeadings(source);
  const tree = fromMarkdown(normalized, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
  transform(tree, normalized);
  if (!preserveHtml) visit(tree, 'html', (node: any) => { if (!node.data?.shortcode) node.value = ''; });
  const hast = toHast(tree, { allowDangerousHtml: true }) as any;
  if (siteUrl) applyExternalLinks(hast, siteUrl);
  return toHtml(hast, { allowDangerousHtml: true });
}

export function renderMarkdown(source: string): string {
  return markdown(source, true);
}

function renderBlock(name: string, args: Record<string, string>, body = ''): string {
  const label = args.title ?? args.name ?? args.text ?? body.trim().split('\n')[0] ?? '';
  if (name === 'button' || name === 'btn' || name === 'file') {
    const url = safeUrl(args.href ?? args.url ?? args.link);
    if (!url) return `<span class="shortcode-invalid">${escape(label || '链接不可用')}</span>`;
    return `<a class="shortcode-button shortcode-${name}" href="${escape(url)}" data-no-text-link>${inline(label || url)}</a>`;
  }
  if (name === 'tag' || name === 'label') {
    const type = TAG_TYPES.has(args.type ?? '') ? args.type : 'default';
    const outline = args.outline !== undefined ? ' shortcode-tag-outline' : '';
    return `<span class="shortcode-tag shortcode-tag-${type}${outline}">${inline(label)}</span>`;
  }
  if (name === 'hint' || name === 'tip') {
    const type = HINT_TYPES.has(args.type ?? '') ? args.type : 'info';
    const title = args.title ? `<strong>${inline(args.title)}</strong>` : '';
    return `<aside class="shortcode-hint shortcode-hint-${type}" role="note">${title}${markdown(body)}</aside>`;
  }
  if (name === 'collapse') {
    const open = args.open !== undefined || args.expanded !== undefined ? ' open' : '';
    return `<details class="shortcode-collapse"${open}><summary><span class="shortcode-collapse-marker" aria-hidden="true"></span><span>${inline(label || '展开内容')}</span></summary><div class="shortcode-body"><div class="shortcode-body-inner">${markdown(body, true)}</div></div></details>`;
  }
  if (name === 'tabs') {
    const parsed = parseBlocks(body);
    const tabs = parsed.filter((item) => item.name === 'tab');
    if (!tabs.length) return `<details class="shortcode-collapse"><summary><span class="shortcode-collapse-marker" aria-hidden="true"></span><span>${inline(label || '展开内容')}</span></summary><div class="shortcode-body"><div class="shortcode-body-inner">${markdown(body)}</div></div></details>`;
    const id = `shortcode-tabs-${tabs.length}-${Math.random().toString(36).slice(2, 8)}`;
    const selected = Math.max(0, tabs.findIndex((tab) => tab.args.selected !== undefined));
    const buttons = tabs.map((tab, index) => `<button type="button" role="tab" aria-controls="${id}-panel-${index}" aria-selected="${index === selected}" id="${id}-tab-${index}" data-shortcode-tab="${id}"${index === selected ? '' : ' tabindex="-1"'}>${inline(tab.args.name ?? tab.args.title ?? `选项 ${index + 1}`)}</button>`).join('');
    const panels = tabs.map((tab, index) => `<div role="tabpanel" id="${id}-panel-${index}" aria-labelledby="${id}-tab-${index}"${index === selected ? '' : ' hidden'}>${markdown(tab.body)}</div>`).join('');
    return `<section class="shortcode-tabs" data-shortcode-tabs="${id}"><div class="shortcode-tab-list" role="tablist" aria-label="${escape(label || '选项卡')}">${buttons}</div>${panels}</section>`;
  }
  if (name === 'tools') {
    const tools = body.split(/\r?\n/).map((line) => {
      const match = line.trim().match(/^\[([^\]]+)\]\(([^)]+)\)\+(.+)$/);
      if (!match) return null;
      const [, name, href, payload] = match;
      const parenthesized = payload.match(/^\((.+)\)\/\((.*)\)$/);
      const separator = payload.lastIndexOf('/');
      const icon = parenthesized?.[1] ?? (separator >= 0 ? payload.slice(0, separator) : '');
      const description = parenthesized?.[2] ?? (separator >= 0 ? payload.slice(separator + 1) : '');
      if (!icon || !description) return null;
      const safeHref = safeUrl(href);
      const safeIcon = safeUrl(icon);
      if (!safeHref || !safeIcon) return null;
      return `<li class="shortcode-tool"><a class="shortcode-tool-link" href="${escape(safeHref)}" target="_blank" rel="noopener noreferrer" data-no-text-link><span class="shortcode-tool-icon"><img src="${escape(safeIcon)}" alt="" loading="lazy"></span><span class="shortcode-tool-content"><strong class="shortcode-tool-name">${inline(name)}</strong><span class="shortcode-tool-description">${inline(description.trim())}</span></span></a></li>`;
    }).filter(Boolean).join('');
    return `<section class="shortcode-tools" aria-label="${escape(label || '工具')}">${label ? `<h3 class="shortcode-tools-title">${inline(label)}</h3>` : ''}<ul class="shortcode-tool-list">${tools}</ul></section>`;
  }
  if (name === 'github') {
    const repository = (args.repo ?? args.repository ?? label).trim();
    const repositoryMatch = repository.match(/^([A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38}))\/([A-Za-z0-9](?:[A-Za-z0-9_.-]{0,99}))$/);
    if (!repositoryMatch) return '<span class="shortcode-invalid">GitHub 仓库地址不可用</span>';
    const [, owner, repo] = repositoryMatch;
    const data = githubData[repository.toLowerCase()] ?? {};
    const url = safeHttpUrl(data.htmlUrl) ?? `https://github.com/${owner}/${repo}`;
    const readMore = args.readmore === undefined ? url : safeHttpUrl(args.readmore);
    const branch = data.defaultBranch || 'main';
    const download = args.download === undefined ? `${url}/archive/refs/heads/${encodeURIComponent(branch)}.zip` : safeHttpUrl(args.download);
    const description = args.description !== undefined ? args.description.trim() : data.description?.trim();
    const commitDate = args.lastcommit !== undefined ? args.lastcommit.trim() : args.commitdate !== undefined ? args.commitdate.trim() : data.commitDate?.trim();
    const stars = args.stars !== undefined ? args.stars.trim() : data.stars;
    const forks = args.forks !== undefined ? args.forks.trim() : data.forks;
    const stats = (name: string, value: string | undefined) => `<span class="shortcode-github-stat${value?.trim() ? '' : ' shortcode-github-stat-empty'}"><span>${name}</span> <b>${escape(value?.trim() || '—')}</b></span>`;
    const descriptionMarkup = description ? `<p class="shortcode-github-description">${inline(description)}</p>` : '';
    const readMoreMarkup = readMore ? `<a class="shortcode-github-read-more" href="${escape(readMore)}" target="_blank" rel="noopener noreferrer" data-no-text-link>Read More</a>` : '';
    const commitMarkup = `<span class="shortcode-github-commit${commitDate ? '' : ' shortcode-github-commit-empty'}"><span class="shortcode-github-commit-label">Last Commit</span> <time class="shortcode-github-date">${escape(commitDate || '—')}</time></span>`;
    const downloadMarkup = download ? `<a class="shortcode-github-download" href="${escape(download)}" download target="_blank" rel="noopener noreferrer" data-no-text-link>Download as zip</a>` : '';
    const contentMarkup = descriptionMarkup || readMoreMarkup ? `<div class="shortcode-github-content">${descriptionMarkup}${readMoreMarkup}</div>` : '';
    const footerMarkup = commitMarkup || downloadMarkup ? `<footer class="shortcode-github-footer">${commitMarkup}${downloadMarkup}</footer>` : '';
     return `<article class="shortcode-github" aria-label="GitHub repository ${escape(repository)}"><header class="shortcode-github-header"><div class="shortcode-github-title"><svg class="shortcode-github-icon" aria-hidden="true" viewBox="0 0 16 16" role="img"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" /></svg><h3><a class="shortcode-github-owner" href="https://github.com/${escape(owner)}" target="_blank" rel="noopener noreferrer" data-no-text-link>${escape(owner)}</a>/<a class="shortcode-github-repo" href="${url}" target="_blank" rel="noopener noreferrer" data-no-text-link>${escape(repo)}</a></h3></div><div class="shortcode-github-stats">${stats('Stars', stars)}${stats('Forks', forks)}</div></header>${contentMarkup}${footerMarkup}</article>`;
  }
  return '';
}

function parseBlocks(source: string): Array<{ name: string; args: Record<string, string>; body: string }> {
  const result: Array<{ name: string; args: Record<string, string>; body: string }> = [];
  const pattern = /^\[tab([^\]]*)\]\s*\n?([\s\S]*?)^\[\/tab\]\s*$/gm;
  for (const match of source.matchAll(pattern)) result.push({ name: 'tab', args: attrs(match[1]), body: match[2] });
  return result;
}

function findGithubBlocks(source: string): Array<{ name: string; args: Record<string, string>; body: string; start: number; end: number }> {
  const result: Array<{ name: string; args: Record<string, string>; body: string; start: number; end: number }> = [];
  let fence: string | null = null;
  let opening: { args: Record<string, string>; start: number; bodyStart: number } | null = null;
  for (const line of source.matchAll(/^[^\n]*(?:\n|$)/gm)) {
    const text = line[0].trim();
    const start = line.index!;
    const fenceMatch = text.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;

    const selfClosing = text.match(/^\[github\b([\s\S]*?)\/\s*\]$/i);
    if (selfClosing) {
      result.push({ name: 'github', args: attrs(selfClosing[1]), body: '', start, end: start + line[0].length });
      continue;
    }

    const closing = text.match(/^\[\/github\]\s*$/i);
    if (closing && opening) {
      result.push({ name: 'github', args: opening.args, body: source.slice(opening.bodyStart, start), start: opening.start, end: start + line[0].length });
      opening = null;
      continue;
    }

    const startTag = text.match(/^\[github\b([^\]]*)\]\s*$/i);
    if (startTag) opening = { args: attrs(startTag[1]), start, bodyStart: start + line[0].length };
  }
  return result;
}

function findBlocks(source: string): Array<{ name: string; args: Record<string, string>; body: string; start: number; end: number }> {
  const result: Array<{ name: string; args: Record<string, string>; body: string; start: number; end: number }> = [];
  const stack: Array<{ name: string; args: Record<string, string>; start: number; bodyStart: number }> = [];
  let fence: string | null = null;
  for (const line of source.matchAll(/^[^\n]*(?:\n|$)/gm)) {
    const text = line[0].trim();
    const start = line.index!;
    const fenceMatch = text.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    const opening = text.match(/^\[([\w!-]+)([^\]]*)\]$/);
    const closing = text.match(/^\[\/([\w!-]+)\]$/);
    if (closing) {
      const name = closing[1].toLowerCase();
      const current = stack[stack.length - 1];
      if (current?.name === name) { stack.pop(); result.push({ name: current.name, args: current.args, body: source.slice(current.bodyStart, start), start: current.start, end: start + line[0].length }); }
    } else if (opening) {
      const name = opening[1].toLowerCase();
      if (BLOCK_NAMES.has(name)) stack.push({ name, args: attrs(opening[2]), start, bodyStart: start + line[0].length });
      else if (INLINE_NAMES.has(name)) result.push({ name, args: attrs(opening[2]), body: '', start, end: start + line[0].length });
    }
  }
  return [...findGithubBlocks(source), ...result].sort((a, b) => a.start - b.start);
}

function replaceInline(source: string): string | null {
  const noticePattern = /^\[!(?:\/\s*)?\]\s*(.+)$/gm;
  let replacedNotice = false;
  source = source.replace(noticePattern, (_match, body) => {
    replacedNotice = true;
    return `<span class="shortcode-notice" role="note">${inline(body)}</span>`;
  });
  const shortcode = /\[(button|btn|file|tag|label)([^\]]*)\]([\s\S]*?)\[\/\1\]/gi;
  const replacedShortcode = shortcode.test(source);
  if (!replacedNotice && !replacedShortcode) return null;
  return source.replace(shortcode, (_match, name, rawArgs, body) => renderBlock(name.toLowerCase(), attrs(rawArgs), body));
}

function transform(tree: any, raw = '') {
  visit(tree, 'root', (root: any) => {
    let fence: string | null = null;
    for (const line of raw.matchAll(/^[^\n]*(?:\n|$)/gm)) {
      const text = line[0].trim();
      const fenceMatch = text.match(/^(`{3,}|~{3,})/);
      if (fenceMatch) {
        if (!fence) fence = fenceMatch[1][0];
        else if (fenceMatch[1][0] === fence) fence = null;
      } else if (!fence && /\[(?:\/)?hide(?:\s[^\]]*)?\]/i.test(text)) {
        throw new Error('Unsupported shortcode [hide]: hide has been removed from Mirages Astro.');
      }
    }
    const blocks = findBlocks(raw).filter((block, _index, all) => !all.some((other) => other !== block && other.start < block.start && other.end >= block.end));
    if (blocks.length) {
      const replaced = new Set<number>();
      for (const block of blocks) {
        const indexes = root.children.map((node: any, index: number) => ({ node, index })).filter(({ node }: any) => node.position && node.position.start.offset < block.end && node.position.end.offset > block.start).map(({ index }: any) => index);
        const first = indexes[0];
        if (first === undefined) continue;
        root.children[first] = { type: 'html', value: renderBlock(block.name, block.args, block.body), data: { shortcode: true } };
        indexes.slice(1).forEach((index: number) => replaced.add(index));
      }
    root.children = root.children.filter((_node: any, index: number) => !replaced.has(index));
    }
    root.children = root.children.map((node: any) => {
      if (node.type !== 'paragraph' || !node.position) return node;
      const source = raw.slice(node.position.start.offset, node.position.end.offset).trim();
      const heading = source.match(/^#{1,6}([^ #].*)$/);
      if (!heading || /\n/.test(source)) return node;
      const parsed = fromMarkdown(`${source.slice(0, source.length - heading[1].length)} ${heading[1]}`);
      return parsed.children[0]?.type === 'heading' ? parsed.children[0] : node;
    });
    const output: any[] = [];
    for (const node of root.children) {
      if (node.type !== 'paragraph' && node.type !== 'html') { output.push(node); continue; }
      const source = node.type === 'html' ? node.value : node.position ? raw.slice(node.position.start.offset, node.position.end.offset) : '';
      const replaced = replaceInline(source.trim());
      output.push(replaced ? { type: 'html', value: replaced, data: { shortcode: true } } : node);
    }
    root.children = output;
  });
}

export default function shortcodes(options: { githubData?: Record<string, GithubData>; siteUrl?: string } = {}) {
  githubData = options.githubData ?? {};
  siteUrl = options.siteUrl ?? '';
  return (tree: any, file: any) => transform(tree, file?.toString?.() ?? String(file?.value ?? ''));
}
