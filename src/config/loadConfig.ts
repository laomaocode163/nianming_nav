/**
 * 配置加载（异步、惰性）
 * 在运行时校验静态 JSON 并聚合为 SITE_CONFIG，但推迟到首次调用时执行，
 * 且 Zod 与 JSON 通过动态 import 进入独立 chunk，不进入首屏 entry bundle。
 */
import type { Link, Category, SiteSettings, SearchConfig } from '../types';
import categoriesData from './data/categories.json';
import linksData from './data/links.json';
import searchData from './data/search.json';
import settingsData from './data/settings.json';

export interface SiteConfig {
  categories: Category[];
  links: Link[];
  searchConfig: SearchConfig;
  settings: SiteSettings;
}

/** 校验分类/二级分类/链接的引用完整性与 ID 唯一性；失败抛出 Error */
export const validateReferentialIntegrity = (categories: Category[], links: Link[]): void => {
  const categoryIds = new Set(categories.map((cat) => cat.id));
  const subCategoryIdsByCategory = new Map<string, Set<string>>(
    categories.map((cat) => [cat.id, new Set((cat.subCategories ?? []).map((sub) => sub.id))])
  );

  const assertUnique = (seen: Set<string>, id: string, kind: string): void => {
    if (seen.has(id)) {
      throw new Error(`配置校验失败：存在重复的${kind} ID「${id}」`);
    }
    seen.add(id);
  };

  const seenCategoryIds = new Set<string>();
  for (const cat of categories) {
    assertUnique(seenCategoryIds, cat.id, '分类');
    const seenSubIds = new Set<string>();
    for (const sub of cat.subCategories ?? []) {
      assertUnique(seenSubIds, sub.id, '二级分类');
    }
  }

  const seenLinkIds = new Set<string>();
  for (const link of links) {
    assertUnique(seenLinkIds, link.id, '链接');
    if (!categoryIds.has(link.categoryId)) {
      throw new Error(
        `配置校验失败：链接「${link.name}」(id=${link.id}) 引用了不存在的分类「${link.categoryId}」`
      );
    }
    if (link.subCategoryId) {
      const subs = subCategoryIdsByCategory.get(link.categoryId);
      if (!subs || !subs.has(link.subCategoryId)) {
        throw new Error(
          `配置校验失败：链接「${link.name}」(id=${link.id}) 引用了分类「${link.categoryId}」下不存在的二级分类「${link.subCategoryId}」`
        );
      }
    }
  }
};

const doLoad = async (): Promise<SiteConfig> => {
  const { categoriesSchema, linksSchema, searchConfigSchema, siteSettingsSchema } =
    await import('./schema');

  const categories = categoriesSchema.parse(categoriesData);
  const links = linksSchema.parse(linksData);
  const searchConfig = searchConfigSchema.parse(searchData);
  const settings = siteSettingsSchema.parse(settingsData);

  validateReferentialIntegrity(categories, links);

  return { categories, links, searchConfig, settings };
};

let cached: Promise<SiteConfig> | null = null;

/** 加载并校验站点配置；结果会被缓存，多次调用共享同一 Promise */
export const loadSiteConfig = (): Promise<SiteConfig> => {
  if (!cached) cached = doLoad();
  return cached;
};
