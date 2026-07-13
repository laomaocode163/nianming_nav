/**
 * 网站图标服务
 * - extractDomain: 从 URL 中提取域名
 * - getFaviconUrl: 主图标源（优先本地 /favicons/，命中清单则同源离线；否则站点自身 /favicon.ico）
 * - getFaviconFallbacks: 主源失败时的降级链（favicon.im / icon.horse / faviconextractor / DuckDuckGo / Google）
 * - getCachedFavicon / cacheFavicon: 内存 + localStorage 二级缓存，避免重复请求与已知坏链
 *
 * 本地图标由 `npm run fetch-favicons` 下载到 public/favicons/ 并生成 faviconManifest.json，
 * 运行时优先使用，避免依赖外网（GFW 等受限网络下关键）。
 * 缓存结构：{ [domain]: { url, ts } }，带版本号、过期时间与上限淘汰。
 */

import faviconManifest from '@/config/faviconManifest.json';
import { getDefaultIcon } from '@/utils/constants';

interface CacheEntry {
  url: string;
  ts: number;
}

const PRIMARY_PROVIDER = 'https://favicon.im';
const STORAGE_KEY = 'favicon-cache-v2';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天
const CACHE_MAX_SIZE = 200;
const SAVE_DEBOUNCE_MS = 500;

const memoryCache = new Map<string, string>();

// 持久化缓存仅在首次访问时解析一次，避免每次 getCachedFavicon 都 JSON.parse 整库
let persistentStore: Record<string, CacheEntry> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const loadPersistentCache = (): Record<string, CacheEntry> => {
  if (persistentStore) return persistentStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    persistentStore = raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
  } catch {
    persistentStore = {};
  }
  return persistentStore;
};

const flushPersistentCache = (): void => {
  saveTimer = null;
  if (!persistentStore) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentStore));
  } catch {
    /* 隐私模式或配额超限时忽略 */
  }
};

// 合并多次写入：仅标记脏并延迟落盘，避免首屏每张图标都全量序列化整库
const scheduleSave = (): void => {
  if (saveTimer) return;
  saveTimer = setTimeout(flushPersistentCache, SAVE_DEBOUNCE_MS);
};

const evictIfNeeded = (map: Record<string, CacheEntry>): void => {
  const entries = Object.entries(map);
  if (entries.length <= CACHE_MAX_SIZE) return;
  const sorted = entries.sort((a, b) => a[1].ts - b[1].ts);
  const removed = sorted.slice(0, entries.length - CACHE_MAX_SIZE);
  for (const [domain] of removed) {
    delete map[domain];
    memoryCache.delete(domain);
  }
};

export const extractDomain = (url: string): string => {
  try {
    let domain = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      domain = 'https://' + url;
    }
    const urlObj = new URL(domain);
    return urlObj.hostname;
  } catch {
    return '';
  }
};

export const getFaviconUrl = (domain: string): string => {
  if (!domain) return '';
  // 若本地已下载该域名图标（由 fetch-favicons 脚本生成清单），优先走同源本地文件，离线可用
  const localFile = (faviconManifest as Record<string, string>)[domain];
  if (localFile) {
    return `/favicons/${localFile}`;
  }
  // 否则回退到站点自身 favicon（浏览器网络通常能直连目标站点）
  return `https://${domain}/favicon.ico`;
};

/**
 * 图标降级链（不含主源）：主源（站点自身 favicon）失败时使用。
 * 依次尝试多个第三方聚合服务作为兜底。
 */
export const getFaviconFallbacks = (domain: string): string[] => {
  if (!domain) return [];
  return [
    `${PRIMARY_PROVIDER}/${domain}`,
    `https://icon.horse/icon/${domain}`,
    `https://www.faviconextractor.com/favicon/${domain}?larger=true`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ];
};

/**
 * 读取缓存的可用图标地址，未命中则返回主源。
 * 注意：未命中时【不】写入内存缓存——主源尚未经过加载验证，
 * 若缓存它，主源失败时无法走 fallback 链且会重复请求。
 * 验证通过的地址由 cacheFavicon 在 onIconLoad 时写入；
 * 主源与全部 fallback 均失败时由 cacheBrokenFavicon 标记占位图。
 */
export const getCachedFavicon = (domain: string): string => {
  if (memoryCache.has(domain)) {
    return memoryCache.get(domain) as string;
  }
  const store = loadPersistentCache();
  const entry = store[domain];
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    memoryCache.set(domain, entry.url);
    return entry.url;
  }
  return getFaviconUrl(domain);
};

/**
 * 标记某域名主源与全部 fallback 均失败：写入内存 + 持久化缓存，使刷新后仍跳过已知坏链。
 */
export const cacheBrokenFavicon = (domain: string): void => {
  if (!domain) return;
  const placeholder = getDefaultIcon();
  memoryCache.set(domain, placeholder);
  const store = loadPersistentCache();
  store[domain] = { url: placeholder, ts: Date.now() };
  evictIfNeeded(store);
  scheduleSave();
};

/** 判断是否为占位图（不应作为有效图标缓存） */
const isPlaceholder = (url: string): boolean => {
  if (!url) return true;
  if (url === getDefaultIcon()) return true;
  return !/^https?:\/\//i.test(url);
};

/** 记录某个域名最终可用的图标地址（用于跳过已知坏链） */
export const cacheFavicon = (domain: string, url: string): void => {
  if (!domain || isPlaceholder(url)) return;
  memoryCache.set(domain, url);
  const store = loadPersistentCache();
  store[domain] = { url, ts: Date.now() };
  evictIfNeeded(store);
  scheduleSave();
};

/**
 * 图标加载成功回调：校验图片尺寸，避免缓存 404 HTML 或 1x1 占位图。
 * 需要在 <img> onload 中调用，传入已加载的 img 元素。
 */
export const validateAndCacheFavicon = (domain: string, img: HTMLImageElement): void => {
  if (!domain) return;
  // 排除尺寸异常的占位图（404 页面返回的 HTML 或极小占位像素）
  if (img.naturalWidth <= 1 || img.naturalHeight <= 1) return;
  cacheFavicon(domain, img.src);
};

/**
 * 空闲预取未缓存的域名图标：利用 requestIdleCallback 在浏览器空闲时触发加载，
 * 将图标预热到浏览器 HTTP 缓存，避免首屏请求瀑布。
 * 传入需预取的域名列表，自动跳过已缓存的域名。
 */
export const prefetchUncachedFavicons = (domains: string[]): void => {
  if (typeof requestIdleCallback === 'undefined') return;
  const store = loadPersistentCache();
  const now = Date.now();
  const uncached = domains.filter((d) => {
    if (!d) return false;
    const entry = store[d];
    return !entry || now - entry.ts >= CACHE_TTL;
  });
  if (uncached.length === 0) return;

  let idx = 0;
  const prefetchNext = (deadline: IdleDeadline) => {
    // 每个空闲周期预取最多 5 个图标，避免阻塞交互
    let count = 0;
    while (idx < uncached.length && count < 5 && deadline.timeRemaining() > 1) {
      const domain = uncached[idx];
      const url = getFaviconUrl(domain);
      // 使用 detached <img> 触发浏览器预加载，不写入 DOM
      const img = new Image();
      img.src = url;
      idx++;
      count++;
    }
    if (idx < uncached.length) {
      requestIdleCallback(prefetchNext);
    }
  };
  requestIdleCallback(prefetchNext, { timeout: 2000 });
};
