/**
 * 数据存储模块
 * 数据从 src/config/sites.ts 静态加载
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SITE_CONFIG } from '../config/sites'
import { extractDomain, getFaviconUrl } from '../utils/faviconService'
import type { Link, Category, SubCategory, SearchConfig, SiteSettings } from '../types'

export const useDataStore = defineStore('data', () => {
  const links = ref<Link[]>(SITE_CONFIG.links)
  const categories = ref<Category[]>(SITE_CONFIG.categories)
  const settings = ref<SiteSettings>(SITE_CONFIG.settings)
  const searchConfig = ref<SearchConfig>(SITE_CONFIG.searchConfig)
  const searchQuery = ref('')
  const searchMode = ref('internal') // 'external' 或 'internal'

  // 按分类和可选的二级分类过滤链接
  const getLinksByCategory = (categoryId: string, subCategoryId?: string | null): Link[] => {
    let filteredLinks
    if (categoryId === 'all') {
      filteredLinks = links.value.filter(link => !link.hidden)
    } else {
      filteredLinks = links.value.filter(link => link.categoryId === categoryId && !link.hidden)
    }

    // 二级分类过滤
    if (subCategoryId) {
      filteredLinks = filteredLinks.filter(link => link.subCategoryId === subCategoryId)
    }

    if (searchMode.value === 'internal' && searchQuery.value.trim()) {
      const searchTerm = searchQuery.value.toLowerCase().trim()
      filteredLinks = filteredLinks.filter(link =>
        link.name.toLowerCase().includes(searchTerm) ||
        (link.description && link.description.toLowerCase().includes(searchTerm)) ||
        link.url.toLowerCase().includes(searchTerm)
      )
    }

    return filteredLinks.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  // 获取指定分类下的二级分类列表
  const getSubCategories = (categoryId: string): SubCategory[] => {
    const category = categories.value.find(cat => cat.id === categoryId)
    return category?.subCategories?.sort((a, b) => (a.order || 0) - (b.order || 0)) || []
  }

  const visibleCategories = computed(() => {
    return categories.value.filter(cat => !cat.hidden)
  })

  const getLinkIcon = (link: Link): string => {
    if (!link || !link.url) return ''
    const domain = extractDomain(link.url)
    return getFaviconUrl(domain)
  }

  const updateSearchConfig = (newConfig: Partial<SearchConfig>): void => {
    searchConfig.value = { ...searchConfig.value, ...newConfig }
  }

  const updateSearchQuery = (query: string): void => {
    searchQuery.value = query
  }

  const updateSearchMode = (mode: 'external' | 'internal'): void => {
    searchMode.value = mode
  }

  return {
    links,
    categories,
    settings,
    searchConfig,
    searchQuery,
    searchMode,
    getLinksByCategory,
    getSubCategories,
    visibleCategories,
    getLinkIcon,
    updateSearchConfig,
    updateSearchQuery,
    updateSearchMode
  }
})
