import { describe, it, expect } from 'vitest'
import { loadSiteConfig } from '../../src/config/loadConfig'
import { loadMusicPlaylist } from '../../src/config/loadMusic'

describe('loadConfig', () => {
  it('should asynchronously load and validate site config', async () => {
    const config = await loadSiteConfig()
    expect(config.categories.length).toBeGreaterThan(0)
    expect(config.links.length).toBeGreaterThan(0)
    expect(config.settings).toBeDefined()
    expect(config.searchConfig.externalSources.length).toBeGreaterThan(0)
  })

  it('should cache the resolved config (same promise)', async () => {
    const a = loadSiteConfig()
    const b = loadSiteConfig()
    expect(a).toBe(b)
    const [ca, cb] = await Promise.all([a, b])
    expect(ca).toBe(cb)
  })

  it('should load and validate the music playlist', async () => {
    const playlist = await loadMusicPlaylist()
    expect(Array.isArray(playlist)).toBe(true)
    expect(playlist.length).toBeGreaterThan(0)
  })
})
