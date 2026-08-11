import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const backupPath = process.env.TYPECHO_SQL_GZ ?? 'C:/Users/hi/Desktop/备份/www_luming_cool_2026-08-01_01-30-01_mysql_data.sql.gz';
const postsDir = path.join(root, 'src', 'content', 'posts');
const coversDir = path.join(root, 'public', 'images', 'typecho-covers');

function sqlString(value) {
  if (value === 'NULL') return null;
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/\\([\\'"\\0bnrtZ])/g, (_, character) => ({ '\\': '\\', "'": "'", '"': '"', '0': '\0', b: '\b', n: '\n', r: '\r', t: '\t', Z: '\x1a' }[character] ?? character));
  }
  return value;
}

function splitSqlValues(input) {
  const values = [];
  let current = '';
  let quote = false;
  let escaped = false;
  for (const character of input) {
    if (quote) {
      current += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === "'") quote = false;
    } else if (character === "'") {
      quote = true;
      current += character;
    } else if (character === ',') {
      values.push(sqlString(current.trim()));
      current = '';
    } else {
      current += character;
    }
  }
  values.push(sqlString(current.trim()));
  return values;
}

function parseInsertRows(sql, table) {
  const marker = `INSERT INTO \`${table}\` VALUES `;
  const start = sql.indexOf(marker);
  if (start < 0) return [];
  let end = start + marker.length;
  let scanQuote = false;
  let scanEscaped = false;
  for (; end < sql.length; end += 1) {
    const character = sql[end];
    if (scanQuote) {
      if (scanEscaped) scanEscaped = false;
      else if (character === '\\') scanEscaped = true;
      else if (character === "'") scanQuote = false;
    } else if (character === "'") {
      scanQuote = true;
    } else if (character === ';') {
      break;
    }
  }
  const input = sql.slice(start + marker.length, end);
  const rows = [];
  let row = '';
  let depth = 0;
  let rowQuote = false;
  let rowEscaped = false;
  for (const character of input) {
    if (rowQuote) {
      row += character;
      if (rowEscaped) rowEscaped = false;
      else if (character === '\\') rowEscaped = true;
      else if (character === "'") rowQuote = false;
      continue;
    }
    if (character === "'") rowQuote = true;
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (depth > 0) row += character;
    if (depth === 0 && row) {
      rows.push(splitSqlValues(row.slice(1, -1)));
      row = '';
    }
  }
  return rows;
}

function tableColumns(sql, table) {
  const tick = String.fromCharCode(96);
  const match = sql.match(new RegExp('CREATE TABLE ' + tick + table + tick + ' \\(([\\s\\S]*?)\\)\\s+ENGINE', 'i'));
  if (!match) throw new Error(`missing CREATE TABLE for ${table}`);
  return [...match[1].matchAll(/^\s*`([^`]+)`/gm)].map((item) => item[1]);
}

function records(sql, table) {
  const columns = tableColumns(sql, table);
  return parseInsertRows(sql, table).map((values) => Object.fromEntries(columns.map((column, index) => [column, values[index] ?? null])));
}

function frontmatterRange(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  return end < 0 ? null : [0, end + 4];
}

function yamlString(value) {
  return JSON.stringify(value);
}

function findPosts() {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (/\.md$|\.mdx$/i.test(entry.name)) files.push(target);
    }
  };
  visit(postsDir);
  return files.map((file) => ({ file, content: fs.readFileSync(file, 'utf8') }));
}

async function main() {
  const sql = zlib.gunzipSync(fs.readFileSync(backupPath)).toString('utf8');
  const contents = records(sql, 'luming_contents');
  const fields = records(sql, 'luming_fields');
  const banners = new Map(fields.filter((field) => field.name === 'banner' && field.str_value).map((field) => [String(field.cid), field.str_value]));
  const posts = findPosts();
  const byTitle = new Map(posts.map((post) => [post.content.match(/^title:\s*["']?(.*?)["']?\s*$/m)?.[1]?.replace(/^['"]|['"]$/g, ''), post]));
  fs.mkdirSync(coversDir, { recursive: true });
  let downloaded = 0;
  let failed = 0;
  let changed = 0;
  let matched = 0;
  let existing = 0;
  const coverFiles = new Map();
  for (const [cid, url] of banners) {
    const filename = path.basename(new URL(url).pathname);
    const target = path.join(coversDir, filename);
    if (!coverFiles.has(url)) {
      try {
        if (!fs.existsSync(target)) {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
          fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
        }
        coverFiles.set(url, `/images/typecho-covers/${filename}`);
        downloaded += 1;
      } catch (error) {
        coverFiles.set(url, url);
        failed += 1;
        console.error(`download failed: ${url}: ${error.message}`);
      }
    }
    const content = contents.find((item) => String(item.cid) === cid);
    const post = content && byTitle.get(content.title);
    if (!post) continue;
    matched += 1;
    const range = frontmatterRange(post.content);
    if (!range) continue;
    if (/^cover:\s*/m.test(post.content.slice(...range))) {
      existing += 1;
      continue;
    }
    const insertion = `cover: ${yamlString(coverFiles.get(url))}\noriginalCover: ${yamlString(url)}\n`;
    const next = `${post.content.slice(0, range[0])}${post.content.slice(range[0], range[1]).replace(/^---\n/, `---\n${insertion}`)}${post.content.slice(range[1])}`;
    fs.writeFileSync(post.file, next, 'utf8');
    changed += 1;
  }
  console.log(JSON.stringify({ sqlContents: contents.length, bannerFields: banners.size, matchedPosts: matched, existingCovers: existing, changedFiles: changed, successfulDownloads: downloaded, failedDownloads: failed, unresolvedBanners: banners.size - matched }, null, 2));
}

await main();
