/**
 * 本地开发期管理后台的 JSON 读写层（仅 dev server 使用）。
 * 复刻仓库既有 JSON 风格（顶层 2 空格缩进、对象单行紧凑、对象数组多行），
 * 使整文件重写只产生最小 diff。路径常量与读写函数集中于此，供 devAdminApi 路由层复用。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Category, SubCategory } from '../../src/config/schema';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '..', '..');
export const CATEGORIES_PATH = resolve(ROOT, 'src/config/data/categories.json');
export const LINKS_PATH = resolve(ROOT, 'src/config/data/links.json');
export const SEARCH_PATH = resolve(ROOT, 'src/config/data/search.json');
export const SETTINGS_PATH = resolve(ROOT, 'src/config/data/settings.json');
export const FAVICONS_SCRIPT = resolve(ROOT, 'scripts/fetch-favicons.mjs');

const repValue = (v: unknown, indent: string): string => {
  if (Array.isArray(v)) {
    if (v.length === 0) return '[ ]';
    const child = indent + '  ';
    const items = v.map((it) => child + repValue(it, child)).join(',\n');
    return `[\n${items}\n${indent}]`;
  }
  if (v && typeof v === 'object') {
    return repObj(v as Record<string, unknown>, indent);
  }
  return JSON.stringify(v);
};

const repObj = (obj: Record<string, unknown>, indent: string): string => {
  const inner = indent + '  ';
  const parts = Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${repValue(v, inner)}`);
  return `{ ${parts.join(', ')} }`;
};

// 序列化时复刻仓库既有 JSON 风格（顶层 2 空格缩进、对象单行紧凑、
// 对象数组多行），从而整文件重写也只产生最小 diff。
const repoStringify = (data: unknown): string => {
  if (Array.isArray(data)) {
    if (data.length === 0) return '[ ]';
    const items = data.map((it) => '  ' + repValue(it, '  ')).join(',\n');
    return `[\n${items}\n]`;
  }
  return repObj(data as Record<string, unknown>, '');
};

export const readJson = async <T>(p: string): Promise<T> =>
  JSON.parse(await readFile(p, 'utf8')) as T;

export const writeJson = async (p: string, data: unknown): Promise<void> => {
  await writeFile(p, repoStringify(data) + '\n', 'utf8');
};

export const flattenSubs = (
  categories: Category[]
): Array<SubCategory & { categoryId: string; categoryName: string }> =>
  categories.flatMap((c) =>
    (c.subCategories ?? []).map((s) => ({ categoryId: c.id, categoryName: c.name, ...s }))
  );
