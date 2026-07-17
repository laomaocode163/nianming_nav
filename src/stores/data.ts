/**
 * 数据存储模块
 * 仅承载静态导航数据（来自 src/config/loadConfig.ts）与派生 getter。
 * 交互态（搜索词、搜索模式、选中分类、侧边栏、分页等）统一放在 useUiStore。
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loadSiteConfig, invalidateSiteConfigCache } from '../config/loadConfig';
import { extractDomain, getCachedFavicon } from '../services/faviconService';
import { useUserPrefsStore } from './userPrefs';
import type { Link, Category, SubCategory, SearchConfig, SearchMode } from '../types';

export const useDataStore = defineStore('data', () => {
  const ready = ref(false);
  const links = ref<Link[]>([]);
  const categories = ref<Category[]>([]);
  const searchConfig = ref<SearchConfig | null>(null);

  /** 异步加载并校验配置（Zod 校验在独立 chunk 中执行，不阻塞首屏） */
  const init = async (): Promise<void> => {
    if (ready.value) return;
    const config = await loadSiteConfig();
    links.value = config.links;
    categories.value = config.categories;
    searchConfig.value = config.searchConfig;
    ready.value = true;

    // 数据就绪后将旧版以 link.id 存储的收藏 / 最近访问迁移为稳定的 URL 主键，
    // 使重编号等改 id 操作不再令用户收藏失效。
    const prefs = useUserPrefsStore();
    prefs.migrateFromIds(config.links);

    // 记忆上次选中的搜索引擎（刷新后保持，由 userPrefs 统一持久化）
    const savedSource = prefs.state.selectedSearchSourceId;
    if (savedSource && config.searchConfig.externalSources.some((s) => s.id === savedSource)) {
      updateSearchConfig({ selectedSourceId: savedSource });
    }
  };

  /** 重新加载配置（dev 管理后台写盘后调用），即时反映最新数据 */
  const reload = async (): Promise<void> => {
    ready.value = false;
    invalidateSiteConfigCache();
    await init();
  };

  // 预排序、过滤隐藏的链接（一次计算，多处复用）
  const visibleLinks = computed(() =>
    links.value.filter((l) => !l.hidden).sort((a, b) => (a.order || 0) - (b.order || 0))
  );

  // Map<categoryId, Link[]> — 按一级分类预分组（已排序）
  const linksByCategoryId = computed(() => {
    const map = new Map<string, Link[]>();
    for (const link of visibleLinks.value) {
      const arr = map.get(link.categoryId);
      if (arr) arr.push(link);
      else map.set(link.categoryId, [link]);
    }
    return map;
  });

  // Map<`${categoryId}:${subCategoryId}`, Link[]> — 按二级分类预分组（已排序）
  const linksBySubCategory = computed(() => {
    const map = new Map<string, Link[]>();
    for (const link of visibleLinks.value) {
      if (!link.subCategoryId) continue;
      const key = `${link.categoryId}:${link.subCategoryId}`;
      const arr = map.get(key);
      if (arr) arr.push(link);
      else map.set(key, [link]);
    }
    return map;
  });

  // 按分类和可选的二级分类过滤链接（查表 O(1)，不再每调用遍历）
  // 搜索词与模式由调用方显式传入，去除对 useUiStore 的反向依赖，便于测试。
  const getLinksByCategory = (
    categoryId: string,
    subCategoryId?: string | null,
    searchQuery?: string,
    searchMode: SearchMode = 'internal'
  ): Link[] => {
    let filteredLinks: Link[];
    if (subCategoryId) {
      filteredLinks = linksBySubCategory.value.get(`${categoryId}:${subCategoryId}`) || [];
    } else if (categoryId === 'all') {
      filteredLinks = visibleLinks.value;
    } else {
      filteredLinks = linksByCategoryId.value.get(categoryId) || [];
    }

    // 站内搜索（实时过滤）
    if (searchMode === 'internal' && searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      filteredLinks = filteredLinks.filter(
        (link) =>
          link.name.toLowerCase().includes(searchTerm) ||
          (link.description && link.description.toLowerCase().includes(searchTerm)) ||
          link.url.toLowerCase().includes(searchTerm)
      );
    }

    return filteredLinks;
  };

  // 获取指定分类下的二级分类列表
  const getSubCategories = (categoryId: string): SubCategory[] => {
    const category = categories.value.find((cat) => cat.id === categoryId);
    return category?.subCategories?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
  };

  const visibleCategories = computed(() => {
    return categories.value.filter((cat) => !cat.hidden);
  });

  const getLinkIcon = (link: Link): string => {
    if (!link || !link.url) return '';
    const domain = extractDomain(link.url);
    return getCachedFavicon(domain);
  };

  const updateSearchConfig = (newConfig: Partial<SearchConfig>): void => {
    if (!searchConfig.value) return;
    searchConfig.value = { ...searchConfig.value, ...newConfig };
  };

  /** 导入恢复：用外部传入的完整站点配置替换运行时内存数据并失效缓存 */
  const applySiteConfig = (config: {
    categories: Category[];
    links: Link[];
    searchConfig: SearchConfig;
  }): void => {
    categories.value = config.categories;
    links.value = config.links;
    searchConfig.value = config.searchConfig;
    invalidateSiteConfigCache();
  };

  return {
    ready,
    init,
    reload,
    links,
    categories,
    searchConfig,
    visibleLinks,
    getLinksByCategory,
    getSubCategories,
    visibleCategories,
    getLinkIcon,
    updateSearchConfig,
    applySiteConfig,
  };
});
