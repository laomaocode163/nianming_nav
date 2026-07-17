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

describe('adminApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('createLink POSTs and returns created link', async () => {
    mockFetch(sampleLink, 201);
    const created = await adminApi.createLink(sampleLink);
    expect(created.id).toBe('999');
  });

  it('updateCategory PUTs and returns updated category', async () => {
    mockFetch(sampleCategory);
    const updated = await adminApi.updateCategory('newcat', sampleCategory);
    expect(updated.id).toBe('newcat');
  });

  it('deleteCategory returns ok', async () => {
    mockFetch({ ok: true });
    const res = await adminApi.deleteCategory('newcat');
    expect(res.ok).toBe(true);
  });

  it('createSubCategory POSTs with categoryId', async () => {
    mockFetch({ categoryId: 'dev', ...sampleSub });
    const created = await adminApi.createSubCategory('dev', sampleSub);
    expect(created.categoryId).toBe('dev');
  });

  it('fetchFavicons POSTs and returns result', async () => {
    mockFetch({ ok: true, code: 0, output: 'done' });
    const res = await adminApi.fetchFavicons(false);
    expect(res.ok).toBe(true);
  });

  it('throws AdminApiError with server message on 400', async () => {
    mockFetch({ error: '校验失败：name 必填' }, 400);
    await expect(adminApi.createLink(sampleLink)).rejects.toThrow('校验失败：name 必填');
  });

  it('throws on 500', async () => {
    mockFetch({ error: '服务器错误' }, 500);
    await expect(adminApi.getLinks()).rejects.toThrow('服务器错误');
  });

  it('getSettings returns parsed settings', async () => {
    mockFetch({ accentColor: '14 165 233' });
    const settings = await adminApi.getSettings();
    expect(settings.accentColor).toBe('14 165 233');
  });

  it('updateSettings PUTs and returns settings', async () => {
    mockFetch({ accentColor: '0 0 0' });
    const res = await adminApi.updateSettings({ accentColor: '0 0 0' });
    expect(res.accentColor).toBe('0 0 0');
  });

  it('getSearchConfig returns parsed config', async () => {
    mockFetch({ selectedSourceId: 'baidu', externalSources: [] });
    const cfg = await adminApi.getSearchConfig();
    expect(cfg.selectedSourceId).toBe('baidu');
  });

  it('updateSearchConfig PUTs and returns config', async () => {
    const cfg = {
      selectedSourceId: 'g',
      externalSources: [{ id: 'g', name: 'G', url: 'u', enabled: true }],
    };
    mockFetch(cfg);
    const res = await adminApi.updateSearchConfig(cfg);
    expect(res.externalSources).toHaveLength(1);
  });

  it('reorderCategories POSTs ids', async () => {
    mockFetch({ ok: true });
    const res = await adminApi.reorderCategories(['b', 'a']);
    expect(res.ok).toBe(true);
  });

  it('reorderSubCategories POSTs to nested path', async () => {
    mockFetch({ ok: true });
    const res = await adminApi.reorderSubCategories('dev', ['s2', 's1']);
    expect(res.ok).toBe(true);
  });

  it('reorderLinks POSTs category, sub and ids', async () => {
    mockFetch({ ok: true });
    const res = await adminApi.reorderLinks('dev', 'fe', ['2', '1']);
    expect(res.ok).toBe(true);
  });
});
