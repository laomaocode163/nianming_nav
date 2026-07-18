#!/usr/bin/env node
// 计算下一个「按分类段位」的链接 id（规则见 src/config/linkId.ts 的 CATEGORY_ID_RANGES）。
//
// 用法：
//   node scripts/next-link-id.mjs <categoryId>
//   例：node scripts/next-link-id.mjs ai   ->   1001
//
// 不传 categoryId 时退化为全局 max(id)+1（兼容旧用法 / 未知分类）。
//
// 段位（务必与 src/config/linkId.ts 保持一致）：
//   ai=1000, dev=2000, frontend-dev=3000, backend-dev=4000, interview=5000,
//   design=6000, read=7000, ent=8000, software=9000（每段 999 条）。
//
// 这是「避免重复 id」的根治工具：新增链接时永远用本脚本取 id，绝不要手动挑
// 「上一条 + 1」，因为 id 是全局唯一但各分类独占一个 1000 宽段位，肉眼易撞车。
// 若 links.json 经多次手动编辑后分组错乱，可再用 `npm run renumber-links` 一键归一化。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const linksPath = resolve(ROOT, 'src/config/data/links.json');
const catsPath = resolve(ROOT, 'src/config/data/categories.json');

const categoryId = process.argv[2];
const links = JSON.parse(readFileSync(linksPath, 'utf-8'));
const categories = JSON.parse(readFileSync(catsPath, 'utf-8'));

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
const baseOf = (catId) =>
  catId in RANGES ? RANGES[catId] : (categories.findIndex((c) => c.id === catId) + 1) * RANGE_SIZE;

if (!categoryId) {
  const nums = links.map((l) => Number(l.id)).filter((n) => Number.isFinite(n) && n > 0);
  process.stdout.write(String((nums.length ? Math.max(...nums) : 0) + 1) + '\n');
  process.exit(0);
}

const base = baseOf(categoryId);
const lo = base + 1;
const hi = base + RANGE_SIZE - 1;
let maxIn = 0;
let globalMax = 0;
const used = new Set(links.map((l) => l.id));
for (const l of links) {
  const n = Number(l.id);
  if (!Number.isFinite(n) || n <= 0) continue;
  if (n > globalMax) globalMax = n;
  if (n >= lo && n <= hi && n > maxIn) maxIn = n;
}
const cand = maxIn > 0 ? maxIn + 1 : lo;
process.stdout.write(String(used.has(String(cand)) ? globalMax + 1 : cand) + '\n');
