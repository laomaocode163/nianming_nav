import { FAVICON_CACHE_KEY, DEFAULT_ICON_PLACEHOLDER } from './constants.ts'
import type { Link } from '../types'

/**
 * 从URL中提取域名
 * @param {string} url - 网站URL
 * @returns {string} 域名
 */
export const extractDomain = (url: string): string => {
  try {
    let domain = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      domain = 'https://' + url
    }
    const urlObj = new URL(domain)
    return urlObj.hostname
  } catch (e) {
    console.error('Failed to extract domain:', e)
    return url
  }
}

/**
 * 生成favicon抓取URL
 * @param {string} domain - 域名
 * @returns {string} favicon URL
 */
export const getFaviconUrl = (domain: string): string => {
  return `https://www.faviconextractor.com/favicon/${domain}?larger=true`
}

/**
 * 从本地缓存获取图标
 * @param {string} domain - 域名
 * @returns {string|null} 图标URL或null
 */
export const getCachedIcon = (domain: string): string | null => {
  try {
    const stored = localStorage.getItem(FAVICON_CACHE_KEY)
    if (!stored) return null
    const cache = JSON.parse(stored)
    return cache[domain] || null
  } catch (e) {
    console.error('Failed to get cached icon:', e)
    return null
  }
}

/**
 * 保存图标到本地缓存
 * @param {string} domain - 域名
 * @param {string} iconUrl - 图标URL
 */
export const setCachedIcon = (domain: string, iconUrl: string): void => {
  try {
    const stored = localStorage.getItem(FAVICON_CACHE_KEY)
    const cache = stored ? JSON.parse(stored) : {}
    cache[domain] = iconUrl
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('Failed to cache icon:', e)
  }
}

/**
 * 获取默认图标
 * @returns {string} 默认图标URL
 */
export const getDefaultIcon = (): string => {
  return DEFAULT_ICON_PLACEHOLDER
}

/**
 * 自动抓取网站图标
 * @param {string} url - 网站URL
 * @returns {Promise<string>} 图标URL
 */
export const fetchIcon = async (url: string): Promise<string> => {
  try {
    const domain = extractDomain(url)
    
    // 先检查缓存
    const cachedIcon = getCachedIcon(domain)
    if (cachedIcon) {
      return cachedIcon
    }
    
    // 生成favicon URL
    const iconUrl = getFaviconUrl(domain)
    
    // 缓存图标
    setCachedIcon(domain, iconUrl)
    
    return iconUrl
  } catch (e) {
    console.error('Failed to fetch icon:', e)
    return getDefaultIcon()
  }
}

/**
 * 获取网站图标（优先使用缓存）
 * @param {string} url - 网站URL
 * @param {string} existingIcon - 已有的图标URL
 * @returns {string} 图标URL
 */
export const getSiteIcon = (url: string, existingIcon: string = ''): string => {
  // 如果已有自定义图标，直接使用
  if (existingIcon && !existingIcon.includes('faviconextractor.com')) {
    return existingIcon
  }
  
  try {
    const domain = extractDomain(url)
    
    // 检查缓存
    const cachedIcon = getCachedIcon(domain)
    if (cachedIcon) {
      return cachedIcon
    }
    
    // 返回favicon URL（不缓存，让调用方决定何时缓存）
    return getFaviconUrl(domain)
  } catch (e) {
    console.error('Failed to get site icon:', e)
    return getDefaultIcon()
  }
}

/**
 * 批量预加载图标到缓存
 * @param {Link[]} links - 链接数组
 */
export const preloadIcons = (links: Link[]): void => {
  // 使用requestAnimationFrame来避免阻塞主线程
  requestAnimationFrame(() => {
    links.forEach(link => {
      if (link.url) {
        try {
          const domain = extractDomain(link.url)
          const cachedIcon = getCachedIcon(domain)
          
          // 如果没有缓存，生成并缓存图标URL
          if (!cachedIcon) {
            const iconUrl = getFaviconUrl(domain)
            setCachedIcon(domain, iconUrl)
          }
        } catch (e) {
          console.error('Failed to preload icon for:', link.url, e)
        }
      }
    })
  })
}

/**
 * 清除所有缓存的图标
 */
export const clearIconCache = (): void => {
  try {
    localStorage.removeItem(FAVICON_CACHE_KEY)
  } catch (e) {
    console.error('Failed to clear icon cache:', e)
  }
}

/**
 * 处理图标加载错误
 * @param {Event} event - 错误事件
 */
export const handleIconError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  img.src = getDefaultIcon()
  img.onerror = null // 防止循环
}
