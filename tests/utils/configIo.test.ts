import { describe, it, expect } from 'vitest';
import { buildExportPayload, parseImportPayload } from '../../src/utils/configIo';
import type { UserPrefsState } from '../../src/stores/userPrefs';
import type { SiteConfig } from '../../src/types';

const basePrefs: UserPrefsState = {
  favorites: ['https://a.com'],
  recentVisits: [{ url: 'https://b.com', ts: 1 }],
  theme: 'dark',
  selectedSearchSourceId: 'google',
};

const baseSite: SiteConfig = {
  categories: [{ id: 'c1', name: 'C', icon: 'star' }],
  links: [{ id: 'l1', name: 'L', url: 'https://l.com', categoryId: 'c1' }],
  searchConfig: { selectedSourceId: 'google', externalSources: [] },
  settings: { accentColor: '10 20 30' },
};

describe('configIo', () => {
  it('buildExportPayload wraps prefs + siteConfig with version and timestamp', () => {
    const payload = buildExportPayload(basePrefs, baseSite);
    expect(payload.version).toBe(1);
    expect(typeof payload.exportedAt).toBe('string');
    expect(payload.prefs).toBe(basePrefs);
    expect(payload.siteConfig).toBe(baseSite);
  });

  it('parseImportPayload reads new format (prefs + siteConfig)', () => {
    const text = JSON.stringify({ version: 1, prefs: basePrefs, siteConfig: baseSite });
    const { prefs, siteConfig } = parseImportPayload(text);
    expect(prefs).toEqual(basePrefs);
    expect(siteConfig).toEqual(baseSite);
  });

  it('parseImportPayload falls back to legacy bare-prefs format', () => {
    const text = JSON.stringify(basePrefs);
    const { prefs, siteConfig } = parseImportPayload(text);
    expect(prefs).toEqual(basePrefs);
    expect(siteConfig).toBeUndefined();
  });

  it('parseImportPayload throws on invalid JSON', () => {
    expect(() => parseImportPayload('not json')).toThrow();
  });
});
