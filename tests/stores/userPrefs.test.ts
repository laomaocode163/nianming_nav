import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUserPrefsStore } from '../../src/stores/userPrefs';

describe('userPrefsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts empty with default state', () => {
    const store = useUserPrefsStore();
    expect(store.state.favorites).toEqual([]);
    expect(store.state.recentVisits).toEqual([]);
    expect(store.state.theme).toBeNull();
    expect(store.state.selectedSearchSourceId).toBeNull();
  });

  it('toggles favorites on/off and dedupes', () => {
    const store = useUserPrefsStore();
    expect(store.toggleFavorite('a')).toBe(true);
    expect(store.toggleFavorite('b')).toBe(true);
    expect(store.isFavorite('a')).toBe(true);
    expect(store.state.favorites).toEqual(['b', 'a']);
    // 再次 toggle 取消收藏
    expect(store.toggleFavorite('a')).toBe(false);
    expect(store.isFavorite('a')).toBe(false);
    expect(store.state.favorites).toEqual(['b']);
  });

  it('records visits and sorts by recency', () => {
    const store = useUserPrefsStore();
    store.recordVisit('a');
    store.recordVisit('b');
    store.recordVisit('a'); // 重复访问应更新时间戳并前置
    expect(store.state.recentVisits.map((v) => v.id)).toEqual(['a', 'b']);
    expect(store.visitTs('a')).toBeGreaterThanOrEqual(store.visitTs('b'));
  });

  it('persists to a single versioned localStorage key', () => {
    const store = useUserPrefsStore();
    store.toggleFavorite('x');
    store.setTheme('dark');
    store.setSearchSource('bing');
    // 防抖落盘：等待超过 SAVE_DEBOUNCE_MS
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const raw = localStorage.getItem('user-prefs-v1');
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw as string);
        expect(parsed.favorites).toContain('x');
        expect(parsed.theme).toBe('dark');
        expect(parsed.selectedSearchSourceId).toBe('bing');
        resolve();
      }, 300);
    });
  });

  it('migrates legacy bare localStorage keys on first load', () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('selected-search-source', 'google');
    const store = useUserPrefsStore();
    expect(store.state.theme).toBe('dark');
    expect(store.state.selectedSearchSourceId).toBe('google');
  });

  it('exports and imports data round-trip', () => {
    const store = useUserPrefsStore();
    store.toggleFavorite('fav1');
    store.recordVisit('recent1');
    const exported = store.exportData();
    // 清空后导入
    store.clearFavorites();
    store.clearRecent();
    expect(store.state.favorites).toEqual([]);
    expect(store.importData(exported)).toBe(true);
    expect(store.state.favorites).toContain('fav1');
    expect(store.state.recentVisits.map((v) => v.id)).toContain('recent1');
  });

  it('rejects malformed import data', () => {
    const store = useUserPrefsStore();
    expect(store.importData('not-json')).toBe(false);
    expect(store.importData('123')).toBe(false);
  });
});
