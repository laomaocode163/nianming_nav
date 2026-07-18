#!/usr/bin/env node
// 新增网站前，检查目标 URL 是否已在 links.json 中存在，避免重复添加
// （曾发生 Chrome 下载页被同时加到「官方软件」与「其他工具」的重复事故）。
//
// 用法：
//   node scripts/check-duplicate-link.mjs <url>
//   例：node scripts/check-duplicate-link.mjs https://www.google.cn/intl/zh-CN/chrome/
//
// 匹配级别：
//   EXACT  —— 归一化后完整 URL（scheme+host+port+path+query，去末尾斜杠、去 fragment）完全一致 → 几乎肯定是重复，应直接中止。
//   HOST   —— 仅域名（host）相同，但路径不同 → 可能是同一站点的不同页面（如首页 vs 下载页），需向用户确认是否真重复。
//
// 退出码：
//   0 = 未发现 EXACT 重复（HOST 命中仅打印警告，不阻断）。
//   1 = 发现 EXACT 重复（并打印已存在的条目，供中止/复用）。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const linksPath = resolve(ROOT, 'src/config/data/links.json');

const input = process.argv[2];
if (!input) {
  process.stderr.write('用法: node scripts/check-duplicate-link.mjs <url>\n');
  process.exit(2);
}

// 归一化：小写 scheme+host，去掉默认端口、末尾斜杠、fragment；保留 query（不同 query 通常代表不同页面）。
function normalize(url) {
  try {
    const u = new URL(url);
    u.protocol = u.protocol.toLowerCase();
    u.hostname = u.hostname.toLowerCase();
    if (
      (u.protocol === 'http:' && u.port === '80') ||
      (u.protocol === 'https:' && u.port === '443')
    ) {
      u.port = '';
    }
    let path = u.pathname.replace(/\/+$/, '') || '/';
    return { host: u.hostname, key: `${u.protocol}//${u.host}${path}${u.search}` };
  } catch {
    // 非法 URL：退化为去空格、小写、去末尾斜杠
    const s = String(url).trim().toLowerCase().replace(/\/+$/, '');
    return { host: s, key: s };
  }
}

const target = normalize(input);
const links = JSON.parse(readFileSync(linksPath, 'utf-8'));

let exact = null;
const hosts = [];
for (const l of links) {
  const n = normalize(l.url ?? '');
  if (n.key === target.key) {
    exact = l;
    break;
  }
  if (n.host === target.host) hosts.push(l);
}

if (exact) {
  process.stdout.write(
    `DUPLICATE-EXACT: 该网址已存在于 links.json，请勿重复添加。\n` +
      `  已存在条目 → id=${exact.id} name="${exact.name}" url="${exact.url}" ` +
      `categoryId=${exact.categoryId}${exact.subCategoryId ? ` subCategoryId=${exact.subCategoryId}` : ''}\n`
  );
  process.exit(1);
}

if (hosts.length) {
  const list = hosts
    .map((l) => `    - id=${l.id} name="${l.name}" url="${l.url}" categoryId=${l.categoryId}`)
    .join('\n');
  process.stdout.write(
    `WARN-SAME-HOST: 域名「${target.host}」已存在 ${hosts.length} 条同名站点（路径不同，可能是同一站点的不同页面）：\n${list}\n` +
      `  请确认是否为同一网站；若是则复用已有条目，否则可继续添加。\n`
  );
} else {
  process.stdout.write(`OK: 未发现重复，可安全添加「${target.key}」。\n`);
}

process.exit(0);
