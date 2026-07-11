import { ref, computed, Ref, ComputedRef } from 'vue';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Module-level shared state (singleton)
const windowWidth: Ref<number> = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const windowHeight: Ref<number> = ref(typeof window !== 'undefined' ? window.innerHeight : 768);
const isTouch: Ref<boolean> = ref(false);

let initialized = false;
let frame = 0;

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

const isSm: ComputedRef<boolean> = computed(() => windowWidth.value >= breakpoints.sm);
const isMd: ComputedRef<boolean> = computed(() => windowWidth.value >= breakpoints.md);
const isLg: ComputedRef<boolean> = computed(() => windowWidth.value >= breakpoints.lg);
const isXl: ComputedRef<boolean> = computed(() => windowWidth.value >= breakpoints.xl);
const is2xl: ComputedRef<boolean> = computed(() => windowWidth.value >= breakpoints['2xl']);

const isMobile: ComputedRef<boolean> = computed(() => windowWidth.value < breakpoints.md);
const isTablet: ComputedRef<boolean> = computed(
  () => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg
);
const isDesktop: ComputedRef<boolean> = computed(() => windowWidth.value >= breakpoints.lg);
const isSmallMobile: ComputedRef<boolean> = computed(() => windowWidth.value < breakpoints.sm);

const isLandscape: ComputedRef<boolean> = computed(() => windowWidth.value > windowHeight.value);
const isPortrait: ComputedRef<boolean> = computed(() => windowWidth.value <= windowHeight.value);

function init() {
  if (initialized) return;
  initialized = true;
  isTouch.value = isTouchDevice();
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
    windowHeight,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLandscape,
    isPortrait,
    isTouch,
  };
}
