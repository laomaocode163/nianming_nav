#!/usr/bin/env node
// 新增网站时，基于 name/url/description 文本自动计算最匹配的功能分组（二级分类）。
// 纯只读分析：只读取 links.json / categories.json，绝不写入任何数据。
//
// 用法：
//   node scripts/suggest-category.mjs "<name>" "<url>" "<description>" [--json]
//   例：node scripts/suggest-category.mjs "Claude Code 深度教程" "https://claudecode.tangshuang.net/" "唐霜出品：从入门到精通的 Claude Code 完全教程"
//
// 选项：
//   --json   以 JSON 形式输出结果，便于程序化解析（含 score / belowThreshold / suggestedNewParent）。
//
// 退出码：
//   0 = 找到匹配分组（best.score >= 阈值）。
//   1 = 未找到足够匹配的分组（belowThreshold），建议新建二级分类，交由用户确认。
//   2 = 用法错误（参数不足）。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { suggestCategory, SIMILARITY_THRESHOLD } from './lib/similarity.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const linksPath = resolve(ROOT, 'src/config/data/links.json');
const catsPath = resolve(ROOT, 'src/config/data/categories.json');

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const positional = args.filter((a) => a !== '--json');

const [name, url, description] = positional;
if (!name || !url) {
  process.stderr.write(
    '用法: node scripts/suggest-category.mjs "<name>" "<url>" "<description>" [--json]\n'
  );
  process.exit(2);
}

const links = JSON.parse(readFileSync(linksPath, 'utf-8'));
const categories = JSON.parse(readFileSync(catsPath, 'utf-8'));

const result = suggestCategory({ name, url, description }, links, categories, SIMILARITY_THRESHOLD);

if (asJson) {
  process.stdout.write(
    JSON.stringify({ threshold: SIMILARITY_THRESHOLD, ...result }, null, 2) + '\n'
  );
} else {
  const lines = [];
  lines.push(`智能归类建议（相似度阈值 = ${SIMILARITY_THRESHOLD}）`);
  lines.push('');
  lines.push(`候选：${name}  (${url})`);
  if (description) lines.push(`  └─ 描述：${description}`);
  lines.push('');
  lines.push('最匹配分组：');
  const ranked = [result.best, result.secondBest].filter(Boolean);
  if (ranked.length === 0) {
    lines.push('  （无可用分组）');
  } else {
    ranked.forEach((r, i) => {
      lines.push(
        `  ${i + 1}. ${r.categoryName} / ${r.subCategoryName}   (${r.categoryId} / ${r.subCategoryId})   相似度 ${r.score.toFixed(3)}`
      );
    });
  }
  lines.push('');

  if (result.belowThreshold) {
    lines.push(
      `=> 未找到足够匹配的分组（最高相似度 ${result.best ? result.best.score.toFixed(3) : '0.000'} < ${SIMILARITY_THRESHOLD}）。`
    );
    if (result.suggestedNewParent) {
      lines.push(
        `建议：新建一个二级分类，归属到「${result.suggestedNewParent.categoryName}」(categoryId=${result.suggestedNewParent.categoryId}) 下，`
      );
      lines.push('      并由用户确认新分类名称与图标后，再写入 categories.json。');
    } else {
      lines.push('建议：链接文本特征不足，无法推断归属，请直接向用户确认应放入哪个分类。');
    }
  } else if (result.best) {
    lines.push(
      `=> 建议归入：${result.best.categoryName} / ${result.best.subCategoryName} (categoryId=${result.best.categoryId}, subCategoryId=${result.best.subCategoryId})`
    );
    lines.push('    （请向用户确认该归类，确认后再继续取 id 与写入。）');
  }
  process.stdout.write(lines.join('\n') + '\n');
}

process.exit(result.belowThreshold ? 1 : 0);
