import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  DEFAULT_CATEGORIES,
  INITIAL_LINKS,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_SEARCH_CONFIG,
  DEFAULT_ICON_PLACEHOLDER
} from '../utils/constants'
import { extractDomain } from '../utils/faviconService'

const LOCAL_STORAGE_KEY = 'nianming_nav_data'

export const useDataStore = defineStore('data', () => {
  const links = ref([])
  const categories = ref([])
  const settings = ref({ ...DEFAULT_SITE_SETTINGS })
  const searchConfig = ref({ ...DEFAULT_SEARCH_CONFIG })
  const iconMap = ref({}) // 域名 -> 图标URL的映射表
  const isLoaded = ref(false)

  const pinnedLinks = computed(() => {
    return links.value
      .filter(link => link.pinned)
      .sort((a, b) => (a.pinnedOrder || 0) - (b.pinnedOrder || 0))
  })

  const getLinksByCategory = computed(() => {
    return (categoryId) => {
      let filteredLinks
      if (categoryId === 'all') {
        filteredLinks = links.value.filter(link => !link.hidden)
      } else {
        filteredLinks = links.value.filter(link => link.categoryId === categoryId && !link.hidden)
      }
      // 按order属性排序
      return filteredLinks.sort((a, b) => (a.order || 0) - (b.order || 0))
    }
  })

  const visibleCategories = computed(() => {
    return categories.value.filter(cat => !cat.hidden)
  })

  // ========== 图标管理方法 ==========

  /**
   * 获取网站的图标URL
   * @param {Object} link - 网站对象
   * @returns {string} 图标URL
   */
  const getLinkIcon = (link) => {
    if (!link || !link.url) return DEFAULT_ICON_PLACEHOLDER
    
    const domain = extractDomain(link.url)
    // 优先使用映射表中的图标
    if (iconMap.value[domain]) {
      return iconMap.value[domain]
    }
    // 返回默认图标
    return DEFAULT_ICON_PLACEHOLDER
  }

  /**
   * 从API获取域名的图标
   * @param {string} domain - 域名
   * @returns {string} 图标URL
   */
  const fetchIconForDomain = (domain) => {
    return `https://www.faviconextractor.com/favicon/${domain}?larger=true`
  }

  /**
   * 同步网站图标（如果域名没有图标则自动获取）
   * @param {Object} link - 网站对象
   */
  const syncLinkIcon = (link) => {
    if (!link || !link.url) return
    
    const domain = extractDomain(link.url)
    // 如果该域名还没有图标，自动生成图标URL
    if (!iconMap.value[domain]) {
      iconMap.value[domain] = fetchIconForDomain(domain)
    }
  }

  /**
   * 清理未使用的图标
   */
  const cleanupUnusedIcons = () => {
    const usedDomains = new Set(
      links.value.map(link => extractDomain(link.url))
    )
    
    // 删除未使用的图标
    Object.keys(iconMap.value).forEach(domain => {
      if (!usedDomains.has(domain)) {
        delete iconMap.value[domain]
      }
    })
    
    saveData()
  }

  /**
   * 数据迁移：从旧格式迁移到新格式
   * 将 link.icon 迁移到 iconMap
   */
  const migrateIconData = () => {
    let hasMigration = false
    
    links.value.forEach(link => {
      // 如果链接有自定义图标，迁移到 iconMap
      if (link.icon && !link.icon.includes('faviconextractor.com')) {
        const domain = extractDomain(link.url)
        if (!iconMap.value[domain]) {
          iconMap.value[domain] = link.icon
          hasMigration = true
        }
        // 删除 link.icon 字段
        delete link.icon
      }
      
      // 为所有链接同步图标
      syncLinkIcon(link)
    })
    
    if (hasMigration) {
      console.log('Icon data migration completed')
      saveData()
    }
  }

  // ========== 数据加载与保存 ==========

  const loadData = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        links.value = parsed.links || [...INITIAL_LINKS]
        categories.value = parsed.categories && parsed.categories.length > 0
          ? parsed.categories
          : [...DEFAULT_CATEGORIES]
        settings.value = { ...DEFAULT_SITE_SETTINGS, ...parsed.settings }
        searchConfig.value = { ...DEFAULT_SEARCH_CONFIG, ...parsed.searchConfig }
        iconMap.value = parsed.iconMap || {}
      } else {
        links.value = [...INITIAL_LINKS]
        categories.value = [...DEFAULT_CATEGORIES]
        settings.value = { ...DEFAULT_SITE_SETTINGS }
        searchConfig.value = { ...DEFAULT_SEARCH_CONFIG }
        iconMap.value = {}
      }

      const commonIndex = categories.value.findIndex(c => c.id === 'common')
      if (commonIndex > 0) {
        const commonCategory = categories.value[commonIndex]
        categories.value.splice(commonIndex, 1)
        categories.value.unshift(commonCategory)
      }

      // 数据迁移（从旧格式到新格式）
      migrateIconData()
      
      // 清理未使用的图标
      cleanupUnusedIcons()
    } catch (e) {
      console.error('Failed to load data:', e)
      links.value = [...INITIAL_LINKS]
      categories.value = [...DEFAULT_CATEGORIES]
      settings.value = { ...DEFAULT_SITE_SETTINGS }
      searchConfig.value = { ...DEFAULT_SEARCH_CONFIG }
      iconMap.value = {}
    }
    isLoaded.value = true
  }

  const saveData = () => {
    try {
      const data = {
        links: links.value,
        categories: categories.value,
        settings: settings.value,
        searchConfig: searchConfig.value,
        iconMap: iconMap.value
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save data:', e)
    }
  }

  // ========== 链接管理 ==========

  const togglePin = (id) => {
    const link = links.value.find(l => l.id === id)
    if (link) {
      link.pinned = !link.pinned
      link.pinnedOrder = link.pinned ? links.value.filter(l => l.pinned).length : undefined
      saveData()
    }
  }

  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }
    saveData()
  }

  const updateSearchConfig = (newConfig) => {
    searchConfig.value = { ...searchConfig.value, ...newConfig }
    saveData()
  }

  return {
    links,
    categories,
    settings,
    searchConfig,
    iconMap,
    isLoaded,
    pinnedLinks,
    getLinksByCategory,
    visibleCategories,
    loadData,
    saveData,
    togglePin,
    updateSettings,
    updateSearchConfig,
    // 图标管理方法
    getLinkIcon,
    syncLinkIcon,
    fetchIconForDomain,
    cleanupUnusedIcons
  }
})
