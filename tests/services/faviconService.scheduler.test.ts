import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFaviconUrl,
  getCachedFavicon,
  cacheFavicon,
  requestFavicon,
} from '../../src/services/faviconService';
import { getDefaultIcon } from '../../src/utils/constants';

const STORAGE_KEY = 'favicon-cache-v3';

type Behavior = 'ok' | 'fail' | 'hang';

const makeLocalStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    clear: () => map.clear(),
  } as Storage;
};

describe('faviconService scheduler (race / timeout / dedup / concurrency)', () => {
  let created: { src: string }[];

  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    created = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 安装可控的 Image 桩：behavior 决定加载结果，回调延后到微任务以匹配 loadCandidate 的赋值顺序
  const installImage = (behavior: (url: string) => Behavior) => {
    class ImageStub {
      naturalWidth = 32;
      naturalHeight = 32;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        created.push(this);
      }
    }
    // 通过原型访问器拦截 src 赋值（注意：不能在类上声明 src 字段，否则会遮蔽此访问器）
    Object.defineProperty(ImageStub.prototype, 'src', {
      get() {
        return (this as { _src?: string })._src ?? '';
      },
      set(v: string) {
        (this as { _src?: string })._src = v;
        const result = behavior(v);
        if (result === 'ok') queueMicrotask(() => this.onload && this.onload());
        else if (result === 'fail') queueMicrotask(() => this.onerror && this.onerror());
        // 'hang' → 不触发任何回调，由 loadCandidate 的超时计时器兜底
      },
    });
    vi.stubGlobal('Image', ImageStub);
  };

  it('returns cached url without any network request', async () => {
    cacheFavicon('cached.com', 'https://icons.duckduckgo.com/ip3/cached.com.ico');
    const url = await requestFavicon('cached.com');
    expect(url).toBe('https://icons.duckduckgo.com/ip3/cached.com.ico');
    // 缓存命中不应创建任何 Image
    expect(created.length).toBe(0);
  });

  it('races primary + first fallback and returns the first success', async () => {
    // 主源失败，首个聚合器（favicon.im）成功
    installImage((url) => (url.includes('favicon.im') ? 'ok' : 'fail'));
    const url = await requestFavicon('race.com');
    expect(url).toContain('favicon.im');
    // 解析结果被写入缓存，后续读取直接命中
    expect(getCachedFavicon('race.com')).toBe(url);
  });

  it('falls back to placeholder when all sources fail', async () => {
    installImage(() => 'fail');
    const url = await requestFavicon('allbad.com');
    expect(url).toBe(getDefaultIcon());
    // 坏链被持久化，避免重复探测
    expect(getCachedFavicon('allbad.com')).toBe(getDefaultIcon());
    // 持久化写入有 500ms 防抖，等待落盘
    await new Promise((r) => setTimeout(r, 600));
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(store['allbad.com']?.url).toBe(getDefaultIcon());
  });

  it('deduplicates concurrent requests for the same domain', async () => {
    // 主源成功；两个并发请求应共享同一 Promise，仅创建一次候选 Image
    installImage((url) => (url.endsWith('/favicon.ico') ? 'ok' : 'fail'));
    const p1 = requestFavicon('dedup.com');
    const p2 = requestFavicon('dedup.com');
    expect(p1).toBe(p2); // 同一 Promise 实例（去重）
    const [u1, u2] = await Promise.all([p1, p2]);
    expect(u1).toBe(getFaviconUrl('dedup.com'));
    expect(u2).toBe(u1);
    // 阶段一仅 [主源, 首个聚合器] 两个候选，去重后只创建 2 个 Image
    expect(created.length).toBe(2);
  });

  it('caps concurrent in-flight requests via the semaphore', async () => {
    vi.useFakeTimers();
    // 全部挂起：仅 MAX_CONCURRENCY 个域名进入阶段一，每个创建 2 个候选 Image
    installImage(() => 'hang');
    const domains = Array.from({ length: 20 }, (_, i) => `conc-${i}.com`);
    domains.forEach((d) => void requestFavicon(d));
    // 刷新微任务以创建 Image 实例
    await vi.advanceTimersByTimeAsync(1);
    // 信号量将同时在飞的域名限制在 8 个；每个域名在阶段一创建 2 个候选 Image，
    // 故已创建的 Image 数不超过 16，且为偶数（每域名恰好 2 个）。这证明了并发上限生效。
    expect(created.length).toBeLessThanOrEqual(8 * 2);
    expect(created.length % 2).toBe(0);
    expect(created.length).toBeGreaterThan(0);
    // 推进超时使所有请求结算并释放信号量，避免测试间状态泄漏
    await vi.advanceTimersByTimeAsync(4000);
    vi.useRealTimers();
  });
});
