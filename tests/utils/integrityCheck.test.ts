import { describe, it, expect } from 'vitest';
import { findDuplicateUrls, findOrphanLinks, normalizeUrl } from '../../src/utils/integrityCheck';
import type { Category, Link } from '../../src/types';

const cat = (id: string, subs: string[] = []): Category => ({
  id,
  name: id,
  icon: '🔥',
  subCategories: subs.map((s) => ({ id: s, name: s })),
});

const link = (
  id: string,
  name: string,
  url: string,
  categoryId: string,
  subCategoryId?: string
): Link => ({
  id,
  name,
  url,
  categoryId,
  subCategoryId,
});

describe('normalizeUrl', () => {
  it('lowercases and strips trailing slash', () => {
    expect(normalizeUrl('https://Example.com/')).toBe('https://example.com');
    expect(normalizeUrl('  https://a.com/path/  ')).toBe('https://a.com/path');
  });
});

describe('findOrphanLinks', () => {
  it('returns empty when all links reference valid categories/subs', () => {
    const categories = [cat('dev', ['fe'])];
    const links = [link('1', 'A', 'https://a.com', 'dev', 'fe')];
    expect(findOrphanLinks(categories, links)).toHaveLength(0);
  });

  it('flags links referencing missing category', () => {
    const categories = [cat('dev')];
    const links = [link('1', 'A', 'https://a.com', 'ghost')];
    const orphans = findOrphanLinks(categories, links);
    expect(orphans).toHaveLength(1);
    expect(orphans[0].reason).toContain('ghost');
  });

  it('flags links referencing missing subcategory', () => {
    const categories = [cat('dev', ['fe'])];
    const links = [link('1', 'A', 'https://a.com', 'dev', 'missing')];
    const orphans = findOrphanLinks(categories, links);
    expect(orphans).toHaveLength(1);
    expect(orphans[0].reason).toContain('missing');
  });
});

describe('findDuplicateUrls', () => {
  it('returns empty when urls are unique', () => {
    const links = [link('1', 'A', 'https://a.com', 'dev'), link('2', 'B', 'https://b.com', 'dev')];
    expect(findDuplicateUrls(links)).toHaveLength(0);
  });

  it('groups trailing-slash / case variants as duplicates', () => {
    const links = [
      link('1', 'A', 'https://a.com/', 'dev'),
      link('2', 'B', 'https://A.com', 'dev'),
      link('3', 'C', 'https://b.com', 'dev'),
    ];
    const dupes = findDuplicateUrls(links);
    expect(dupes).toHaveLength(1);
    expect(dupes[0].items).toHaveLength(2);
  });
});
