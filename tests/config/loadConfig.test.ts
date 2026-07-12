import { describe, it, expect } from 'vitest';
import { loadSiteConfig, invalidateSiteConfigCache } from '../../src/config/loadConfig';

describe('loadConfig', () => {
  it('should asynchronously load and validate site config', async () => {
    const config = await loadSiteConfig();
    expect(config.categories.length).toBeGreaterThan(0);
    expect(config.links.length).toBeGreaterThan(0);
    expect(config.settings).toBeDefined();
    expect(config.searchConfig.externalSources.length).toBeGreaterThan(0);
  });

  it('should cache the resolved config (same promise)', async () => {
    const a = loadSiteConfig();
    const b = loadSiteConfig();
    expect(a).toBe(b);
    const [ca, cb] = await Promise.all([a, b]);
    expect(ca).toBe(cb);
  });

  it('invalidateSiteConfigCache clears the cached promise', async () => {
    const first = await loadSiteConfig();
    const cachedPromise = loadSiteConfig();
    invalidateSiteConfigCache();
    const freshPromise = loadSiteConfig();
    expect(cachedPromise).not.toBe(freshPromise);
    const second = await freshPromise;
    expect(second.categories.length).toBe(first.categories.length);
    expect(second.links.length).toBe(first.links.length);
  });
});
