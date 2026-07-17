/**
 * UI / 交互状态 store
 * 集中管理与原生数据无关的交互态：选中分类、搜索、侧边栏、分页等。
 * 与 useDataStore（静态数据）分离，避免职责混淆、便于测试。
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SearchMode } from '../types';

/** 卡片密度：舒适（默认）/ 紧凑 */
export type Density = 'comfortable' | 'compact';
const DENSITY_KEY = 'nav_density';

const readDensity = (): Density => {
  try {
    const saved = localStorage.getItem(DENSITY_KEY);
    if (saved === 'compact' || saved === 'comfortable') return saved;
  } catch {
    /* 忽略隐私模式等读取失败 */
  }
  return 'comfortable';
};

export const useUiStore = defineStore('ui', () => {
  // 分类选择
  const selectedCategoryId = ref<string>('all');
  const selectedSubCategoryId = ref<string | null>(null);

  // 搜索
  const searchQuery = ref('');
  const searchMode = ref<SearchMode>('internal');

  // 侧边栏
  const sidebarOpen = ref(true);
  const sidebarCollapsed = ref(false);

  // 分页
  const currentPage = ref(1);
  const pageSize = ref(20);

  // 卡片密度（持久化到 localStorage）
  const density = ref<Density>(readDensity());

  const setDensity = (value: Density): void => {
    density.value = value;
    try {
      localStorage.setItem(DENSITY_KEY, value);
    } catch {
      /* 忽略写入失败 */
    }
  };

  const selectCategory = (categoryId: string): void => {
    selectedCategoryId.value = categoryId;
    selectedSubCategoryId.value = null;
    currentPage.value = 1;
  };

  const selectSubCategory = (subCategoryId: string | null): void => {
    selectedSubCategoryId.value = subCategoryId;
    currentPage.value = 1;
  };

  const updateSearchQuery = (query: string): void => {
    searchQuery.value = query;
    // 搜索词变化后结果集可能不足当前页码，重置到第一页，避免切片越界显示空白页
    currentPage.value = 1;
  };

  const toggleSearchMode = (): void => {
    searchMode.value = searchMode.value === 'external' ? 'internal' : 'external';
  };

  const toggleSidebar = (): void => {
    sidebarOpen.value = !sidebarOpen.value;
  };

  const closeSidebar = (): void => {
    sidebarOpen.value = false;
  };

  const toggleSidebarCollapse = (): void => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  return {
    selectedCategoryId,
    selectedSubCategoryId,
    searchQuery,
    searchMode,
    sidebarOpen,
    sidebarCollapsed,
    currentPage,
    pageSize,
    density,
    setDensity,
    selectCategory,
    selectSubCategory,
    updateSearchQuery,
    toggleSearchMode,
    toggleSidebar,
    closeSidebar,
    toggleSidebarCollapse,
  };
});
