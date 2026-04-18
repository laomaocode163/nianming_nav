import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../src/stores/data'
import type { SearchConfig, SiteSettings } from '../../src/types'

describe('dataStore', () => {
  beforeEach(() => {
    // 创建新的Pinia实例
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('links management', () => {
    it('should have initial links', () => {
      const store = useDataStore()
      store.loadData()
      
      expect(store.links.length).toBeGreaterThan(0)
    })

    it('should toggle pin status of a link', () => {
      const store = useDataStore()
      store.loadData()
      
      const initialLink = store.links[0]
      const initialPinnedStatus = initialLink.pinned
      
      store.togglePin(initialLink.id)
      
      const updatedLink = store.links.find(link => link.id === initialLink.id)
      expect(updatedLink?.pinned).toBe(!initialPinnedStatus)
    })

    it('should get links by category', () => {
      const store = useDataStore()
      store.loadData()
      
      // 获取所有链接
      const allLinks = store.getLinksByCategory('all')
      expect(allLinks.length).toBeGreaterThan(0)
      
      // 获取第一个分类的链接
      if (store.categories.length > 0) {
        const firstCategoryId = store.categories[0].id
        const categoryLinks = store.getLinksByCategory(firstCategoryId)
        expect(categoryLinks.length).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('categories management', () => {
    it('should have initial categories', () => {
      const store = useDataStore()
      store.loadData()
      
      expect(store.categories.length).toBeGreaterThan(0)
    })

    it('should return visible categories', () => {
      const store = useDataStore()
      store.loadData()
      
      const visibleCats = store.visibleCategories
      expect(visibleCats.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('search config management', () => {
    it('should update search config', () => {
      const store = useDataStore()
      store.loadData()
      
      const newConfig: Partial<SearchConfig> = {
        selectedSourceId: 'bing'
      }

      store.updateSearchConfig(newConfig)

      expect(store.searchConfig.selectedSourceId).toBe('bing')
    })
  })

  describe('settings management', () => {
    it('should update site settings', () => {
      const store = useDataStore()
      store.loadData()
      
      const newSettings: Partial<SiteSettings> = {
        siteName: 'Test Site',
        enableAnimations: false
      }
      
      store.updateSettings(newSettings)

      expect(store.settings.siteName).toBe('Test Site')
      expect(store.settings.enableAnimations).toBe(false)
    })
  })

  describe('icon management', () => {
    it('should get link icon', () => {
      const store = useDataStore()
      store.loadData()
      
      if (store.links.length > 0) {
        const link = store.links[0]
        const icon = store.getLinkIcon(link)
        expect(typeof icon).toBe('string')
      }
    })

    it('should sync link icon', () => {
      const store = useDataStore()
      store.loadData()
      
      if (store.links.length > 0) {
        const link = store.links[0]
        store.syncLinkIcon(link)
        
        // 验证图标是否被同步
        const domain = new URL(link.url).hostname
        expect(store.iconMap[domain]).toBeDefined()
      }
    })
  })

  describe('data persistence', () => {
    it('should load and save data', () => {
      const store = useDataStore()
      
      // 加载数据
      store.loadData()
      expect(store.isLoaded).toBe(true)
      
      // 保存数据
      expect(() => store.saveData()).not.toThrow()
    })
  })
})
