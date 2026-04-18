import { describe, it, expect, beforeEach, vi } from 'vitest'
import { extractDomain, getFaviconUrl, getCachedIcon, setCachedIcon, preloadIcons } from '../../src/utils/faviconService'
import type { Link } from '../../src/types'

// 模拟localStorage
beforeEach(() => {
  // 模拟localStorage
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
    removeItem: vi.fn(),
    key: vi.fn(),
    length: 0
  } as Pick<Storage, 'getItem' | 'setItem' | 'clear' | 'removeItem' | 'key' | 'length'>
})

describe('faviconService', () => {
  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://www.google.com')).toBe('www.google.com')
      expect(extractDomain('https://github.com/user/repo')).toBe('github.com')
      expect(extractDomain('http://localhost:3000')).toBe('localhost')
    })

    it('should return original string for invalid URL', () => {
      expect(extractDomain('')).toBe('')
      expect(extractDomain('invalid-url')).toBe('invalid-url')
    })
  })

  describe('getFaviconUrl', () => {
    it('should return favicon URL for domain', () => {
      expect(getFaviconUrl('google.com')).toBe('https://www.faviconextractor.com/favicon/google.com?larger=true')
    })

    it('should return favicon URL for empty domain', () => {
      expect(getFaviconUrl('')).toBe('https://www.faviconextractor.com/favicon/?larger=true')
    })
  })

  describe('getCachedIcon and setCachedIcon', () => {
    it('should cache and retrieve favicon URL', () => {
      const domain = 'google.com'
      const iconUrl = 'https://example.com/favicon.ico'
      
      // 模拟localStorage.getItem返回空
      ;(global.localStorage.getItem as vi.Mock).mockReturnValue(null)
      
      setCachedIcon(domain, iconUrl)
      
      // 模拟localStorage.getItem返回缓存数据
      ;(global.localStorage.getItem as vi.Mock).mockReturnValue(JSON.stringify({ [domain]: iconUrl }))
      
      expect(getCachedIcon(domain)).toBe(iconUrl)
    })

    it('should return null for non-cached domain', () => {
      // 模拟localStorage.getItem返回空
      ;(global.localStorage.getItem as vi.Mock).mockReturnValue(null)
      
      expect(getCachedIcon('non-existent.com')).toBeNull()
    })
  })

  describe('preloadIcons', () => {
    it('should preload icons for links', () => {
      const links: Link[] = [
        { id: '1', name: 'Google', url: 'https://www.google.com', categoryId: '1' },
        { id: '2', name: 'GitHub', url: 'https://github.com', categoryId: '1' }
      ]

      // 模拟requestAnimationFrame
      const mockRequestAnimationFrame = vi.fn((cb) => {
        cb()
        return 1
      })
      
      global.requestAnimationFrame = mockRequestAnimationFrame
      
      // 模拟localStorage.getItem返回空
      ;(global.localStorage.getItem as vi.Mock).mockReturnValue(null)
      
      preloadIcons(links)

      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    it('should handle links without URL', () => {
      const links: Link[] = [
        { id: '1', name: 'No URL', url: '', categoryId: '1' },
        { id: '2', name: 'Undefined URL', categoryId: '1' }
      ]

      preloadIcons(links)

      // 验证没有抛出错误
      expect(() => preloadIcons(links)).not.toThrow()
    })
  })
})
