/**
 * 外部音乐 API 抽象层
 * 封装 music-api.gdstudio.xyz 的请求（获取直链 / 搜索），统一超时与错误处理，
 * 让播放器 composable 与具体网络实现解耦。
 * 成功解析的直链会按 source:id / keyword 缓存到 localStorage（带 TTL），避免重复请求。
 */

const API_BASE = 'https://music-api.gdstudio.xyz/api.php'
export const MUSIC_SOURCES = ['kuwo', 'netease'] as const

const CACHE_KEY = 'music-url-cache-v1'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 天（直链可能过期）

interface CacheEntry {
  url: string
  ts: number
}

const fetchWithTimeout = async (url: string, ms = 10000): Promise<Response> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const readCache = (): Record<string, CacheEntry> => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {}
  } catch {
    return {}
  }
}

const writeCache = (key: string, url: string): void => {
  try {
    const store = readCache()
    store[key] = { url, ts: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(store))
  } catch {
    /* 隐私模式或配额超限时忽略 */
  }
}

const getCachedUrl = (key: string): string | null => {
  try {
    const store = readCache()
    const entry = store[key]
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.url
  } catch {
    /* 忽略缓存读取错误，回退到网络请求 */
  }
  return null
}

/** 按源 + ID 获取音频直链 */
export const fetchSongUrl = async (source: string, id: string): Promise<string | null> => {
  const cacheKey = `${source}:${id}`
  const cached = getCachedUrl(cacheKey)
  if (cached) return cached
  try {
    const res = await fetchWithTimeout(`${API_BASE}?types=url&source=${source}&id=${id}&br=320`)
    const data = (await res.json()) as { url?: string }
    if (data?.url) {
      writeCache(cacheKey, data.url)
      return data.url
    }
  } catch {
    /* 回退到返回 null */
  }
  return null
}

/** 按关键词在多个音源中搜索，返回首个可用的直链 */
export const searchSongUrl = async (keyword: string): Promise<string | null> => {
  const cacheKey = `search:${keyword}`
  const cached = getCachedUrl(cacheKey)
  if (cached) return cached
  for (const source of MUSIC_SOURCES) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=5`,
      )
      const data = (await res.json()) as Array<{ source?: string; id: string }>
      if (Array.isArray(data) && data.length > 0) {
        const url = await fetchSongUrl(data[0].source || source, data[0].id)
        if (url) {
          writeCache(cacheKey, url)
          return url
        }
      }
    } catch {
      // 尝试下一个音源
    }
  }
  return null
}
