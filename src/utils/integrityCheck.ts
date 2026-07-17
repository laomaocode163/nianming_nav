/**
 * 配置健康检查纯函数（后台「数据检查」使用，可单测）。
 * 复用与 loadConfig.validateReferentialIntegrity 一致的口径，但改为「收集问题列表」
 * 而非抛错，便于在后台以报告形式展示。
 */
import type { Category, Link } from '@/types';

export interface OrphanLink {
  link: Link;
  reason: string;
}

/** 找出引用了不存在分类 / 二级分类的孤儿链接 */
export const findOrphanLinks = (categories: Category[], links: Link[]): OrphanLink[] => {
  const categoryIds = new Set(categories.map((c) => c.id));
  const subIdsByCat = new Map<string, Set<string>>(
    categories.map((c) => [c.id, new Set((c.subCategories ?? []).map((s) => s.id))])
  );

  const orphans: OrphanLink[] = [];
  for (const link of links) {
    if (!categoryIds.has(link.categoryId)) {
      orphans.push({
        link,
        reason: `引用了不存在的分类「${link.categoryId}」`,
      });
      continue;
    }
    if (link.subCategoryId) {
      const subs = subIdsByCat.get(link.categoryId);
      if (!subs || !subs.has(link.subCategoryId)) {
        orphans.push({
          link,
          reason: `引用了分类「${link.categoryId}」下不存在的二级分类「${link.subCategoryId}」`,
        });
      }
    }
  }
  return orphans;
};

/** 归一化 URL：去首尾空白、转小写、去末尾斜杠，用于重复判定 */
export const normalizeUrl = (url: string): string => url.trim().toLowerCase().replace(/\/+$/, '');

export interface DuplicateGroup {
  key: string;
  items: Link[];
}

/** 找出重复 URL（归一化后相同的多条链接） */
export const findDuplicateUrls = (links: Link[]): DuplicateGroup[] => {
  const groups = new Map<string, Link[]>();
  for (const link of links) {
    const key = normalizeUrl(link.url);
    const arr = groups.get(key);
    if (arr) arr.push(link);
    else groups.set(key, [link]);
  }
  return [...groups.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({ key, items }));
};
