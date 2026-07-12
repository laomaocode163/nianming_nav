import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUiStore } from '../../src/stores/ui';

describe('uiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('default state', () => {
    const store = useUiStore();
    expect(store.selectedCategoryId).toBe('all');
    expect(store.selectedSubCategoryId).toBeNull();
    expect(store.searchMode).toBe('internal');
    expect(store.currentPage).toBe(1);
    expect(store.pageSize).toBe(20);
  });

  it('selectCategory resets sub-category and page', () => {
    const store = useUiStore();
    store.selectSubCategory('sub1');
    store.setPage(3);
    store.selectCategory('cat1');
    expect(store.selectedCategoryId).toBe('cat1');
    expect(store.selectedSubCategoryId).toBeNull();
    expect(store.currentPage).toBe(1);
  });

  it('selectSubCategory resets page only', () => {
    const store = useUiStore();
    store.setPage(5);
    store.selectSubCategory('sub1');
    expect(store.selectedSubCategoryId).toBe('sub1');
    expect(store.currentPage).toBe(1);
  });

  it('toggleSearchMode flips internal/external', () => {
    const store = useUiStore();
    expect(store.searchMode).toBe('internal');
    store.toggleSearchMode();
    expect(store.searchMode).toBe('external');
    store.toggleSearchMode();
    expect(store.searchMode).toBe('internal');
  });

  it('setPage updates currentPage', () => {
    const store = useUiStore();
    store.setPage(7);
    expect(store.currentPage).toBe(7);
  });

  it('updateSearchQuery resets currentPage to 1', () => {
    const store = useUiStore();
    store.setPage(4);
    store.updateSearchQuery('vue');
    expect(store.searchQuery).toBe('vue');
    // 搜索词变化后结果集可能不足当前页码，应重置到第一页避免空白页
    expect(store.currentPage).toBe(1);
  });

  it('toggleSidebar / closeSidebar manage sidebarOpen', () => {
    const store = useUiStore();
    const initial = store.sidebarOpen;
    store.toggleSidebar();
    expect(store.sidebarOpen).toBe(!initial);
    store.closeSidebar();
    expect(store.sidebarOpen).toBe(false);
  });
});
