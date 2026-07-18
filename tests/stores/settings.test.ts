import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSettingsStore } from '../../src/stores/settings';

describe('settingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.documentElement.style.removeProperty('--hue-primary');
    document.documentElement.style.removeProperty('--app-bg-image');
    document.documentElement.style.removeProperty('--app-bg-color');
    document.documentElement.style.removeProperty('--app-bg-fit');
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

  it('apply writes background CSS variables for each type', async () => {
    const store = useSettingsStore();
    await store.init();

    store.settings.background = { type: 'solid', value: '#112233', fit: 'cover', showBlobs: false };
    store.apply();
    expect(document.documentElement.style.getPropertyValue('--app-bg-color')).toBe('#112233');

    store.settings.background = {
      type: 'gradient',
      value: 'linear-gradient(red, blue)',
      fit: 'cover',
      showBlobs: true,
    };
    store.apply();
    expect(document.documentElement.style.getPropertyValue('--app-bg-image')).toBe(
      'linear-gradient(red, blue)'
    );

    store.settings.background = {
      type: 'image',
      value: 'https://x/y.png',
      fit: 'repeat',
      showBlobs: true,
    };
    store.apply();
    expect(document.documentElement.style.getPropertyValue('--app-bg-image')).toBe(
      'url("https://x/y.png")'
    );
    expect(document.documentElement.style.getPropertyValue('--app-bg-fit')).toBe('repeat');

    // default 类型清空自定义变量
    store.settings.background = { type: 'default', value: '', fit: 'cover', showBlobs: true };
    store.apply();
    expect(document.documentElement.style.getPropertyValue('--app-bg-image')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--app-bg-color')).toBe('');
  });
});
