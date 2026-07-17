<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import type { SubCategory } from '@/types';

  interface Props {
    subCategories: SubCategory[];
    selectedId: string | null;
    totalCount: number;
    counts?: Record<string, number>;
  }

  const props = withDefaults(defineProps<Props>(), {
    counts: () => ({}),
  });

  defineEmits<{
    select: [id: string | null];
  }>();

  const scrollRef = ref<HTMLElement | null>(null);
  const canScrollLeft = ref(false);
  const canScrollRight = ref(false);

  const updateScrollState = () => {
    const el = scrollRef.value;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    canScrollLeft.value = scrollLeft > 1;
    canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1;
  };

  const scrollByAmount = (dir: number) => {
    const el = scrollRef.value;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: 'smooth' });
  };

  // 二级标签键盘导航：←/→ 在标签间移动焦点，Home/End 跳到首尾
  const onTabsKeydown = (e: KeyboardEvent) => {
    const el = scrollRef.value;
    if (!el) return;
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>('.tab-item'));
    if (!tabs.length) return;
    const current = tabs.findIndex((t) => t === document.activeElement);
    let next = current;
    if (e.key === 'ArrowRight') next = current < 0 ? 0 : (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft')
      next = current < 0 ? tabs.length - 1 : (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    e.preventDefault();
    tabs[next]?.focus();
  };

  onMounted(async () => {
    await nextTick();
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateScrollState);
  });
</script>

<template>
  <div class="sub-category-tabs-wrap">
    <button
      v-show="canScrollLeft"
      type="button"
      class="scroll-arrow scroll-arrow--left"
      aria-label="向左滚动"
      @click="scrollByAmount(-1)"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div
      ref="scrollRef"
      class="sub-category-tabs"
      role="tablist"
      @scroll="updateScrollState"
      @keydown="onTabsKeydown"
    >
      <button
        class="tab-item tab-item--all"
        :class="{ active: selectedId === null }"
        role="tab"
        :aria-selected="selectedId === null"
        @click="$emit('select', null)"
      >
        全部
        <span class="tab-count">{{ totalCount }}</span>
      </button>
      <button
        v-for="sub in subCategories"
        :key="sub.id"
        class="tab-item"
        :class="{ active: selectedId === sub.id }"
        :title="sub.name"
        role="tab"
        :aria-selected="selectedId === sub.id"
        @click="$emit('select', sub.id)"
      >
        {{ sub.name }}
        <span v-if="props.counts[sub.id] !== undefined" class="tab-count">{{
          props.counts[sub.id]
        }}</span>
      </button>
    </div>

    <button
      v-show="canScrollRight"
      type="button"
      class="scroll-arrow scroll-arrow--right"
      aria-label="向右滚动"
      @click="scrollByAmount(1)"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
  .sub-category-tabs-wrap {
    display: flex;
    align-items: center;
    position: relative;
    gap: 0.25rem;
  }

  .scroll-arrow {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    color: var(--color-text-secondary);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;
  }

  .scroll-arrow:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .scroll-arrow:active {
    transform: scale(0.94);
  }

  .scroll-arrow:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .sub-category-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    flex: 1;
    min-width: 0;
    position: relative;
    scroll-behavior: smooth;
  }

  .sub-category-tabs::-webkit-scrollbar {
    display: none;
  }

  /* 边缘渐隐遮罩：提示横向可溢出滚动 */
  .sub-category-tabs::before,
  .sub-category-tabs::after {
    content: '';
    position: sticky;
    flex-shrink: 0;
    width: 0;
    align-self: stretch;
    pointer-events: none;
  }

  .tab-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-size: 0.875rem;
    font-family: inherit;
    font-weight: 500;
  }

  .tab-item:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .tab-item:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .tab-item.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    box-shadow: var(--shadow-glow);
    transform: translateY(-1px);
  }

  .tab-item.active .tab-count {
    color: white;
  }

  /* “全部”汇总项：与二级标签作视觉区分 */
  .tab-item--all {
    background: var(--glass-bg-strong);
    border-style: dashed;
    font-weight: 600;
  }

  .tab-item--all.active {
    background: var(--color-primary);
    border-style: solid;
  }

  .tab-count {
    font-size: 0.75rem;
    opacity: 0.8;
    padding-left: 0.125rem;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 768px) {
    .tab-item {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .sub-category-tabs {
      padding: 0.75rem 0;
    }

    .scroll-arrow {
      width: 28px;
      height: 28px;
    }
  }
</style>
