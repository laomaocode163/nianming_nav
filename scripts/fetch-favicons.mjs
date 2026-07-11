/**
 * 本地开发期脚本：把所有站点图标下载进 public/favicons/，并生成
 * src/config/faviconManifest.json 清单，供运行时优先使用本地同源图标，
 * 避免依赖外网（在 GFW 等网络下尤为关键）。
 *
 * 用法：
 *   node scripts/fetch-favicons.mjs          增量下载（已存在则跳过）
 *   node scripts/fetch-favicons.mjs --force  强制全量重抓
 *
 * 依赖：开发机需能直连各目标站点的 /favicon.ico；聚合源（favicon.im /
 * icon.horse）作为兜底，在受限网络下可能失败，属可容忍。
 */

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LINKS_PATH = join(ROOT, 'src/config/data/links.json');
const OUT_DIR = join(ROOT, 'public/favicons');
const MANIFEST_PATH = join(ROOT, 'src/config/faviconManifest.json');

const FORCE = process.argv.includes('--force');
const CONCURRENCY = 8;

/** 各内容类型对应的扩展名 */
const EXT_BY_TYPE = {
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/ico': '.ico',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/** 取单个域名的图标候选地址（按优先级） */
const candidatesFor = (domain) => [
  `https://${domain}/favicon.ico`,
  `https://favicon.im/${domain}`,
  `https://icon.horse/icon/${domain}`,
];

const extractDomain = (url) => {
  try {
    const u = url.startsWith('http') ? url : `https://${url}`;
    return new URL(u).hostname;
  } catch {
    return '';
  }
};

const uniqueDomains = async () => {
  const raw = await readFile(LINKS_PATH, 'utf8');
  const links = JSON.parse(raw);
  const set = new Set();
  for (const link of links) {
    const domain = extractDomain(link.url);
    if (domain) set.add(domain);
  }
  return [...set];
};

const fileExists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

/** 尝试下载某个域名的图标，成功返回文件名，否则返回 null */
const FETCH_TIMEOUT_MS = 8000;
const downloadDomain = async (domain) => {
  for (const url of candidatesFor(domain)) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const type = (res.headers.get('content-type') || '').toLowerCase();
      if (!type.startsWith('image/')) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 32) continue; // 过小的多半是错误页
      const ext = EXT_BY_TYPE[type.split(';')[0]] || extname(url) || '.ico';
      const fileName = `${domain}${ext}`;
      await writeFile(join(OUT_DIR, fileName), buf);
      return fileName;
    } catch {
      // 该候选源失败，尝试下一个
    }
  }
  return null;
};

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true });

  let manifest = {};
  if (existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    } catch {
      manifest = {};
    }
  }

  const domains = await uniqueDomains();
  const results = { ok: 0, skip: 0, fail: 0 };
  let index = 0;

  const worker = async () => {
    while (index < domains.length) {
      const domain = domains[index++];
      const target = join(OUT_DIR, manifest[domain] || `${domain}.ico`);
      if (!FORCE && (await fileExists(target)) && manifest[domain]) {
        results.skip++;
        continue;
      }
      const fileName = await downloadDomain(domain);
      if (fileName) {
        manifest[domain] = fileName;
        results.ok++;
      } else {
        delete manifest[domain];
        results.fail++;
        console.warn(`  ✗ 未获取到图标: ${domain}`);
      }
    }
  };

  const pool = Array.from({ length: CONCURRENCY }, worker);
  await Promise.all(pool);

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `\n完成：成功 ${results.ok}，跳过 ${results.skip}，失败 ${results.fail}，共 ${domains.length} 个域名`
  );
  console.log(`清单已写入 ${MANIFEST_PATH}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
