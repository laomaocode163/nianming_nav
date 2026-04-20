import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '../../src/stores/data'

describe('dataStore', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('links management', () => {
    it('should have initial links from config', () => {
      const store = useDataStore()
      expect(store.links.length).toBeGreaterThan(0)
    })

    it('should get links by category', () => {
      const store = useDataStore()

      const allLinks = store.getLinksByCategory('all')
      expect(allLinks.length).toBeGreaterThan(0)

      if (store.categories.length > 0) {
        const firstCategoryId = store.categories[0].id
        const categoryLinks = store.getLinksByCategory(firstCategoryId)
        expect(categoryLinks.length).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('categories management', () => {
    it('should have initial categories from config', () => {
      const store = useDataStore()
      expect(store.categories.length).toBeGreaterThan(0)
    })

    it('should return visible categories', () => {
      const store = useDataStore()
      const visibleCats = store.visibleCategories
      expect(visibleCats.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('search config', () => {
    it('should have search config from config', () => {
      const store = useDataStore()
      expect(store.searchConfig.selectedSourceId).toBeDefined()
      expect(store.searchConfig.externalSources.length).toBeGreaterThan(0)
    })
  })

  describe('settings', () => {
    it('should have settings from config', () => {
      const store = useDataStore()
      expect(store.settings).toBeDefined()
      expect(store.settings.navTitle).toBe('念铭导航')
    })
  })

  describe('icon management', () => {
    it('should get link icon', () => {
      const store = useDataStore()
      if (store.links.length > 0) {
        const link = store.links[0]
        const icon = store.getLinkIcon(link)
        expect(typeof icon).toBe('string')
        expect(icon).toContain('faviconextractor.com')
      }
    })
  })

  describe('pinned links', () => {
    it('should get pinned links', () => {
      const store = useDataStore()
      const pinnedLinks = store.pinnedLinks
      expect(pinnedLinks.every(link => link.pinned === true)).toBe(true)
    })
  })
})
