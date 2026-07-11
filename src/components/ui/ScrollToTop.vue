<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue';

  const props = defineProps<{
    /** 返回实际滚动容器；不传则回退到 window */
    target?: () => HTMLElement | null;
  }>();

  const visible = ref<boolean>(false);
  const scrollThreshold: number = 300;

  let container: HTMLElement | Window | null = null;

  const getEl = (): HTMLElement | null => props.target?.() ?? null;

  const handleScroll = (): void => {
    const el = getEl();
    visible.value = el ? el.scrollTop > scrollThreshold : window.scrollY > scrollThreshold;
  };

  const scrollToTop = (): void => {
    const el = getEl();
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const attach = (): void => {
    container = getEl() ?? window;
    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  };

  const detach = (): void => {
    container?.removeEventListener('scroll', handleScroll);
    container = null;
  };

  onMounted(() => {
    if (props.target) {
      watch(
        () => props.target?.(),
        (el) => {
          detach();
          if (el) attach();
        },
        { immediate: true }
      );
    } else {
      attach();
    }
  });

  onUnmounted(() => {
    detach();
  });
</script>

<template>
  <Transition name="scroll-fade">
    <button
      v-show="visible"
      class="scroll-to-top"
      title="回到顶部"
      aria-label="回到顶部"
      @click="scrollToTop"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 15 12 9 18 15" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
  .scroll-to-top {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 48px;
    height: 48px;
    background: var(--gradient-primary);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg), var(--shadow-glow);
    transition: all var(--transition-fast);
    z-index: 1000;
  }

  .scroll-to-top:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: var(--shadow-xl), var(--shadow-glow);
  }

  .scroll-to-top:active {
    transform: translateY(-2px) scale(1.02);
  }

  .scroll-fade-enter-active,
  .scroll-fade-leave-active {
    transition: all var(--transition-normal);
  }

  .scroll-fade-enter-from,
  .scroll-fade-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    .scroll-to-top {
      bottom: 1.5rem;
      right: 1.5rem;
      width: 44px;
      height: 44px;
      font-size: 1.125rem;
    }
  }

  @media (max-width: 480px) {
    .scroll-to-top {
      bottom: 1rem;
      right: 1rem;
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }
  }

  /* 触摸设备优化 */
  @media (hover: none) and (pointer: coarse) {
    .scroll-to-top {
      width: 48px;
      height: 48px;
    }

    .scroll-to-top:hover {
      transform: none;
      box-shadow: var(--shadow-lg), var(--shadow-glow);
    }

    .scroll-to-top:active {
      transform: scale(0.92);
      opacity: 0.85;
    }
  }
</style>
