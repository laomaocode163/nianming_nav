/**
 * 数据存储模块
 * 仅承载静态导航数据（来自 src/config/sites.ts）与派生 getter。
 * 交互态（搜索词、搜索模式、选中分类、侧边栏、分页等）统一放在 useUiStore。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SITE_CONFIG } from '../config/sites'
import { extractDomain, getCachedFavicon } from '../services/faviconService'
import { useUiStore } from './ui'
import type { Link, Category, SubCategory, SearchConfig, SiteSettings } from '../types'

export const useDataStore = defineStore('data', () => {
  const links = ref<Link[]>(SITE_CONFIG.links)
  const categories = ref<Category[]>(SITE_CONFIG.categories)
  const settings = ref<SiteSettings>(SITE_CONFIG.settings)
  const searchConfig = ref<SearchConfig>(SITE_CONFIG.searchConfig)

  // 按分类和可选的二级分类过滤链接
  const getLinksByCategory = (categoryId: string, subCategoryId?: string | null): Link[] => {
    const ui = useUiStore()

    let filteredLinks: Link[]
    if (categoryId === 'all') {
      filteredLinks = links.value.filter((link) => !link.hidden)
    } else {
      filteredLinks = links.value.filter(
        (link) => link.categoryId === categoryId && !link.hidden,
      )
    }

    // 二级分类过滤
    if (subCategoryId) {
      filteredLinks = filteredLinks.filter((link) => link.subCategoryId === subCategoryId)
    }

    // 站内搜索（实时过滤）
    if (ui.searchMode === 'internal' && ui.searchQuery.trim()) {
      const searchTerm = ui.searchQuery.toLowerCase().trim()
      filteredLinks = filteredLinks.filter(
        (link) =>
          link.name.toLowerCase().includes(searchTerm) ||
          (link.description && link.description.toLowerCase().includes(searchTerm)) ||
          link.url.toLowerCase().includes(searchTerm),
      )
    }

    return filteredLinks.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  // 获取指定分类下的二级分类列表
  const getSubCategories = (categoryId: string): SubCategory[] => {
    const category = categories.value.find((cat) => cat.id === categoryId)
    return category?.subCategories?.sort((a, b) => (a.order || 0) - (b.order || 0)) || []
  }

  const visibleCategories = computed(() => {
    return categories.value.filter((cat) => !cat.hidden)
  })

  const getLinkIcon = (link: Link): string => {
    if (!link || !link.url) return ''
    const domain = extractDomain(link.url)
    return getCachedFavicon(domain)
  }

  const updateSearchConfig = (newConfig: Partial<SearchConfig>): void => {
    searchConfig.value = { ...searchConfig.value, ...newConfig }
  }

  return {
    links,
    categories,
    settings,
    searchConfig,
    getLinksByCategory,
    getSubCategories,
    visibleCategories,
    getLinkIcon,
    updateSearchConfig,
  }
})
