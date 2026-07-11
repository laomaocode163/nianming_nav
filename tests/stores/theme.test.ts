import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useThemeStore } from '../../src/stores/theme';

describe('themeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('initTheme falls back to system preference when no saved theme', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const store = useThemeStore();
    store.initTheme();
    expect(store.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggleTheme flips and persists', () => {
    const store = useThemeStore();
    store.initTheme();
    const before = store.isDark;
    store.toggleTheme();
    expect(store.isDark).toBe(!before);
    expect(localStorage.getItem('theme')).toBe(store.isDark ? 'dark' : 'light');
  });
});
