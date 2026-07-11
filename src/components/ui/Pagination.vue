<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps<{
    currentPage: number;
    pageSize: number;
    total: number;
    pagerCount?: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:currentPage', page: number): void;
    (e: 'change', page: number): void;
  }>();

  const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

  const pages = computed<(number | '...')[]>(() => {
    const count = props.pagerCount ?? 7;
    const cur = props.currentPage;
    const max = totalPages.value;
    if (max <= count) {
      return Array.from({ length: max }, (_, i) => i + 1);
    }
    const half = Math.floor(count / 2);
    let start = Math.max(1, cur - half);
    let end = Math.min(max, start + count - 1);
    start = Math.max(1, end - count + 1);

    const list: (number | '...')[] = [];
    if (start > 1) {
      list.push(1);
      if (start > 2) list.push('...');
    }
    for (let i = start; i <= end; i++) list.push(i);
    if (end < max) {
      if (end < max - 1) list.push('...');
      list.push(max);
    }
    return list;
  });

  const go = (page: number): void => {
    const p = Math.min(totalPages.value, Math.max(1, page));
    if (p === props.currentPage) return;
    emit('update:currentPage', p);
    emit('change', p);
  };

  const prev = (): void => go(props.currentPage - 1);
  const next = (): void => go(props.currentPage + 1);
</script>

<template>
  <nav v-if="totalPages > 1" class="pager" aria-label="分页导航">
    <button class="pager-btn" aria-label="上一页" :disabled="currentPage <= 1" @click="prev">
      ‹
    </button>
    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === '...'" class="pager-ellipsis" aria-hidden="true">…</span>
      <button
        v-else
        class="pager-btn"
        :class="{ active: p === currentPage }"
        :aria-current="p === currentPage ? 'page' : undefined"
        @click="go(p)"
      >
        {{ p }}
      </button>
    </template>
    <button
      class="pager-btn"
      aria-label="下一页"
      :disabled="currentPage >= totalPages"
      @click="next"
    >
      ›
    </button>
  </nav>
</template>

<style scoped>
  .pager {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .pager-btn {
    min-width: 34px;
    height: 34px;
    padding: 0 0.5rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pager-btn:hover:not(:disabled):not(.active) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .pager-btn.active {
    background: var(--gradient-primary);
    border-color: transparent;
    color: #fff;
    font-weight: 600;
    box-shadow: 0 1px 3px hsl(var(--hue-primary), 60%, 50%, 0.25);
  }

  .pager-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pager-ellipsis {
    color: var(--color-text-secondary);
    padding: 0 0.25rem;
    user-select: none;
  }

  @media (max-width: 480px) {
    .pager-btn {
      min-width: 30px;
      height: 30px;
      font-size: 0.8125rem;
    }
  }
</style>
