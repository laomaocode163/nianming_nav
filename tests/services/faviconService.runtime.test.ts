import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFaviconUrl,
  getFaviconFallbacks,
  getCachedFavicon,
  cacheBrokenFavicon,
  validateAndCacheFavicon,
  prefetchUncachedFavicons,
} from '../../src/services/faviconService';
import { getDefaultIcon } from '../../src/utils/constants';

const STORAGE_KEY = 'favicon-cache-v3';

const makeLocalStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    clear: () => map.clear(),
  } as Storage;
};

describe('faviconService (runtime fallback chain)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls through primary source -> all fallbacks -> broken persistence when every source fails', () => {
    const domain = 'allbroken.com';
    // 未命中缓存时主源（站点自身 /favicon.ico）被返回作为首屏尝试地址
    const primary = getCachedFavicon(domain);
    expect(primary).toBe('https://allbroken.com/favicon.ico');

    // 模拟 SiteCard 的 onIconError 循环：主源失败，依次尝试整条 fallback 链
    const fallbacks = getFaviconFallbacks(domain);
    expect(fallbacks.length).toBeGreaterThan(0);
    expect(fallbacks[0]).toContain('favicon.im');

    // 主源与全部 fallback 均失败后标记坏链
    cacheBrokenFavicon(domain);

    // 后续任意读取直接返回占位图，不再触发主源 / fallback 请求（避免重复探测）
    expect(getCachedFavicon(domain)).toBe(getDefaultIcon());
    expect(getCachedFavicon(domain)).toBe(getDefaultIcon());
  });

  it('persists broken favicon so reloads skip re-request', async () => {
    cacheBrokenFavicon('persist.com');
    // 持久化写入有 500ms 防抖，等待落盘
    await new Promise((r) => setTimeout(r, 600));
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(store['persist.com']?.url).toBe(getDefaultIcon());
  });

  it('caches a validated icon and reuses it on subsequent loads', () => {
    const img = {
      naturalWidth: 32,
      naturalHeight: 32,
      src: 'https://icons.duckduckgo.com/ip3/ok.com.ico',
    } as HTMLImageElement;
    validateAndCacheFavicon('ok.com', img);
    expect(getCachedFavicon('ok.com')).toBe('https://icons.duckduckgo.com/ip3/ok.com.ico');
  });

  it('prefetches only uncached domains during idle time', () => {
    const instances: { src: string }[] = [];
    const ImageStub = class {
      src = '';
      constructor() {
        instances.push(this);
      }
    };
    vi.stubGlobal('Image', ImageStub);
    vi.stubGlobal(
      'requestIdleCallback',
      (cb: (deadline: { timeRemaining: () => number }) => void) => cb({ timeRemaining: () => 50 })
    );

    try {
      prefetchUncachedFavicons(['fresh-a.com', 'fresh-b.com']);
      expect(instances.length).toBe(2);
      expect(instances[0].src).toBe(getFaviconUrl('fresh-a.com'));
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
