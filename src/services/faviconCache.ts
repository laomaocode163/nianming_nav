/**
 * 网站图标缓存与地址解析层
 * - extractDomain: 从 URL 中提取域名
 * - getFaviconUrl: 主图标源（优先本地 /favicons/，命中清单则同源离线；否则站点自身 /favicon.ico）
 * - getFaviconFallbacks: 主源失败时的降级链
 * - getCachedFavicon / cacheFavicon / cacheBrokenFavicon / isFaviconCached: 内存 + localStorage 二级缓存
 *
 * 本地图标由 `npm run fetch-favicons` 下载到 public/favicons/ 并生成 faviconManifest.json，
 * 运行时优先使用，避免依赖外网（GFW 等受限网络下关键）。
 * 请求调度与竞速见 ./faviconScheduler。
 */
import faviconManifest from '@/config/faviconManifest.json';
import { getDefaultIcon } from '@/utils/constants';

/** 本地图标清单（域名 → 文件名）的类型化视图，集中此处避免散落的断言 */
const manifest = faviconManifest as Record<string, string>;

interface CacheEntry {
  url: string;
  ts: number;
}

const PRIMARY_PROVIDER = 'https://favicon.im';
const STORAGE_KEY = 'favicon-cache-v3';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天
const CACHE_MAX_SIZE = 200;
const SAVE_DEBOUNCE_MS = 500;
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
  const localFile = manifest[domain];
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

/**
 * 返回给定域名中未命中有效缓存（内存或持久化，未过期）的部分，
 * 供预取调度跳过已缓存域名，避免重复请求。
 */
export const getUncachedDomains = (domains: string[]): string[] => {
  const store = loadPersistentCache();
  const now = Date.now();
  return domains.filter((d) => {
    if (!d) return false;
    const entry = store.get(d);
    return !entry || now - entry.ts >= CACHE_TTL;
  });
};
