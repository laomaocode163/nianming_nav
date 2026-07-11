import { describe, it, expect } from 'vitest';
import { validateReferentialIntegrity } from '../../src/config/loadConfig';
import type { Category, Link } from '../../src/types';

const baseCategories: Category[] = [
  {
    id: 'cat1',
    name: '分类一',
    icon: '🌐',
    subCategories: [{ id: 'sub1', name: '子一' }],
  },
  { id: 'cat2', name: '分类二', icon: '📁' },
];

const baseLinks: Link[] = [
  {
    id: 'link1',
    name: '站点一',
    url: 'https://example.com',
    categoryId: 'cat1',
    subCategoryId: 'sub1',
  },
];

describe('validateReferentialIntegrity', () => {
  it('passes for valid config', () => {
    expect(() => validateReferentialIntegrity(baseCategories, baseLinks)).not.toThrow();
  });

  it('throws when link references a missing category', () => {
    const links: Link[] = [{ ...baseLinks[0], categoryId: 'nope' }];
    expect(() => validateReferentialIntegrity(baseCategories, links)).toThrow(/不存在的分类/);
  });

  it('throws when link references a missing sub-category', () => {
    const links: Link[] = [{ ...baseLinks[0], subCategoryId: 'nope' }];
    expect(() => validateReferentialIntegrity(baseCategories, links)).toThrow(/不存在的二级分类/);
  });

  it('throws on duplicate category id', () => {
    const categories: Category[] = [{ ...baseCategories[0] }, { ...baseCategories[0] }];
    expect(() => validateReferentialIntegrity(categories, baseLinks)).toThrow(/重复的/);
  });

  it('throws on duplicate link id', () => {
    const links: Link[] = [{ ...baseLinks[0] }, { ...baseLinks[0] }];
    expect(() => validateReferentialIntegrity(baseCategories, links)).toThrow(/重复的/);
  });

  it('throws on duplicate sub-category id within a category', () => {
    const categories: Category[] = [
      {
        id: 'cat1',
        name: '分类一',
        icon: '🌐',
        subCategories: [
          { id: 'sub1', name: '子一' },
          { id: 'sub1', name: '子一重复' },
        ],
      },
    ];
    expect(() => validateReferentialIntegrity(categories, baseLinks)).toThrow(/重复的/);
  });
});
