import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSettingsStore } from '../../src/stores/settings';

describe('settingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.documentElement.removeAttribute('data-card-style');
    document.documentElement.style.removeProperty('--hue-primary');
    document.documentElement.style.removeProperty('--app-bg-image');
  });

  it('init loads settings from config', async () => {
    const store = useSettingsStore();
    await store.init();
    expect(store.settings).not.toBeNull();
  });

  it('apply writes accent color CSS variables', async () => {
    const store = useSettingsStore();
    await store.init();
    store.settings.accentColor = '59 130 246';
    store.apply();
    // rgb(59,130,246) -> hsl 约 217
    expect(Number(document.documentElement.style.getPropertyValue('--hue-primary'))).toBe(217);
  });

  it('apply writes card-style data attribute', async () => {
    const store = useSettingsStore();
    await store.init();
    store.settings.cardStyle = 'compact';
    store.apply();
    expect(document.documentElement.getAttribute('data-card-style')).toBe('compact');
  });
});
