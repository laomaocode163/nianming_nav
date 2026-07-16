import { describe, it, expect } from 'vitest';
import type { Category, Link } from '../../src/types';
import { nextLinkId, categoryBase, CATEGORY_ID_RANGE_SIZE } from '../../src/config/linkId';

const categories: Category[] = [
  { id: 'ai', name: '人工智能', icon: 'bot', subCategories: [] },
  { id: 'dev', name: '开发工具', icon: 'terminal', subCategories: [] },
  { id: 'frontend-dev', name: '前端开发', icon: 'book-open', subCategories: [] },
];

const link = (id: string, categoryId: string): Link => ({
  id,
  name: `s${id}`,
  url: `https://s${id}.com`,
  categoryId,
});

describe('linkId (按分类段位自增)', () => {
  it('categoryBase 映射固定段位', () => {
    expect(categoryBase('ai', categories)).toBe(1000);
    expect(categoryBase('dev', categories)).toBe(2000);
    expect(categoryBase('frontend-dev', categories)).toBe(3000);
  });

  it('段位为空时从 base+1 起', () => {
    expect(nextLinkId([], 'ai', categories)).toBe('1001');
    expect(nextLinkId([], 'dev', categories)).toBe('2001');
  });

  it('段内取已有最大 id + 1', () => {
    const links = [link('1005', 'ai'), link('1001', 'ai'), link('2003', 'dev')];
    expect(nextLinkId(links, 'ai', categories)).toBe('1006');
    expect(nextLinkId(links, 'dev', categories)).toBe('2004');
  });

  it('不同分类互不影响', () => {
    const links = [link('1999', 'ai')];
    expect(nextLinkId(links, 'dev', categories)).toBe('2001');
  });

  it('段位满后回退全局最大 + 1', () => {
    const links = Array.from({ length: CATEGORY_ID_RANGE_SIZE - 1 }, (_, i) =>
      link(String(1001 + i), 'ai')
    );
    expect(nextLinkId(links, 'ai', categories)).toBe('2000');
  });

  it('忽略非数字 / 越界 id', () => {
    const links = [link('abc', 'ai'), link('99999', 'ai')];
    expect(nextLinkId(links, 'ai', categories)).toBe('1001');
  });
});
