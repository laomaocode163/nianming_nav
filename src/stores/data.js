import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  DEFAULT_CATEGORIES,
  INITIAL_LINKS,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_SEARCH_CONFIG
} from '../utils/constants'

const LOCAL_STORAGE_KEY = 'nianming_nav_data'

export const useDataStore = defineStore('data', () => {
  const links = ref([])
  const categories = ref([])
  const settings = ref({ ...DEFAULT_SITE_SETTINGS })
  const searchConfig = ref({ ...DEFAULT_SEARCH_CONFIG })
  const isLoaded = ref(false)

  const pinnedLinks = computed(() => {
    return links.value
      .filter(link => link.pinned)
      .sort((a, b) => (a.pinnedOrder || 0) - (b.pinnedOrder || 0))
  })

  const getLinksByCategory = computed(() => {
    return (categoryId) => {
      if (categoryId === 'all') {
        return links.value.filter(link => !link.hidden)
      }
      return links.value.filter(link => link.categoryId === categoryId && !link.hidden)
    }
  })

  const visibleCategories = computed(() => {
    return categories.value.filter(cat => !cat.hidden)
  })

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
      } else {
        links.value = [...INITIAL_LINKS]
        categories.value = [...DEFAULT_CATEGORIES]
        settings.value = { ...DEFAULT_SITE_SETTINGS }
        searchConfig.value = { ...DEFAULT_SEARCH_CONFIG }
      }

      const commonIndex = categories.value.findIndex(c => c.id === 'common')
      if (commonIndex > 0) {
        const commonCategory = categories.value[commonIndex]
        categories.value.splice(commonIndex, 1)
        categories.value.unshift(commonCategory)
      }
    } catch (e) {
      console.error('Failed to load data:', e)
      links.value = [...INITIAL_LINKS]
      categories.value = [...DEFAULT_CATEGORIES]
      settings.value = { ...DEFAULT_SITE_SETTINGS }
      searchConfig.value = { ...DEFAULT_SEARCH_CONFIG }
    }
    isLoaded.value = true
  }

  const saveData = () => {
    try {
      const data = {
        links: links.value,
        categories: categories.value,
        settings: settings.value,
        searchConfig: searchConfig.value
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save data:', e)
    }
  }

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

    links.value.push(newLink)
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
      links.value[index] = { ...links.value[index], ...data, url: processedUrl }
      saveData()
    }
  }

  const deleteLink = (id) => {
    const index = links.value.findIndex(l => l.id === id)
    if (index !== -1) {
      links.value.splice(index, 1)
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

    const categoryLinks = links.value
      .filter(link => categoryId === 'all' || link.categoryId === categoryId)
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
          links.value.push(newLink)
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

    saveData()
  }

  const exportData = () => {
    return {
      links: links.value,
      categories: categories.value,
      settings: settings.value,
      searchConfig: searchConfig.value,
      exportedAt: Date.now()
    }
  }

  const resetData = () => {
    links.value = [...INITIAL_LINKS]
    categories.value = [...DEFAULT_CATEGORIES]
    settings.value = { ...DEFAULT_SITE_SETTINGS }
    searchConfig.value = { ...DEFAULT_SEARCH_CONFIG }
    saveData()
  }

  return {
    links,
    categories,
    settings,
    searchConfig,
    isLoaded,
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
    resetData
  }
})
