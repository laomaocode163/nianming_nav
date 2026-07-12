import { ref, computed, type Ref, type ComputedRef } from 'vue';

// Module-level shared state (singleton)
const windowWidth: Ref<number> = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

let initialized = false;
let frame = 0;

const updateWindowSize = (): void => {
  windowWidth.value = window.innerWidth;
};

const onResize = (): void => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    updateWindowSize();
  });
};

const MOBILE_BREAKPOINT = 768;

const isMobile: ComputedRef<boolean> = computed(() => windowWidth.value < MOBILE_BREAKPOINT);

function init() {
  if (initialized) return;
  initialized = true;
  window.addEventListener('resize', onResize);
}

/**
 * 响应式管理 Hook（单例模式）
 * 所有组件共享同一份状态和 resize 监听器
 */
export function useResponsive() {
  init();

  return {
    windowWidth,
    isMobile,
  };
}
