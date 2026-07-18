/**
 * CLI 入口：压缩 public/favicons 下的站点图标。
 * 详见 scripts/lib/compressFavicons.mjs。
 */
import { compressFavicons } from './lib/compressFavicons.mjs';

compressFavicons().catch((err) => {
  console.error(err);
  process.exit(1);
});
