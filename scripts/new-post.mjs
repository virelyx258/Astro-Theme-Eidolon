import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const root = process.cwd();
const now = new Date();
const year = String(now.getFullYear());
const month = String(now.getMonth() + 1).padStart(2, '0');
const postsDir = path.join(root, 'src', 'content', 'posts', year, month);

const rl = readline.createInterface({ input, output });

async function main() {
  try {
    let answers;
    if (input.isTTY) {
      answers = [
        await rl.question('文章标题: '),
        await rl.question('文章类名: '),
        await rl.question('文章封面（可选，直接回车跳过）: ')
      ];
    } else {
      answers = [];
      for await (const line of rl) answers.push(line);
    }

    const [rawTitle = '', rawSlug = '', rawCover = ''] = answers;
    const title = rawTitle.trim();
    const slug = rawSlug.trim();
    const cover = rawCover.trim();

    if (!title) throw new Error('文章标题不能为空');
    if (!slug) throw new Error('文章类名不能为空');
    if (!/^[^\\/:*?"<>|]+$/.test(slug) || slug === '.' || slug === '..') {
      throw new Error('文章类名只能是单个文件名，不能包含路径或 Windows 保留字符');
    }

    const target = path.join(postsDir, `${slug}.md`);
    if (fs.existsSync(target)) throw new Error(`文章已存在: ${path.relative(root, target)}`);

    const pubDate = now.toISOString();
    const frontmatter = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `pubDate: ${JSON.stringify(pubDate)}`,
      ...(cover ? [`cover: ${JSON.stringify(cover)}`] : []),
      'categories: []',
      'tags: []',
      'draft: true',
      '---',
      '',
      ''
    ].join('\n');

    fs.mkdirSync(postsDir, { recursive: true });
    fs.writeFileSync(target, frontmatter, 'utf8');
    console.log(`已新建文章: ${path.relative(root, target)}`);
  } catch (error) {
    console.error(`新建文章失败: ${error.message}`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(`新建文章失败: ${error.message}`);
  process.exitCode = 1;
});
