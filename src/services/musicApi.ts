/**
 * 外部音乐 API 抽象层
 * 封装 music-api.gdstudio.xyz 的请求（获取直链 / 搜索），统一超时与错误处理，
 * 让播放器 composable 与具体网络实现解耦。
 */

const API_BASE = 'https://music-api.gdstudio.xyz/api.php'
export const MUSIC_SOURCES = ['kuwo', 'netease'] as const

const fetchWithTimeout = async (url: string, ms = 10000): Promise<Response> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** 按源 + ID 获取音频直链 */
export const fetchSongUrl = async (source: string, id: string): Promise<string | null> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE}?types=url&source=${source}&id=${id}&br=320`)
    const data = (await res.json()) as { url?: string }
    return data?.url || null
  } catch {
    return null
  }
}

/** 按关键词在多个音源中搜索，返回首个可用的直链 */
export const searchSongUrl = async (keyword: string): Promise<string | null> => {
  for (const source of MUSIC_SOURCES) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=5`,
      )
      const data = (await res.json()) as Array<{ source?: string; id: string }>
      if (Array.isArray(data) && data.length > 0) {
        const url = await fetchSongUrl(data[0].source || source, data[0].id)
        if (url) return url
      }
    } catch {
      // 尝试下一个音源
    }
  }
  return null
}
