/**
 * 压缩 public/favicons 下的站点图标：将所有栅格图标（png/jpg/ico/webp/bmp/gif/tiff）
 * 统一缩放到 48×48（2x 高清，匹配卡片 24px 显示）并转 PNG，SVG 矢量保持原样，
 * 随后同步更新 src/config/faviconManifest.json 的文件名映射。
 *
 * 目的：站点原始 favicon 多为 256/512px 大图，直接用于 24px 显示是巨大浪费。
 * 压缩后目录体积通常下降 ~80%，配合 public/_headers 的 immutable 缓存，二次访问图标零下载。
 *
 * 依赖 macOS 自带 sips；非 macOS 环境下自动跳过并告警（不影响抓取/构建流程）。
 *
 * 用法（CLI）： node scripts/compress-favicons.mjs
 * 也可被 scripts/fetch-favicons.mjs 在抓取完成后调用，确保新增图标自动压缩。
 */
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, stat, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT_DIR = join(ROOT, 'public/favicons');
const MANIFEST_PATH = join(ROOT, 'src/config/faviconManifest.json');

const RASTER_EXTS = new Set(['png', 'jpg', 'jpeg', 'ico', 'webp', 'bmp', 'gif', 'tiff']);
const TARGET_SIZE = 48;

/** 检测 macOS 自带 sips 是否可用（Linux/Windows 无此命令） */
const isSipsAvailable = () => {
  try {
    execFileSync('sips', ['--help'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/**
 * 压缩 favicons 目录并同步 manifest。
 * @returns 压缩统计；非 macOS 环境返回 skippedReason: 'no-sips'。
 */
export const compressFavicons = async () => {
  if (!existsSync(OUT_DIR)) {
    return { compressed: 0, failed: [], beforeBytes: 0, afterBytes: 0, manifestChanged: 0 };
  }
  if (!isSipsAvailable()) {
    console.warn('  ⚠ 未检测到 sips（仅 macOS 自带），跳过图标压缩。可在 macOS 上运行以减小体积。');
    return {
      compressed: 0,
      failed: [],
      beforeBytes: 0,
      afterBytes: 0,
      manifestChanged: 0,
      skippedReason: 'no-sips',
    };
  }

  const files = (await readdir(OUT_DIR)).filter((f) => f !== '.manual');
  const usedNewNames = new Set();
  let totalBefore = 0;
  let totalAfter = 0;
  let compressed = 0;
  const failed = [];
  const renameMap = {};

  for (const f of files) {
    const ext = (f.split('.').pop() || '').toLowerCase();
    const src = join(OUT_DIR, f);
    const before = (await stat(src)).size;
    totalBefore += before;

    // 矢量/未知格式保持原样
    if (ext === 'svg' || !RASTER_EXTS.has(ext)) {
      totalAfter += before;
      continue;
    }

    const base = f.slice(0, f.length - ext.length - 1);
    let newName = `${base}.png`;
    // 防重名：若新名已占用（不同扩展名同基名），追加原扩展名
    if (usedNewNames.has(newName)) newName = `${base}.${ext}.png`;
    usedNewNames.add(newName);
    const dest = join(OUT_DIR, newName);

    try {
      execFileSync('sips', ['-Z', String(TARGET_SIZE), src, '--out', dest], { stdio: 'ignore' });
      if (!existsSync(dest)) throw new Error('sips 未产生输出文件');
      const after = (await stat(dest)).size;
      totalAfter += after;
      compressed++;
      renameMap[f] = newName;
      if (newName !== f) await unlink(src); // 改名后删除旧文件
    } catch {
      failed.push(f);
      totalAfter += before; // 压缩失败则保留原文件
    }
  }

  // 同步 manifest：域名 -> 新文件名
  let manifestChanged = 0;
  if (existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    for (const domain of Object.keys(manifest)) {
      const newFile = renameMap[manifest[domain]];
      if (newFile && newFile !== manifest[domain]) {
        manifest[domain] = newFile;
        manifestChanged++;
      }
    }
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  }

  const savedPct = totalBefore ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : '0.0';
  console.log(
    `图标压缩：成功 ${compressed}，失败 ${failed.length}` +
      `${failed.length ? ` (${failed.join(', ')})` : ''}，` +
      `manifest 更新 ${manifestChanged} 条；体积 ` +
      `${(totalBefore / 1048576).toFixed(2)}MB → ${(totalAfter / 1048576).toFixed(2)}MB (省 ${savedPct}%)`
  );

  return { compressed, failed, beforeBytes: totalBefore, afterBytes: totalAfter, manifestChanged };
};
