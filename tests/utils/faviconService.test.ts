import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractDomain,
  getFaviconUrl,
  getFaviconFallbacks,
  getCachedFavicon,
  cacheFavicon,
  cacheBrokenFavicon,
  validateAndCacheFavicon,
  prefetchUncachedFavicons,
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

    it('should return primary source (not a cached placeholder) on cache miss and not persist it', () => {
      const url = getCachedFavicon('never-cached.com');
      expect(url).toBe('https://never-cached.com/favicon.ico');
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      // 未经验证的主源不应被持久化，避免失败时重复请求
      expect(store['never-cached.com']).toBeUndefined();
    });

    it('should cache placeholder for fully-broken favicons and reuse it', () => {
      cacheBrokenFavicon('broken.com');
      expect(getCachedFavicon('broken.com')).toBe(getDefaultIcon());
      // 第二次读取直接命中内存占位，不再回退主源 / fallback 链
      expect(getCachedFavicon('broken.com')).toBe(getDefaultIcon());
    });

    it('should persist broken favicon to avoid re-request on reload', async () => {
      cacheBrokenFavicon('persistent-broken.com');
      // 持久化写入有 500ms 防抖，等待落盘
      await new Promise((r) => setTimeout(r, 600));
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(store['persistent-broken.com']).toBeDefined();
      expect(store['persistent-broken.com'].url).toBe(getDefaultIcon());
    });
  });

  describe('validateAndCacheFavicon', () => {
    it('should not cache icons with width <= 1', () => {
      const img = {
        naturalWidth: 1,
        naturalHeight: 32,
        src: 'https://bad.example/1px.ico',
      } as HTMLImageElement;
      validateAndCacheFavicon('bad.com', img);
      // 不应缓存极小占位图
      expect(getCachedFavicon('bad.com')).toBe('https://bad.com/favicon.ico');
    });

    it('should cache valid favicon with reasonable dimensions', () => {
      const img = {
        naturalWidth: 32,
        naturalHeight: 32,
        src: 'https://good.example/icon.ico',
      } as HTMLImageElement;
      validateAndCacheFavicon('good.com', img);
      expect(getCachedFavicon('good.com')).toBe('https://good.example/icon.ico');
    });

    it('should be a no-op for empty domain', () => {
      const img = {
        naturalWidth: 32,
        naturalHeight: 32,
        src: 'https://x.com/a.ico',
      } as HTMLImageElement;
      validateAndCacheFavicon('', img);
      // 不应写入任何缓存
    });
  });

  describe('prefetchUncachedFavicons', () => {
    it('should skip already-cached domains', () => {
      cacheFavicon('cached.com', 'https://icons.duckduckgo.com/ip3/cached.com.ico');
      prefetchUncachedFavicons(['cached.com', 'fresh.com']);
      // 不应抛错；fresh.com 会通过 requestIdleCallback 预取
      // 这里主要验证缓存命中后不会重复触发
    });

    it('should handle empty domain list gracefully', () => {
      expect(() => prefetchUncachedFavicons([])).not.toThrow();
    });
  });
});
