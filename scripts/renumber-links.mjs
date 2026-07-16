#!/usr/bin/env node
// 一次性重排 + 重编号 src/config/data/links.json：
//   按 categories.json 的分类顺序 → 各分类下的二级分类顺序，把链接聚合，
//   并按「分类段位」重新分配 id（ai=1000, dev=2000, ...，段内从 base+1 自增）。
// 段位规则与 src/config/linkId.ts 的 CATEGORY_ID_RANGES 保持一致。
//
// 用法：node scripts/renumber-links.mjs
//
// 说明：
// - 段内（同一分类）id 连续自增；分类之间互不干扰，新增站点不会挤压其它分类。
// - 同一二级分类内的相对顺序沿用原文件顺序，保持展示顺序稳定。
// - 未知分类（不在 categories.json 中）的链接原样追加在末尾，不参与段位重排。

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CATS_PATH = resolve(ROOT, 'src/config/data/categories.json');
const LINKS_PATH = resolve(ROOT, 'src/config/data/links.json');

const RANGE_SIZE = 1000;
const RANGES = {
  ai: 1000,
  dev: 2000,
  'frontend-dev': 3000,
  'backend-dev': 4000,
  interview: 5000,
  design: 6000,
  read: 7000,
  ent: 8000,
  software: 9000,
};
const baseOf = (catId, cats) =>
  catId in RANGES ? RANGES[catId] : (cats.findIndex((c) => c.id === catId) + 1) * RANGE_SIZE;

const categories = JSON.parse(readFileSync(CATS_PATH, 'utf8'));
const links = JSON.parse(readFileSync(LINKS_PATH, 'utf8'));

// catId -> { subOrder: string[], groups: Map<subId|'', Link[]> }
const buckets = new Map();
for (const c of categories) {
  buckets.set(c.id, {
    subOrder: (c.subCategories ?? []).map((s) => s.id),
    groups: new Map(),
  });
}

const unknownCatLinks = [];
for (const l of links) {
  const bucket = buckets.get(l.categoryId);
  if (!bucket) {
    unknownCatLinks.push(l);
    continue;
  }
  const sub = l.subCategoryId || '';
  if (!bucket.groups.has(sub)) bucket.groups.set(sub, []);
  bucket.groups.get(sub).push(l);
}

const out = [];
for (const c of categories) {
  const bucket = buckets.get(c.id);
  const base = baseOf(c.id, categories);
  let counter = 0;

  // 先放无二级分类的直链，再按二级分类顺序，最后放不在 subOrder 中的异常二级分类
  const groupsToEmit = [];
  if (bucket.groups.has('')) groupsToEmit.push('');
  for (const s of bucket.subOrder) if (bucket.groups.has(s)) groupsToEmit.push(s);
  for (const s of bucket.groups.keys()) {
    if (s !== '' && !bucket.subOrder.includes(s)) groupsToEmit.push(s);
  }

  for (const s of groupsToEmit) {
    for (const l of bucket.groups.get(s)) {
      counter += 1;
      out.push({ ...l, id: String(base + counter) });
    }
  }
}
out.push(...unknownCatLinks);

const ids = new Set(out.map((l) => l.id));
if (ids.size !== out.length) {
  throw new Error('重编号后出现重复 id，请检查数据');
}

writeFileSync(LINKS_PATH, repoStringify(out) + '\n', 'utf8');
console.log(`renumber-links: ${out.length} 条链接已按分类重排并重编号`);

// 复刻仓库既有 JSON 风格（顶层 2 空格缩进、对象单行紧凑、对象数组多行）
function repValue(v, indent) {
  if (Array.isArray(v)) {
    if (v.length === 0) return '[ ]';
    const child = indent + '  ';
    const items = v.map((it) => child + repValue(it, child)).join(',\n');
    return `[\n${items}\n${indent}]`;
  }
  if (v && typeof v === 'object') return repObj(v, indent);
  return JSON.stringify(v);
}
function repObj(obj, indent) {
  const inner = indent + '  ';
  const parts = Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${repValue(v, inner)}`);
  return `{ ${parts.join(', ')} }`;
}
function repoStringify(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return '[ ]';
    const items = data.map((it) => '  ' + repValue(it, '  ')).join(',\n');
    return `[\n${items}\n]`;
  }
  return repObj(data, '');
}
