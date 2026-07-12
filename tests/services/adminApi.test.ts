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
  categoryId: 'common',
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
    mockFetch([{ categoryId: 'common', categoryName: '常用', ...sampleSub }]);
    const subs = await adminApi.getSubCategories();
    expect(subs[0].categoryId).toBe('common');
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
    mockFetch({ categoryId: 'common', ...sampleSub });
    const created = await adminApi.createSubCategory('common', sampleSub);
    expect(created.categoryId).toBe('common');
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
});
