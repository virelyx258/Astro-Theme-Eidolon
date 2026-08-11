import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const backupDir = process.env.TYPECHO_BACKUP_DIR ?? 'C:/Users/hi/Desktop/备份';
const datPath = process.env.TYPECHO_DAT ?? path.join(backupDir, '20260801_www.luming.cool_6a6e0323b06da.dat');
const twikooExamplePath = path.join(backupDir, 'twikoo-comment (1).json');
const postsDir = path.join(root, 'src', 'content', 'posts');
const migrationDir = path.join(root, 'migration');
const commentsPath = path.join(migrationDir, 'twikoo-comments.json');
const MAGIC = Buffer.from('%TYPECHO_BACKUP_0001%');

const text = (value) => value == null ? null : value.toString('utf8');
const number = (value, fallback = 0) => Number.parseInt(text(value) ?? '', 10) || fallback;
const field = (record, name) => record.fields[name];

function parseBackup(filePath) {
  const blob = fs.readFileSync(filePath);
  if (!blob.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('invalid Typecho backup magic');
  const records = [];
  let pos = MAGIC.length;
  while (pos < blob.length) {
    if (blob.subarray(pos, pos + MAGIC.length).equals(MAGIC) && pos + MAGIC.length === blob.length) {
      pos += MAGIC.length;
      break;
    }
    const start = pos;
    if (blob.length - pos < 8) throw new Error(`truncated record header at ${pos}`);
    const tableId = blob.readUInt16LE(pos);
    const schemaLength = blob.readUInt16LE(pos + 2);
    const dataLength = blob.readUInt32LE(pos + 4);
    pos += 8;
    const schemaBytes = blob.subarray(pos, pos + schemaLength);
    const schema = JSON.parse(schemaBytes.toString('utf8'));
    pos += schemaLength;
    const data = blob.subarray(pos, pos + dataLength);
    if (data.length !== dataLength) throw new Error(`truncated record data at ${pos}`);
    pos += dataLength;
    const checksum = blob.subarray(pos, pos + 32).toString('ascii');
    pos += 32;
    const expected = crypto.createHash('md5').update(blob.subarray(start, start + 8 + schemaLength + dataLength)).digest('hex');
    if (checksum !== expected) throw new Error(`checksum mismatch at ${start}`);
    let cursor = 0;
    const fields = {};
    for (const [name, length] of Object.entries(schema)) {
      if (length === null) { fields[name] = null; continue; }
      const value = data.subarray(cursor, cursor + length);
      if (value.length !== length) throw new Error(`field ${name} exceeds record at ${start}`);
      cursor += length;
      fields[name] = value;
    }
    if (cursor !== dataLength) throw new Error(`record length mismatch at ${start}`);
    records.push({ tableId, fields, signature: Object.keys(schema).sort().join(',') });
  }
  if (pos !== blob.length) throw new Error(`unparsed trailing bytes at ${pos}`);
  return records;
}

function dateFromUnix(value) {
  const timestamp = number(value);
  const milliseconds = timestamp < 100000000000 ? timestamp * 1000 : timestamp;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.valueOf())) throw new Error(`invalid timestamp: ${timestamp}`);
  return date.toISOString();
}

function yamlString(value) {
  return JSON.stringify(value ?? '');
}

function englishSlug(raw, cid) {
  const candidate = (raw ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return candidate || `post-${cid}`;
}

function uniqueSlug(raw, cid, used) {
  const base = englishSlug(raw, cid);
  let slug = base;
  let suffix = 2;
  while (used.has(slug)) slug = `${base}-${suffix++}`;
  used.add(slug);
  return slug;
}

function relationMap(records) {
  const map = new Map();
  for (const record of records) {
    const cid = number(field(record, 'cid'));
    const mid = number(field(record, 'mid'));
    if (!cid || !mid) continue;
    if (!map.has(cid)) map.set(cid, []);
    map.get(cid).push(mid);
  }
  return map;
}

function classify(records) {
  const allContents = records.filter((r) => ['cid', 'title', 'text'].every((key) => key in r.fields));
  // Pages and drafts must also be materialized when comments or relationships
  // refer to them; attachments are binary/media records, not post content.
  const contents = allContents.filter((r) => text(field(r, 'type')) !== 'attachment');
  const comments = records.filter((r) => ['coid', 'cid', 'author', 'text'].every((key) => key in r.fields));
  const metas = records.filter((r) => ['mid', 'name', 'slug', 'type'].every((key) => key in r.fields));
  const relations = records.filter((r) => ['cid', 'mid'].every((key) => key in r.fields) && !('title' in r.fields));
  return { allContents, contents, comments, metas, relations };
}

function main() {
  const records = parseBackup(datPath);
  const { allContents, contents, comments, metas, relations } = classify(records);
  const relation = relationMap(relations);
  const metaById = new Map(metas.map((r) => [number(field(r, 'mid')), r]));
  const used = new Set();
  const postPaths = new Map();
  const generated = [];
  const categories = new Set();
  const tags = new Set();

  for (const record of contents) {
    const cid = number(field(record, 'cid'));
    const sourceSlug = text(field(record, 'slug'));
    const slug = uniqueSlug(sourceSlug, cid, used);
    const created = dateFromUnix(field(record, 'created'));
    const modified = field(record, 'modified') == null ? null : dateFromUnix(field(record, 'modified'));
    const date = new Date(created);
    const year = String(date.getUTCFullYear());
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const route = `/posts/${year}/${month}/${slug}`;
    const target = path.join(postsDir, year, month, `${slug}.md`);
    const taxonomy = { categories: [], tags: [] };
    for (const mid of relation.get(cid) ?? []) {
      const meta = metaById.get(mid);
      if (!meta) continue;
      const name = text(field(meta, 'name')) ?? '';
      const type = text(field(meta, 'type'));
      if (type === 'category') taxonomy.categories.push(name), categories.add(name);
      if (type === 'tag') taxonomy.tags.push(name), tags.add(name);
    }
    const description = ['description', 'summary', 'excerpt'].map((key) => text(field(record, key))).find(Boolean);
    const lines = [
      '---',
      `title: ${yamlString(text(field(record, 'title')) ?? '')}`,
      description ? `description: ${yamlString(description)}` : null,
      `pubDate: ${yamlString(created)}`,
      modified ? `updatedDate: ${yamlString(modified)}` : null,
      taxonomy.categories.length ? 'categories:' : 'categories: []',
      ...taxonomy.categories.map((value) => `  - ${yamlString(value)}`),
      taxonomy.tags.length ? 'tags:' : 'tags: []',
      ...taxonomy.tags.map((value) => `  - ${yamlString(value)}`),
      sourceSlug && sourceSlug !== slug ? `originalSlug: ${yamlString(sourceSlug)}` : null,
      `comments: ${number(field(record, 'commentsNum')) > 0 || comments.some((comment) => number(field(comment, 'cid')) === cid)}`,
      '---',
      '',
      text(field(record, 'text')) ?? '',
      ''
    ].filter((line) => line !== null);
    postPaths.set(cid, { route, slug, target, exists: fs.existsSync(target) });
    if (!fs.existsSync(target)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, lines.join('\n'), 'utf8');
      generated.push(path.relative(root, target));
    }
  }

  const example = JSON.parse(fs.readFileSync(twikooExamplePath, 'utf8'));
  if (!Array.isArray(example)) throw new Error('Twikoo example must be an array');
  const twikooComments = comments.map((record, index) => {
    const cid = number(field(record, 'cid'));
    const target = postPaths.get(cid);
    if (!target) throw new Error(`comment ${number(field(record, 'coid'), index)} points to missing post ${cid}`);
    const created = number(field(record, 'created')) * (number(field(record, 'created')) < 100000000000 ? 1000 : 1);
    const id = String(number(field(record, 'coid'), index + 1));
    const mail = text(field(record, 'mail')) ?? '';
    return {
      _id: id,
      uid: crypto.createHash('md5').update(`${text(field(record, 'author')) ?? ''}:${mail}`).digest('hex'),
      nick: text(field(record, 'author')) ?? '匿名用户',
      ...(mail ? { mail, mailMd5: crypto.createHash('md5').update(mail.trim().toLowerCase()).digest('hex') } : {}),
      ...(text(field(record, 'url')) ? { link: text(field(record, 'url')) } : {}),
      ...(text(field(record, 'agent')) ? { ua: text(field(record, 'agent')) } : {}),
      ...(text(field(record, 'ip')) ? { ip: text(field(record, 'ip')) } : {}),
      master: false,
      url: `${target.route}/`,
      href: `https://www.luming.cool${target.route}/`,
      comment: text(field(record, 'text')) ?? '',
      isSpam: text(field(record, 'status')) === 'spam',
      created,
      updated: created,
      id
    };
  });
  fs.mkdirSync(migrationDir, { recursive: true });
  fs.writeFileSync(commentsPath, `${JSON.stringify(twikooComments, null, 2)}\n`, 'utf8');
  generated.push(path.relative(root, commentsPath));
  console.log(JSON.stringify({
    records: records.length,
    contents: contents.length,
    generatedPosts: generated.filter((file) => file.replaceAll('\\', '/').startsWith('src/content/posts/')).length,
    skippedExistingPosts: [...postPaths.values()].filter((post) => post.exists).length,
    sourceContentTypes: Object.fromEntries([...new Set(allContents.map((record) => text(field(record, 'type')) ?? 'unknown'))].sort().map((type) => [type, allContents.filter((record) => (text(field(record, 'type')) ?? 'unknown') === type).length])),
    categories: [...categories].sort(),
    tags: [...tags].sort(),
    comments: twikooComments.length,
    twikooExampleComments: example.length,
    generated
  }, null, 2));
}

main();
