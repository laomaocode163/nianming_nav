/**
 * UI / 交互状态 store
 * 集中管理与原生数据无关的交互态：选中分类、搜索、侧边栏、分页等。
 * 与 useDataStore（静态数据）分离，避免职责混淆、便于测试。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SearchMode } from '../types'

export const useUiStore = defineStore('ui', () => {
  // 分类选择
  const selectedCategoryId = ref<string>('all')
  const selectedSubCategoryId = ref<string | null>(null)

  // 搜索
  const searchQuery = ref('')
  const searchMode = ref<SearchMode>('internal')

  // 侧边栏
  const sidebarOpen = ref(true)
  const sidebarCollapsed = ref(false)

  // 分页
  const currentPage = ref(1)
  const pageSize = ref(20)

  const selectCategory = (categoryId: string): void => {
    selectedCategoryId.value = categoryId
    selectedSubCategoryId.value = null
    currentPage.value = 1
  }

  const selectSubCategory = (subCategoryId: string | null): void => {
    selectedSubCategoryId.value = subCategoryId
    currentPage.value = 1
  }

  const updateSearchQuery = (query: string): void => {
    searchQuery.value = query
  }

  const updateSearchMode = (mode: SearchMode): void => {
    searchMode.value = mode
  }

  const toggleSearchMode = (): void => {
    searchMode.value = searchMode.value === 'external' ? 'internal' : 'external'
  }

  const toggleSidebar = (): void => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const closeSidebar = (): void => {
    sidebarOpen.value = false
  }

  const toggleSidebarCollapse = (): void => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setPage = (page: number): void => {
    currentPage.value = page
  }

  return {
    selectedCategoryId,
    selectedSubCategoryId,
    searchQuery,
    searchMode,
    sidebarOpen,
    sidebarCollapsed,
    currentPage,
    pageSize,
    selectCategory,
    selectSubCategory,
    updateSearchQuery,
    updateSearchMode,
    toggleSearchMode,
    toggleSidebar,
    closeSidebar,
    toggleSidebarCollapse,
    setPage,
  }
})
