/**
 * 管理后台 store（仅本地开发使用，只读面板）。
 * 持有各类数据列表，封装 adminApi 的 GET 读取；不含任何写操作。
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminApi, type SubCategoryView } from '@/services/adminApi';
import type { Category, Link, SearchConfig, SiteSettings } from '@/types';

export const useAdminStore = defineStore('admin', () => {
  const categories = ref<Category[]>([]);
  const links = ref<Link[]>([]);
  const subCategories = ref<SubCategoryView[]>([]);
  const settings = ref<SiteSettings>({});
  const searchConfig = ref<SearchConfig>({ selectedSourceId: '', externalSources: [] });
  const loading = ref(false);

  const refreshCategories = async (): Promise<void> => {
    categories.value = await adminApi.getCategories();
  };
  const refreshLinks = async (): Promise<void> => {
    links.value = await adminApi.getLinks();
  };
  const refreshSubs = async (): Promise<void> => {
    subCategories.value = await adminApi.getSubCategories();
  };
  const refreshSettings = async (): Promise<void> => {
    settings.value = await adminApi.getSettings();
  };
  const refreshSearch = async (): Promise<void> => {
    searchConfig.value = await adminApi.getSearchConfig();
  };

  const loadAll = async (): Promise<void> => {
    loading.value = true;
    try {
      await Promise.all([
        refreshCategories(),
        refreshLinks(),
        refreshSubs(),
        refreshSettings(),
        refreshSearch(),
      ]);
    } finally {
      loading.value = false;
    }
  };

  return {
    categories,
    links,
    subCategories,
    settings,
    searchConfig,
    loading,
    loadAll,
    refreshCategories,
    refreshLinks,
    refreshSubs,
    refreshSettings,
    refreshSearch,
  };
});
