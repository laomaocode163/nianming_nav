#!/usr/bin/env node
// 计算下一个「按分类段位」的链接 id（规则见 src/config/linkId.ts）。
//
// 用法：
//   node next_link_id.mjs <categoryId>
//   例：node next_link_id.mjs ai   ->   1001
//
// 不传 categoryId 时退化为全局 max(id)+1（兼容旧用法 / 未知分类）。
//
// 段位：ai=1000, dev=2000, frontend-dev=3000, backend-dev=4000, interview=5000,
//       design=6000, read=7000, ent=8000, software=9000（每段 999 条）。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const linksPath = resolve(__dirname, '../../../../src/config/data/links.json');
const catsPath = resolve(__dirname, '../../../../src/config/data/categories.json');

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
  process.stdout.write(String((nums.length ? Math.max(...nums) : 0) + 1));
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
process.stdout.write(String(used.has(String(cand)) ? globalMax + 1 : cand));
