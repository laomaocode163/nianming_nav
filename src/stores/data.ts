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

  const updateSettings = (newSettings: Partial<SiteSettings>): void => {
    settings.value = { ...settings.value, ...newSettings }
  }

  return {
    links,
    categories,
    settings,
    searchConfig,
    pinnedLinks,
    getLinksByCategory,
    visibleCategories,
    getLinkIcon,
    updateSearchConfig,
    updateSettings
  }
})
