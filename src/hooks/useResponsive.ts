import { ref, computed, onUnmounted, getCurrentInstance, type Ref, type ComputedRef } from 'vue';

// Module-level shared state (singleton)
const windowWidth: Ref<number> = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

// 引用计数：保证全局仅注册一个 resize 监听器，所有消费者卸载后自动清理
let refCount = 0;
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

const attach = (): void => {
  if (refCount === 0) {
    window.addEventListener('resize', onResize);
  }
  refCount++;
};

const detach = (): void => {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) {
    window.removeEventListener('resize', onResize);
  }
};

/** 强制移除监听器并重置引用计数（供测试 / 手动清理） */
export const destroyResponsive = (): void => {
  window.removeEventListener('resize', onResize);
  refCount = 0;
};

/**
 * 响应式管理 Hook（单例模式）
 * 所有组件共享同一份状态和 resize 监听器；组件卸载时自动 detach，避免监听器泄漏。
 */
export function useResponsive() {
  attach();
  if (getCurrentInstance()) {
    onUnmounted(detach);
  }

  return {
    windowWidth,
    isMobile,
  };
}
