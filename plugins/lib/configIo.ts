/**
 * 本地开发期管理后台的 JSON 读取层（仅 dev server 使用）。
 * 路径常量与读取函数集中于此，供 devAdminApi 路由层复用。
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Category, SubCategory } from '../../src/config/schema';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '..', '..');
export const CATEGORIES_PATH = resolve(ROOT, 'src/config/data/categories.json');
export const LINKS_PATH = resolve(ROOT, 'src/config/data/links.json');
export const SEARCH_PATH = resolve(ROOT, 'src/config/data/search.json');
export const SETTINGS_PATH = resolve(ROOT, 'src/config/data/settings.json');

export const readJson = async <T>(p: string): Promise<T> =>
  JSON.parse(await readFile(p, 'utf8')) as T;

export const flattenSubs = (
  categories: Category[]
): Array<SubCategory & { categoryId: string; categoryName: string }> =>
  categories.flatMap((c) =>
    (c.subCategories ?? []).map((s) => ({ categoryId: c.id, categoryName: c.name, ...s }))
  );
