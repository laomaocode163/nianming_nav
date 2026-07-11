import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { fetchSongUrl, searchSongUrl } from '../../src/services/musicApi'

const makeLocalStorage = () => {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    clear: () => map.clear(),
  } as Storage
}

describe('musicApi', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetchSongUrl returns url on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ json: async () => ({ url: 'http://a.mp3' }) })),
    )
    expect(await fetchSongUrl('kuwo', '123')).toBe('http://a.mp3')
  })

  it('fetchSongUrl returns null when response has no url', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ json: async () => ({}) })),
    )
    expect(await fetchSongUrl('kuwo', '123')).toBeNull()
  })

  it('fetchSongUrl returns null on network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network')
      }),
    )
    expect(await fetchSongUrl('kuwo', '123')).toBeNull()
  })

  it('searchSongUrl returns first available url across sources', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('types=search')) {
          return { json: async () => [{ source: 'kuwo', id: '999' }] }
        }
        return { json: async () => ({ url: 'http://found.mp3' }) }
      }),
    )
    expect(await searchSongUrl('周杰伦')).toBe('http://found.mp3')
  })

  it('searchSongUrl returns null when nothing is found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('types=search')) return { json: async () => [] }
        return { json: async () => ({}) }
      }),
    )
    expect(await searchSongUrl('x')).toBeNull()
  })

  describe('caching', () => {
    it('fetchSongUrl caches the resolved url and reuses it without a second fetch', async () => {
      const fetchMock = vi.fn(async () => ({ json: async () => ({ url: 'http://cached.mp3' }) }))
      vi.stubGlobal('fetch', fetchMock)

      expect(await fetchSongUrl('kuwo', '456')).toBe('http://cached.mp3')
      expect(await fetchSongUrl('kuwo', '456')).toBe('http://cached.mp3')
      // 第二次调用应命中缓存，不再发起网络请求
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('searchSongUrl caches by keyword and reuses it on repeat', async () => {
      const fetchMock = vi.fn(async (url: string) => {
        if (url.includes('types=search')) return { json: async () => [{ source: 'kuwo', id: '1' }] }
        return { json: async () => ({ url: 'http://search-cached.mp3' }) }
      })
      vi.stubGlobal('fetch', fetchMock)

      expect(await searchSongUrl('测试')).toBe('http://search-cached.mp3')
      // 首次调用：1 次搜索 + 1 次直链请求
      expect(fetchMock).toHaveBeenCalledTimes(2)

      // 第二次调用应命中 keyword 缓存，不再发起任何网络请求
      fetchMock.mockClear()
      expect(await searchSongUrl('测试')).toBe('http://search-cached.mp3')
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
