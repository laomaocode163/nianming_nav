import { ref, computed, type Ref, type ComputedRef } from 'vue';

// Module-level shared state (singleton)
const windowWidth: Ref<number> = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const windowHeight: Ref<number> = ref(typeof window !== 'undefined' ? window.innerHeight : 768);

let frame = 0;
let listenerAttached = false;

const updateWindowSize = (): void => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
};

const onResize = (): void => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    updateWindowSize();
  });
};

const ensureListener = (): void => {
  if (listenerAttached) return;
  listenerAttached = true;
  window.addEventListener('resize', onResize);
};

const MOBILE_BREAKPOINT = 768;

const isMobile: ComputedRef<boolean> = computed(() => windowWidth.value < MOBILE_BREAKPOINT);

/** 强制移除监听器（供测试清理） */
export const destroyResponsive = (): void => {
  window.removeEventListener('resize', onResize);
  listenerAttached = false;
};

/**
 * 响应式窗口尺寸 Hook（单例模式）
 * 全局共享一份 resize 监听器，首次调用注册、永不自动卸载。
 * 避免了 refCount / getCurrentInstance 的泄漏与测试问题。
 */
export function useResponsive() {
  ensureListener();

  return {
    windowWidth,
    windowHeight,
    isMobile,
  };
}
