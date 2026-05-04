import { describe, it, expect } from 'vitest'
import { extractDomain, getFaviconUrl, getDefaultIcon } from '../../src/utils/faviconService'

describe('faviconService', () => {
  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://www.google.com')).toBe('www.google.com')
      expect(extractDomain('https://github.com/user/repo')).toBe('github.com')
      expect(extractDomain('http://localhost:3000')).toBe('localhost')
    })

    it('should handle URLs without protocol', () => {
      expect(extractDomain('google.com')).toBe('google.com')
    })

    it('should return empty string for invalid URL', () => {
      expect(extractDomain('')).toBe('')
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

  describe('getDefaultIcon', () => {
    it('should return a data URL', () => {
      expect(getDefaultIcon()).toMatch(/^data:image\/svg\+xml/)
    })
  })
})
