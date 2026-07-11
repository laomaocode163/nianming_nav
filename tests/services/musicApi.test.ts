import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchSongUrl, searchSongUrl } from '../../src/services/musicApi'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('musicApi', () => {
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
})
