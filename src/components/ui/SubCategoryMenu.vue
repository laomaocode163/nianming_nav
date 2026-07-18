<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import type { SubCategory } from '@/types';

  interface Props {
    subCategories: SubCategory[];
    selectedId: string | null;
  }

  defineProps<Props>();

  const emit = defineEmits<{
    select: [id: string | null];
    resize: [height: number];
  }>();

  const rootRef = ref<HTMLElement | null>(null);
  let ro: ResizeObserver | null = null;

  // 换行布局下菜单高度为 1~N 行（动态），向上层报告真实高度，
  // 供分页高度估算扣减，避免多行时卡片被裁切。
  const notifyHeight = () => {
    const el = rootRef.value;
    if (!el) return;
    emit('resize', el.getBoundingClientRect().height);
  };

  // 二级菜单键盘导航：←/→ 在标签间移动焦点，Home/End 跳到首尾
  const onKeydown = (e: KeyboardEvent) => {
    const el = rootRef.value;
    if (!el) return;
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>('.menu-item'));
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
    notifyHeight();
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => notifyHeight());
      if (rootRef.value) ro.observe(rootRef.value);
    }
    window.addEventListener('resize', notifyHeight);
  });

  onBeforeUnmount(() => {
    ro?.disconnect();
    window.removeEventListener('resize', notifyHeight);
  });
</script>

<template>
  <div ref="rootRef" class="sub-category-menu" role="tablist" @keydown="onKeydown">
    <button
      class="menu-item menu-item--all"
      :class="{ active: selectedId === null }"
      role="tab"
      :aria-selected="selectedId === null"
      @click="emit('select', null)"
    >
      全部
    </button>
    <button
      v-for="sub in subCategories"
      :key="sub.id"
      class="menu-item"
      :class="{ active: selectedId === sub.id }"
      :title="sub.name"
      role="tab"
      :aria-selected="selectedId === sub.id"
      @click="emit('select', sub.id)"
    >
      {{ sub.name }}
    </button>
  </div>
</template>

<style scoped>
  .sub-category-menu {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 0.5rem;
    /* 行间距略大于列间距，换行后各行清晰分隔 */
    row-gap: 0.625rem;
    padding: 0.875rem 0;
    width: 100%;
  }

  .menu-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-size: 0.875rem;
    font-family: inherit;
    font-weight: 500;
  }

  .menu-item:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .menu-item:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .menu-item.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    box-shadow: var(--shadow-glow);
    transform: translateY(-1px);
  }

  .menu-item.active .menu-count {
    color: white;
  }

  /* “全部”汇总项：与二级标签作视觉区分 */
  .menu-item--all {
    background: var(--glass-bg-strong);
    border-style: dashed;
    font-weight: 600;
  }

  .menu-item--all.active {
    background: var(--color-primary);
    border-style: solid;
  }

  @media (max-width: 768px) {
    .sub-category-menu {
      column-gap: 0.375rem;
      row-gap: 0.5rem;
      padding: 0.75rem 0;
    }

    .menu-item {
      padding: 0.5rem 0.875rem;
      font-size: 0.8125rem;
      /* 保证触摸目标高度 ≥ 44px */
      min-height: 44px;
    }
  }
</style>
