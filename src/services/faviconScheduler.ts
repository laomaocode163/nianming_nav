/**
 * 统一图标请求调度器
 * - 并发信号量（MAX_CONCURRENCY）限制同时在飞的图标请求，避免首屏洪峰
 * - 单源超时（REQUEST_TIMEOUT_MS），失败即放弃该源
 * - 主源 + 首个聚合器并行竞速（raceCandidates），命中即停，避免 5 个 provider 顺序串行
 * - 同域名请求去重（inFlight），卡片 <img> 与空闲预取共享，杜绝重复请求
 * 缓存与地址解析见 ./faviconCache。
 */
import { getDefaultIcon } from '@/utils/constants';
import {
  getFaviconUrl,
  getFaviconFallbacks,
  isFaviconCached,
  getCachedFavicon,
  cacheFavicon,
  cacheBrokenFavicon,
  getUncachedDomains,
} from './faviconCache';

// 图标请求调度参数
const REQUEST_TIMEOUT_MS = 3500; // 单源超时（AbortController / 计时器）
const MAX_CONCURRENCY = 8; // 全局并发信号量上限，避免首屏图标请求洪峰

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
  const uncached = getUncachedDomains(domains);
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
