import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDataStore } from '../../src/stores/data';
import { useSettingsStore } from '../../src/stores/settings';
import { getFaviconUrl } from '../../src/services/faviconService';

describe('dataStore', () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
  });

  describe('async initialization', () => {
    it('should not be ready and have no links before init', () => {
      const store = useDataStore();
      expect(store.ready).toBe(false);
      expect(store.links.length).toBe(0);
    });

    it('should load links and categories from config after init', async () => {
      const store = useDataStore();
      await store.init();
      expect(store.ready).toBe(true);
      expect(store.links.length).toBeGreaterThan(0);
      expect(store.categories.length).toBeGreaterThan(0);
    });

    it('should populate search config after init', async () => {
      const store = useDataStore();
      await store.init();
      expect(store.searchConfig?.selectedSourceId).toBeDefined();
      expect(store.searchConfig?.externalSources.length).toBeGreaterThan(0);
    });

    it('should load site settings via settingsStore', async () => {
      const settingsStore = useSettingsStore();
      await settingsStore.init();
      expect(settingsStore.settings).not.toBeNull();
      expect(settingsStore.settings?.accentColor).toBeDefined();
    });
  });

  describe('links management', () => {
    it('should get links by category', async () => {
      const store = useDataStore();
      await store.init();

      const allLinks = store.getLinksByCategory('all');
      expect(allLinks.length).toBeGreaterThan(0);

      if (store.categories.length > 0) {
        const firstCategoryId = store.categories[0].id;
        const categoryLinks = store.getLinksByCategory(firstCategoryId);
        expect(categoryLinks.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('categories management', () => {
    it('should return visible categories', async () => {
      const store = useDataStore();
      await store.init();
      const visibleCats = store.visibleCategories;
      expect(visibleCats.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('icon management', () => {
    it('should resolve link icon via the favicon service (local manifest or site favicon)', async () => {
      const store = useDataStore();
      await store.init();
      if (store.links.length > 0) {
        const link = store.links[0];
        const icon = store.getLinkIcon(link);
        expect(typeof icon).toBe('string');
        // 与 faviconService 的解析结果一致：命中本地清单则为 /favicons/*，否则站点自身 favicon
        expect(icon).toBe(getFaviconUrl(new URL(link.url).hostname));
      }
    });
  });
});
