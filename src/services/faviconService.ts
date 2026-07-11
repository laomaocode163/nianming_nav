/**
 * 网站图标服务
 * - extractDomain: 从 URL 中提取域名
 * - getFaviconUrl: 主图标源（faviconextractor.com）
 * - getFaviconFallbacks: 主源失败时的降级源（Google S2 / DuckDuckGo）
 * - getCachedFavicon / cacheFavicon: 内存 + localStorage 二级缓存，避免重复请求与已知坏链
 */

const PRIMARY_PROVIDER = 'https://www.faviconextractor.com/favicon'
const STORAGE_KEY = 'favicon-cache'

const memoryCache = new Map<string, string>()

const loadPersistentCache = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

const savePersistentCache = (map: Record<string, string>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* 隐私模式或配额超限时忽略 */
  }
}

export const extractDomain = (url: string): string => {
  try {
    let domain = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      domain = 'https://' + url
    }
    const urlObj = new URL(domain)
    return urlObj.hostname
  } catch {
    return ''
  }
}

export const getFaviconUrl = (domain: string): string => {
  return `${PRIMARY_PROVIDER}/${domain}?larger=true`
}

/** 图标降级链：主源 -> Google S2 -> DuckDuckGo */
export const getFaviconFallbacks = (domain: string): string[] => {
  if (!domain) return []
  return [
    getFaviconUrl(domain),
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ]
}

/** 读取缓存的可用图标地址，未命中则返回主源 */
export const getCachedFavicon = (domain: string): string => {
  if (memoryCache.has(domain)) {
    return memoryCache.get(domain) as string
  }
  const store = loadPersistentCache()
  if (store[domain]) {
    memoryCache.set(domain, store[domain])
    return store[domain]
  }
  return getFaviconUrl(domain)
}

/** 记录某个域名最终可用的图标地址（用于跳过已知坏链） */
export const cacheFavicon = (domain: string, url: string): void => {
  if (!domain) return
  memoryCache.set(domain, url)
  const store = loadPersistentCache()
  store[domain] = url
  savePersistentCache(store)
}
