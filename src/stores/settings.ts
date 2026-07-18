/**
 * 设置 store
 * 将 settings.json 中定义的运行时设置真正应用到界面：
 * - accentColor -> 主色 HSL CSS 变量（让配置闭环生效）
 */
import { defineStore } from 'pinia';
import { reactive, ref, watch } from 'vue';
import { loadSiteConfig } from '../config/loadConfig';
import type { BackgroundConfig, SiteSettings } from '../types';

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const useSettingsStore = defineStore('settings', () => {
  const ready = ref(false);
  const settings = reactive({}) as SiteSettings;

  const init = async (): Promise<void> => {
    if (ready.value) return;
    const config = await loadSiteConfig();
    Object.assign(settings, config.settings);
    ready.value = true;
  };

  const applyAccent = (): void => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (settings.accentColor) {
      const parts = settings.accentColor.split(/\s+/).map(Number);
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
        const { h, s, l } = rgbToHsl(parts[0], parts[1], parts[2]);
        root.style.setProperty('--hue-primary', String(h));
        root.style.setProperty('--sat-primary', `${s}%`);
        root.style.setProperty('--lig-primary', `${l}%`);
      }
    }
  };

  /** 将导航页背景配置写入 CSS 变量，由 App.vue 的 .app-container / .app-bg 消费 */
  const applyBackground = (): void => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.removeProperty('--app-bg-color');
    root.style.removeProperty('--app-bg-image');
    root.style.removeProperty('--app-bg-fit');

    const bg = settings.background as BackgroundConfig | undefined;
    if (!bg || bg.type === 'default') return;

    if (bg.type === 'solid') {
      root.style.setProperty('--app-bg-color', bg.value ?? '');
    } else if (bg.type === 'gradient') {
      root.style.setProperty('--app-bg-image', bg.value ?? '');
    } else if (bg.type === 'image') {
      const url = bg.value ?? '';
      root.style.setProperty('--app-bg-image', url ? `url("${url}")` : 'none');
      root.style.setProperty('--app-bg-fit', bg.fit ?? 'cover');
    }
  };

  const apply = (): void => {
    applyAccent();
    applyBackground();
  };

  // accentColor / background 变化时自动 re-apply（admin 改设置等场景即时生效）
  watch(
    () => settings.accentColor,
    () => {
      applyAccent();
    }
  );
  watch(
    () => settings.background,
    () => {
      applyBackground();
    },
    { deep: true }
  );

  return { ready, init, settings, apply };
});
