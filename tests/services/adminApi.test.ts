import { describe, it, expect, vi, afterEach } from 'vitest';
import { adminApi } from '../../src/services/adminApi';
import type { Category, Link, SubCategory } from '../../src/types';

const mockFetch = (body: unknown, status = 200): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => (body === null ? '' : JSON.stringify(body)),
    }))
  );
};

const sampleLink: Link = {
  id: '999',
  name: 'Test',
  url: 'https://test.dev',
  categoryId: 'dev',
};

const sampleCategory: Category = { id: 'newcat', name: 'New', icon: '🔥' };

const sampleSub: SubCategory = { id: 'newsub', name: 'New Sub' };

describe('adminApi (只读)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getCategories returns parsed categories', async () => {
    mockFetch([sampleCategory]);
    const cats = await adminApi.getCategories();
    expect(cats).toHaveLength(1);
    expect(cats[0].id).toBe('newcat');
  });

  it('getLinks returns parsed links', async () => {
    mockFetch([sampleLink]);
    const links = await adminApi.getLinks();
    expect(links).toHaveLength(1);
    expect(links[0].name).toBe('Test');
  });

  it('getSubCategories returns flattened subs', async () => {
    mockFetch([{ categoryId: 'dev', categoryName: '常用', ...sampleSub }]);
    const subs = await adminApi.getSubCategories();
    expect(subs[0].categoryId).toBe('dev');
    expect(subs[0].name).toBe('New Sub');
  });

  it('getSettings returns parsed settings', async () => {
    mockFetch({ accentColor: '14 165 233' });
    const settings = await adminApi.getSettings();
    expect(settings.accentColor).toBe('14 165 233');
  });

  it('getSearchConfig returns parsed config', async () => {
    mockFetch({ selectedSourceId: 'baidu', externalSources: [] });
    const cfg = await adminApi.getSearchConfig();
    expect(cfg.selectedSourceId).toBe('baidu');
  });

  it('throws AdminApiError with server message on error status', async () => {
    mockFetch({ error: '仅读取失败' }, 404);
    await expect(adminApi.getLinks()).rejects.toThrow('仅读取失败');
  });

  it('throws on 500', async () => {
    mockFetch({ error: '服务器错误' }, 500);
    await expect(adminApi.getLinks()).rejects.toThrow('服务器错误');
  });
});
