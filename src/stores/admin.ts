/**
 * 管理后台 store（仅本地开发使用）
 * 持有三类数据列表，封装 adminApi 调用；写盘成功后触发站点数据 reload，
 * 使前台即时反映最新改动。favicon 自动抓取由 AdminLinks 组件按开关调用。
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminApi, type SubCategoryView } from '@/services/adminApi';
import { useDataStore } from './data';
import type { Category, Link, SubCategory } from '@/types';

export const useAdminStore = defineStore('admin', () => {
  const categories = ref<Category[]>([]);
  const links = ref<Link[]>([]);
  const subCategories = ref<SubCategoryView[]>([]);
  const loading = ref(false);
  const autoFetchFavicons = ref(true);

  const refreshCategories = async (): Promise<void> => {
    categories.value = await adminApi.getCategories();
  };
  const refreshLinks = async (): Promise<void> => {
    links.value = await adminApi.getLinks();
  };
  const refreshSubs = async (): Promise<void> => {
    subCategories.value = await adminApi.getSubCategories();
  };

  const loadAll = async (): Promise<void> => {
    loading.value = true;
    try {
      await Promise.all([refreshCategories(), refreshLinks(), refreshSubs()]);
    } finally {
      loading.value = false;
    }
  };

  /** 写盘后让前台站点重新加载配置 */
  const reloadSite = async (): Promise<void> => {
    await useDataStore().reload();
  };

  const runFetchFavicons = async (force = false): Promise<void> => {
    await adminApi.fetchFavicons(force);
  };

  const createLink = async (link: Link): Promise<Link> => {
    const created = await adminApi.createLink(link);
    await refreshLinks();
    await reloadSite();
    return created;
  };
  const updateLink = async (id: string, link: Link): Promise<Link> => {
    const updated = await adminApi.updateLink(id, link);
    await refreshLinks();
    await reloadSite();
    return updated;
  };
  const deleteLink = async (id: string): Promise<void> => {
    await adminApi.deleteLink(id);
    await refreshLinks();
    await reloadSite();
  };

  const createCategory = async (category: Category): Promise<Category> => {
    const created = await adminApi.createCategory(category);
    await refreshCategories();
    await refreshSubs();
    await reloadSite();
    return created;
  };
  const updateCategory = async (id: string, category: Category): Promise<Category> => {
    const updated = await adminApi.updateCategory(id, category);
    await refreshCategories();
    await refreshSubs();
    await reloadSite();
    return updated;
  };
  const deleteCategory = async (id: string): Promise<void> => {
    await adminApi.deleteCategory(id);
    await refreshCategories();
    await refreshSubs();
    await reloadSite();
  };

  const createSub = async (categoryId: string, sub: SubCategory): Promise<SubCategoryView> => {
    const created = await adminApi.createSubCategory(categoryId, sub);
    await refreshSubs();
    await reloadSite();
    return created;
  };
  const updateSub = async (
    categoryId: string,
    subId: string,
    sub: SubCategory
  ): Promise<SubCategoryView> => {
    const updated = await adminApi.updateSubCategory(categoryId, subId, sub);
    await refreshSubs();
    await reloadSite();
    return updated;
  };
  const deleteSub = async (categoryId: string, subId: string): Promise<void> => {
    await adminApi.deleteSubCategory(categoryId, subId);
    await refreshSubs();
    await reloadSite();
  };

  return {
    categories,
    links,
    subCategories,
    loading,
    autoFetchFavicons,
    loadAll,
    refreshCategories,
    refreshLinks,
    refreshSubs,
    reloadSite,
    runFetchFavicons,
    createLink,
    updateLink,
    deleteLink,
    createCategory,
    updateCategory,
    deleteCategory,
    createSub,
    updateSub,
    deleteSub,
  };
});
