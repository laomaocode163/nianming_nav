/**
 * 数据存储模块
 * 数据从 src/config/sites.ts 静态加载，不再使用 localStorage
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  SITE_CONFIG,
} from '../config/sites'
import { extractDomain } from '../utils/faviconService'
import type { Link, Category, SearchConfig, SiteSettings } from '../types'

export const useDataStore = defineStore('data', () => {
  const links = ref<Link[]>(SITE_CONFIG.links)
  const categories = ref<Category[]>(SITE_CONFIG.categories)
  const settings = ref<SiteSettings>(SITE_CONFIG.settings)
  const searchConfig = ref<SearchConfig>(SITE_CONFIG.searchConfig)
  const searchQuery = ref('')
  const searchMode = ref('external') // 'external' 或 'internal'

  const pinnedLinks = computed(() => {
    return links.value
      .filter(link => link.pinned)
      .sort((a, b) => (a.pinnedOrder || 0) - (b.pinnedOrder || 0))
  })

  const getLinksByCategory = computed(() => {
    return (categoryId: string) => {
      let filteredLinks
      if (categoryId === 'all') {
        filteredLinks = links.value.filter(link => !link.hidden)
      } else {
        filteredLinks = links.value.filter(link => link.categoryId === categoryId && !link.hidden)
      }
      
      // 过滤网站搜索结果
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
  })

  const visibleCategories = computed(() => {
    return categories.value.filter(cat => !cat.hidden)
  })

  const getLinkIcon = (link: Link): string => {
    if (!link || !link.url) return ''
    const domain = extractDomain(link.url)
    return `https://www.faviconextractor.com/favicon/${domain}?larger=true`
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

  const updateSettings = (newSettings: Partial<SiteSettings>): void => {
    settings.value = { ...settings.value, ...newSettings }
  }

  return {
    links,
    categories,
    settings,
    searchConfig,
    searchQuery,
    searchMode,
    pinnedLinks,
    getLinksByCategory,
    visibleCategories,
    getLinkIcon,
    updateSearchConfig,
    updateSearchQuery,
    updateSearchMode,
    updateSettings
  }
})
