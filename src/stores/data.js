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
  
  // 批量编辑模式状态
  const batchEditMode = ref(false)
  const selectedLinks = ref([])
  const sortMode = ref(false)

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
   * 设置域名的图标
   * @param {string} domain - 域名
   * @param {string} iconUrl - 图标URL
   */
  const setDomainIcon = (domain, iconUrl) => {
    iconMap.value[domain] = iconUrl
    saveData()
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

  const addLink = (data) => {
    let processedUrl = data.url
    if (processedUrl && !processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl
    }

    const categoryLinks = links.value.filter(link =>
      !link.pinned && (data.categoryId === 'all' || link.categoryId === data.categoryId)
    )

    const maxOrder = categoryLinks.length > 0
      ? Math.max(...categoryLinks.map(link => link.order || 0))
      : -1

    const newLink = {
      ...data,
      url: processedUrl,
      id: Date.now().toString(),
      createdAt: Date.now(),
      order: maxOrder + 1,
      pinnedOrder: data.pinned ? links.value.filter(l => l.pinned).length : undefined
    }

    // 删除 icon 字段（不再存储在 link 中）
    delete newLink.icon

    links.value.push(newLink)
    
    // 同步图标
    syncLinkIcon(newLink)
    
    saveData()
    return newLink
  }

  const updateLink = (data) => {
    let processedUrl = data.url
    if (processedUrl && !processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl
    }

    const index = links.value.findIndex(l => l.id === data.id)
    if (index !== -1) {
      const oldLink = links.value[index]
      const oldDomain = extractDomain(oldLink.url)
      const newDomain = extractDomain(processedUrl)
      
      // 更新链接数据（不包含 icon 字段）
      const { icon, ...dataWithoutIcon } = data
      links.value[index] = { ...oldLink, ...dataWithoutIcon, url: processedUrl }
      
      // 如果域名变更，为新域名获取图标
      if (oldDomain !== newDomain) {
        syncLinkIcon(links.value[index])
      }
      
      // 如果有自定义图标，更新映射表
      if (icon && !icon.includes('faviconextractor.com')) {
        iconMap.value[newDomain] = icon
      }
      
      // 清理未使用的图标
      cleanupUnusedIcons()
      
      saveData()
    }
  }

  const deleteLink = (id) => {
    const index = links.value.findIndex(l => l.id === id)
    if (index !== -1) {
      links.value.splice(index, 1)
      
      // 清理未使用的图标
      cleanupUnusedIcons()
      
      saveData()
    }
  }

  const togglePin = (id) => {
    const link = links.value.find(l => l.id === id)
    if (link) {
      link.pinned = !link.pinned
      link.pinnedOrder = link.pinned ? links.value.filter(l => l.pinned).length : undefined
      saveData()
    }
  }

  // ========== 分类管理 ==========

  const addCategory = (data) => {
    const newCategory = {
      ...data,
      id: data.id || Date.now().toString()
    }
    categories.value.push(newCategory)
    saveData()
    return newCategory
  }

  const updateCategory = (data) => {
    const index = categories.value.findIndex(c => c.id === data.id)
    if (index !== -1) {
      categories.value[index] = { ...categories.value[index], ...data }
      saveData()
    }
  }

  const deleteCategory = (id) => {
    if (categories.value.length <= 1) {
      return false
    }

    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categories.value.splice(index, 1)
      const fallbackCategory = categories.value.find(c => c.id === 'common') || categories.value[0]
      links.value.forEach(link => {
        if (link.categoryId === id) {
          link.categoryId = fallbackCategory.id
        }
      })
      saveData()
      return true
    }
    return false
  }

  const reorderLinks = (activeId, overId, categoryId) => {
    if (activeId === overId) return

    // 只处理非置顶的链接
    const categoryLinks = links.value
      .filter(link => !link.pinned && (categoryId === 'all' || link.categoryId === categoryId))
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    const activeIndex = categoryLinks.findIndex(link => link.id === activeId)
    const overIndex = categoryLinks.findIndex(link => link.id === overId)

    if (activeIndex !== -1 && overIndex !== -1) {
      const [removed] = categoryLinks.splice(activeIndex, 1)
      categoryLinks.splice(overIndex, 0, removed)

      categoryLinks.forEach((link, index) => {
        const originalLink = links.value.find(l => l.id === link.id)
        if (originalLink) {
          originalLink.order = index
        }
      })

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

  const importData = (data) => {
    if (data.links && Array.isArray(data.links)) {
      data.links.forEach(newLink => {
        if (!links.value.some(l => l.id === newLink.id)) {
          // 迁移导入数据的图标
          if (newLink.icon) {
            const domain = extractDomain(newLink.url)
            if (!iconMap.value[domain]) {
              iconMap.value[domain] = newLink.icon
            }
            delete newLink.icon
          }
          links.value.push(newLink)
          syncLinkIcon(newLink)
        }
      })
    }

    if (data.categories && Array.isArray(data.categories)) {
      data.categories.forEach(newCategory => {
        if (!categories.value.some(c => c.id === newCategory.id)) {
          categories.value.push(newCategory)
        }
      })
    }
    
    // 导入时合并 iconMap
    if (data.iconMap && typeof data.iconMap === 'object') {
      iconMap.value = { ...iconMap.value, ...data.iconMap }
    }

    saveData()
  }

  const exportData = () => {
    return {
      links: links.value,
      categories: categories.value,
      settings: settings.value,
      searchConfig: searchConfig.value,
      iconMap: iconMap.value,
      exportedAt: Date.now()
    }
  }

  const resetData = () => {
    links.value = [...INITIAL_LINKS]
    categories.value = [...DEFAULT_CATEGORIES]
    settings.value = { ...DEFAULT_SITE_SETTINGS }
    searchConfig.value = { ...DEFAULT_SEARCH_CONFIG }
    iconMap.value = {}
    batchEditMode.value = false
    selectedLinks.value = []
    sortMode.value = false
    saveData()
  }

  // ========== 批量编辑功能 ==========

  const toggleBatchEditMode = () => {
    if (sortMode.value) {
      // 如果当前是排序模式，先退出排序模式
      sortMode.value = false
    }
    batchEditMode.value = !batchEditMode.value
    if (!batchEditMode.value) {
      selectedLinks.value = []
    }
  }

  const toggleSortMode = () => {
    if (batchEditMode.value) {
      // 如果当前是批量编辑模式，先退出批量编辑模式
      batchEditMode.value = false
      selectedLinks.value = []
    }
    sortMode.value = !sortMode.value
  }

  const toggleLinkSelection = (linkId) => {
    const index = selectedLinks.value.indexOf(linkId)
    if (index === -1) {
      selectedLinks.value = [...selectedLinks.value, linkId]
    } else {
      selectedLinks.value = selectedLinks.value.filter(id => id !== linkId)
    }
  }

  const selectAllLinks = (categoryId) => {
    const categoryLinks = links.value.filter(link => 
      (categoryId === 'all' || link.categoryId === categoryId) && !link.hidden
    )
    selectedLinks.value = [...categoryLinks.map(link => link.id)]
  }

  const deselectAllLinks = () => {
    selectedLinks.value = []
  }

  const batchTogglePin = () => {
    selectedLinks.value.forEach(id => {
      const link = links.value.find(l => l.id === id)
      if (link) {
        if (link.pinned) {
          // 取消置顶
          link.pinned = false
          link.pinnedOrder = undefined
          // 重新计算其他置顶链接的顺序
          const pinnedLinks = links.value.filter(l => l.pinned)
          pinnedLinks.forEach((l, index) => {
            l.pinnedOrder = index + 1
          })
        } else {
          // 置顶
          link.pinned = true
          link.pinnedOrder = links.value.filter(l => l.pinned).length
        }
      }
    })
    saveData()
  }

  const batchDelete = () => {
    links.value = links.value.filter(link => !selectedLinks.value.includes(link.id))
    cleanupUnusedIcons()
    selectedLinks.value = []
    saveData()
  }

  const batchMove = (targetCategoryId) => {
    selectedLinks.value.forEach(id => {
      const link = links.value.find(l => l.id === id)
      if (link) {
        link.categoryId = targetCategoryId
      }
    })
    selectedLinks.value = []
    saveData()
  }

  return {
    links,
    categories,
    settings,
    searchConfig,
    iconMap,
    isLoaded,
    batchEditMode,
    selectedLinks,
    sortMode,
    pinnedLinks,
    getLinksByCategory,
    visibleCategories,
    loadData,
    saveData,
    addLink,
    updateLink,
    deleteLink,
    togglePin,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderLinks,
    updateSettings,
    updateSearchConfig,
    importData,
    exportData,
    resetData,
    // 批量编辑方法
    toggleBatchEditMode,
    toggleSortMode,
    toggleLinkSelection,
    selectAllLinks,
    deselectAllLinks,
    batchTogglePin,
    batchDelete,
    batchMove,
    // 图标管理方法
    getLinkIcon,
    setDomainIcon,
    syncLinkIcon,
    cleanupUnusedIcons
  }
})
