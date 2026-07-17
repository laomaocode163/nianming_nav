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
const STORAGE_KEY = 'favicon-cache-v3';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天
const CACHE_MAX_SIZE = 200;
const SAVE_DEBOUNCE_MS = 500;

// 图标请求调度参数
const REQUEST_TIMEOUT_MS = 3500; // 单源超时（AbortController / 计时器）
const MAX_CONCURRENCY = 8; // 全局并发信号量上限，避免首屏图标请求洪峰
const MEMORY_CACHE_MAX = 300; // 内存缓存 LRU 上限，防止长会话无限增长

const memoryCache = new Map<string, string>();

// 持久化缓存仅在首次访问时解析一次，避免每次 getCachedFavicon 都 JSON.parse 整库。
// 使用 Map 而非 Record：Map 的迭代顺序即「最近写入顺序」，淘汰时直接移除最旧的若干项，
// 无需每次写入都对全量缓存排序（原 Object.entries().sort() 在接近上限时开销明显）。
let persistentStore: Map<string, CacheEntry> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
// 增量落盘：记录脏域名，落盘时仅序列化变更条目，避免每次全量序列化整库
let dirtyDomains: Set<string> | null = null;
let fullFlushNeeded = false;

const loadPersistentCache = (): Map<string, CacheEntry> => {
  if (persistentStore) return persistentStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    persistentStore = raw
      ? new Map(Object.entries(JSON.parse(raw) as Record<string, CacheEntry>))
      : new Map();
  } catch {
    persistentStore = new Map();
  }
  return persistentStore;
};

const flushPersistentCache = (): void => {
  saveTimer = null;
  if (!persistentStore) return;
  try {
    let toWrite: Record<string, CacheEntry>;
    if (fullFlushNeeded || dirtyDomains === null) {
      // 淘汰等结构性变更：全量写回
      toWrite = Object.fromEntries(persistentStore);
      fullFlushNeeded = false;
      dirtyDomains = new Set();
    } else if (dirtyDomains.size > 0) {
      // 增量写回：仅合并脏条目到磁盘当前值，避免序列化全部 200 条
      const raw = localStorage.getItem(STORAGE_KEY);
      const base = raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
      for (const domain of dirtyDomains) {
        const entry = persistentStore.get(domain);
        if (entry) base[domain] = entry;
        else delete base[domain];
      }
      toWrite = base;
      dirtyDomains.clear();
    } else {
      return; // 无变更，跳过写盘
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toWrite));
  } catch {
    /* 隐私模式或配额超限时忽略 */
  }
};

// 合并多次写入：仅标记脏并延迟落盘，避免首屏每张图标都全量序列化整库
const markDirty = (domain: string): void => {
  if (!dirtyDomains) dirtyDomains = new Set();
  dirtyDomains.add(domain);
};

const scheduleSave = (full = false): void => {
  if (full) {
    fullFlushNeeded = true;
    dirtyDomains = null;
  }
  if (saveTimer) return;
  saveTimer = setTimeout(flushPersistentCache, SAVE_DEBOUNCE_MS);
};

// 超出上限时按写入顺序淘汰最旧的若干项（Map 迭代顺序 = 最近写入顺序，无需排序）
const evictIfNeeded = (map: Map<string, CacheEntry>): void => {
  if (map.size <= CACHE_MAX_SIZE) return;
  const excess = map.size - CACHE_MAX_SIZE;
  let removed = 0;
  for (const domain of map.keys()) {
    if (removed >= excess) break;
    map.delete(domain);
    memoryCache.delete(domain);
    removed++;
  }
  // 结构性淘汰改变了整库，需全量写回
  fullFlushNeeded = true;
};

// 写入缓存：先 delete 再 set，使该域名移动到 Map 末尾（标记为最近使用），配合 evictIfNeeded 实现近似 LRU
const touch = (map: Map<string, CacheEntry>, domain: string, entry: CacheEntry): void => {
  map.delete(domain);
  map.set(domain, entry);
  evictIfNeeded(map);
};

// 内存缓存 LRU 上限：超出时按插入顺序淘汰最旧条目，防止长会话无限增长
const evictMemoryIfNeeded = (): void => {
  if (memoryCache.size <= MEMORY_CACHE_MAX) return;
  const excess = memoryCache.size - MEMORY_CACHE_MAX;
  let removed = 0;
  for (const domain of memoryCache.keys()) {
    if (removed >= excess) break;
    memoryCache.delete(domain);
    removed++;
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
 * 读取图标地址：命中有效缓存则返回缓存值；否则返回主源（站点自身 /favicon.ico）。
 * 注意：函数名中的 "Cached" 仅表示「优先取缓存」，未命中时仍会返回一个可用的主源地址，
 * 而非返回空串——调用方不应假设「返回空即未缓存」。
 * 未命中时【不】写入内存缓存——主源尚未经过加载验证，
 * 若缓存它，主源失败时无法走 fallback 链且会重复请求。
 * 验证通过的地址由 cacheFavicon 在 onIconLoad 时写入；
 * 主源与全部 fallback 均失败时由 cacheBrokenFavicon 标记占位图。
 */
export const getCachedFavicon = (domain: string): string => {
  if (memoryCache.has(domain)) {
    return memoryCache.get(domain) as string;
  }
  const store = loadPersistentCache();
  const entry = store.get(domain);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    memoryCache.set(domain, entry.url);
    evictMemoryIfNeeded();
    return entry.url;
  }
  return getFaviconUrl(domain);
};

/** 判断某域名是否已命中有效缓存（内存或持久化，未过期） */
export const isFaviconCached = (domain: string): boolean => {
  if (!domain) return false;
  if (memoryCache.has(domain)) return true;
  const entry = loadPersistentCache().get(domain);
  return !!(entry && Date.now() - entry.ts < CACHE_TTL);
};

/**
 * 标记某域名主源与全部 fallback 均失败：写入内存 + 持久化缓存，使刷新后仍跳过已知坏链。
 */
export const cacheBrokenFavicon = (domain: string): void => {
  if (!domain) return;
  const placeholder = getDefaultIcon();
  memoryCache.set(domain, placeholder);
  evictMemoryIfNeeded();
  const store = loadPersistentCache();
  touch(store, domain, { url: placeholder, ts: Date.now() });
  markDirty(domain);
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
  evictMemoryIfNeeded();
  const store = loadPersistentCache();
  touch(store, domain, { url, ts: Date.now() });
  markDirty(domain);
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

/* ------------------------------------------------------------------ *
 * 统一图标请求调度器
 * - 并发信号量（MAX_CONCURRENCY）限制同时在飞的图标请求，避免首屏洪峰
 * - 单源超时（REQUEST_TIMEOUT_MS），失败即放弃该源
 * - 主源 + 首个聚合器并行竞速（Promise.any），命中即停，避免 5 个 provider 顺序串行
 * - 同域名请求去重（inFlight）：卡片 <img> 与空闲预取共享，杜绝重复请求
 * ------------------------------------------------------------------ */

let activeRequests = 0;
const requestQueue: Array<() => void> = [];

const acquireSlot = (): Promise<void> => {
  if (activeRequests < MAX_CONCURRENCY) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise((resolve) => requestQueue.push(resolve));
};

const releaseSlot = (): void => {
  activeRequests--;
  const next = requestQueue.shift();
  if (next) {
    activeRequests++;
    next();
  }
};

/** 加载单个图标地址，超时则拒绝；校验尺寸，排除 1x1 占位图 */
const loadCandidate = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = '';
      reject(new Error('timeout'));
    }, REQUEST_TIMEOUT_MS);
    img.onload = () => {
      clearTimeout(timer);
      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        reject(new Error('invalid-size'));
        return;
      }
      resolve(url);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('error'));
    };
    img.src = url;
  });
};

/** 对一组候选地址竞速，返回首个成功加载的 URL（全部失败则 reject）。
 * 使用自定义竞速以兼容 ES2020 运行时（避免依赖 Promise.any）。 */
const raceCandidates = (candidates: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (candidates.length === 0) {
      reject(new Error('no-candidates'));
      return;
    }
    let pending = candidates.length;
    let settled = false;
    for (const url of candidates) {
      loadCandidate(url)
        .then((u) => {
          if (!settled) {
            settled = true;
            resolve(u);
          }
        })
        .catch(() => {
          pending--;
          if (!settled && pending === 0) reject(new Error('all-failed'));
        });
    }
  });
};

const inFlight = new Map<string, Promise<string>>();

/**
 * 解析某域名最终可用的图标地址：
 * 1. 命中缓存立即返回；2. 否则并发竞速主源 + 聚合器（带超时与全局并发上限）；
 * 3. 全部失败标记坏链并返回占位图。同一域名并发请求自动去重。
 */
export const requestFavicon = (domain: string): Promise<string> => {
  if (!domain) return Promise.resolve(getDefaultIcon());
  // 缓存命中（内存或持久化）同步返回，无需网络
  if (isFaviconCached(domain)) {
    return Promise.resolve(getCachedFavicon(domain));
  }
  // 去重：同一域名已在解析中则复用同一 Promise
  const existing = inFlight.get(domain);
  if (existing) return existing;

  const promise = (async (): Promise<string> => {
    await acquireSlot();
    try {
      const primary = getFaviconUrl(domain);
      const fallbacks = getFaviconFallbacks(domain);
      // 阶段一：主源 + 首个聚合器并行竞速
      try {
        const winner = await raceCandidates([primary, fallbacks[0]]);
        cacheFavicon(domain, winner);
        return winner;
      } catch {
        // 阶段二：剩余聚合器并行竞速
        try {
          const winner = await raceCandidates(fallbacks.slice(1));
          cacheFavicon(domain, winner);
          return winner;
        } catch {
          cacheBrokenFavicon(domain);
          return getDefaultIcon();
        }
      }
    } finally {
      inFlight.delete(domain);
      releaseSlot();
    }
  })();

  inFlight.set(domain, promise);
  return promise;
};

/**
 * 空闲预取未缓存的域名图标：利用 requestIdleCallback 在浏览器空闲时触发加载，
 * 将图标预热到浏览器 HTTP 缓存，避免首屏请求瀑布。
 * 复用统一调度器（requestFavicon），与卡片加载共享去重与并发控制。
 * 传入需预取的域名列表，自动跳过已缓存的域名。
 */
export const prefetchUncachedFavicons = (domains: string[]): void => {
  if (typeof requestIdleCallback === 'undefined') return;
  const store = loadPersistentCache();
  const now = Date.now();
  const uncached = domains.filter((d) => {
    if (!d) return false;
    const entry = store.get(d);
    return !entry || now - entry.ts >= CACHE_TTL;
  });
  if (uncached.length === 0) return;

  let idx = 0;
  const prefetchNext = (deadline: IdleDeadline) => {
    // 每个空闲周期预取最多 5 个域名，避免阻塞交互
    let count = 0;
    while (idx < uncached.length && count < 5 && deadline.timeRemaining() > 1) {
      const domain = uncached[idx];
      // 交给统一调度器：与卡片加载共享去重与并发控制
      void requestFavicon(domain).catch(() => {});
      idx++;
      count++;
    }
    if (idx < uncached.length) {
      requestIdleCallback(prefetchNext);
    }
  };
  requestIdleCallback(prefetchNext, { timeout: 2000 });
};
