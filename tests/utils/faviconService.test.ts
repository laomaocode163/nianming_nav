import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractDomain,
  getFaviconUrl,
  getFaviconFallbacks,
  getCachedFavicon,
  cacheFavicon,
} from '../../src/services/faviconService';
import { getDefaultIcon } from '../../src/utils/constants';

const STORAGE_KEY = 'favicon-cache-v2';

const makeLocalStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    clear: () => map.clear(),
  } as Storage;
};

describe('faviconService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://www.google.com')).toBe('www.google.com');
      expect(extractDomain('https://github.com/user/repo')).toBe('github.com');
      expect(extractDomain('http://localhost:3000')).toBe('localhost');
    });

    it('should handle URLs without protocol', () => {
      expect(extractDomain('google.com')).toBe('google.com');
    });

    it('should return empty string for invalid URL', () => {
      expect(extractDomain('')).toBe('');
    });
  });

  describe('getFaviconUrl', () => {
    it('should return local same-origin path for domains present in the manifest', () => {
      // github.com 已由 fetch-favicons 下载到本地，命中清单
      expect(getFaviconUrl('github.com')).toBe('/favicons/github.com.ico');
    });

    it("should fall back to the site's own favicon for domains not in the manifest", () => {
      expect(getFaviconUrl('example-not-in-manifest.com')).toBe(
        'https://example-not-in-manifest.com/favicon.ico'
      );
    });

    it('should return empty string for empty domain', () => {
      expect(getFaviconUrl('')).toBe('');
    });
  });

  describe('getDefaultIcon', () => {
    it('should return a data URL', () => {
      expect(getDefaultIcon()).toMatch(/^data:image\/svg\+xml/);
    });
  });

  describe('getFaviconFallbacks', () => {
    it('should return the aggregator fallback chain', () => {
      const fallbacks = getFaviconFallbacks('github.com');
      expect(fallbacks).toEqual([
        'https://favicon.im/github.com',
        'https://icon.horse/icon/github.com',
        'https://www.faviconextractor.com/favicon/github.com?larger=true',
        'https://icons.duckduckgo.com/ip3/github.com.ico',
        'https://www.google.com/s2/favicons?domain=github.com&sz=64',
      ]);
    });

    it('should return empty array for empty domain', () => {
      expect(getFaviconFallbacks('')).toEqual([]);
    });
  });

  describe('cache (TTL / eviction / dedup)', () => {
    it('should cache and read back a resolved favicon url', () => {
      cacheFavicon('github.com', 'https://icons.duckduckgo.com/ip3/github.com.ico');
      expect(getCachedFavicon('github.com')).toBe(
        'https://icons.duckduckgo.com/ip3/github.com.ico'
      );
    });

    it('should not hit persistent store on every read (loaded once into memory)', () => {
      cacheFavicon('google.com', 'https://icons.duckduckgo.com/ip3/google.com.ico');
      const getItemSpy = vi.spyOn(localStorage, 'getItem');
      // 多次读取只应命中内存缓存，不会反复解析持久化存储
      getCachedFavicon('google.com');
      getCachedFavicon('google.com');
      expect(getItemSpy).not.toHaveBeenCalled();
    });

    it('should treat expired entries as miss and fall back to primary source', () => {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      store['old.com'] = {
        url: 'https://stale.example/x.ico',
        ts: Date.now() - 40 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

      // old.com 不在本地清单中，未命中缓存时回退到站点自身 favicon
      expect(getCachedFavicon('old.com')).toBe('https://old.com/favicon.ico');
    });

    it('should evict oldest entries beyond the max size', async () => {
      for (let i = 0; i < 250; i++) {
        cacheFavicon(`domain-${i}.com`, `https://icons.duckduckgo.com/ip3/domain-${i}.com.ico`);
      }
      // 持久化写入已改为防抖，等待落盘后再断言
      await new Promise((r) => setTimeout(r, 600));
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(Object.keys(store).length).toBeLessThanOrEqual(200);
      expect(store['domain-0.com']).toBeUndefined();
      expect(store['domain-249.com']).toBeDefined();
    });
  });
});
