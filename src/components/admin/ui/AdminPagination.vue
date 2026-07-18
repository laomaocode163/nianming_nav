<script setup lang="ts">
  import { computed } from 'vue';
  import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

  const props = defineProps<{
    total: number;
    pageSize: number;
    pageSizes?: number[];
  }>();
  const page = defineModel<number>({ required: true });
  const size = defineModel<number>('pageSize', { required: true });

  const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

  const pages = computed<number[]>(() => {
    const count = pageCount.value;
    const cur = page.value;
    const span = 1;
    const set = new Set<number>([1, count, cur]);
    for (let i = cur - span; i <= cur + span; i++) {
      if (i >= 1 && i <= count) set.add(i);
    }
    return [...set].sort((a, b) => a - b);
  });

  const go = (p: number): void => {
    page.value = Math.min(pageCount.value, Math.max(1, p));
  };

  const rangeText = computed(() => {
    if (props.total === 0) return '0';
    const start = (page.value - 1) * props.pageSize + 1;
    const end = Math.min(props.total, page.value * props.pageSize);
    return `${start}–${end}`;
  });
</script>

<template>
  <div class="adm-pager">
    <span class="adm-pager__info">共 {{ total }} 条 · 显示 {{ rangeText }}</span>
    <div class="adm-pager__pages">
      <button class="adm-pager__btn" :disabled="page <= 1" @click="go(page - 1)">
        <ChevronLeft :size="16" :stroke-width="2" />
      </button>
      <template v-for="(p, i) in pages" :key="p">
        <span v-if="i > 0 && pages[i - 1] !== p - 1" class="adm-pager__ellipsis">…</span>
        <button class="adm-pager__btn" :class="{ active: p === page }" @click="go(p)">
          {{ p }}
        </button>
      </template>
      <button class="adm-pager__btn" :disabled="page >= pageCount" @click="go(page + 1)">
        <ChevronRight :size="16" :stroke-width="2" />
      </button>
    </div>
    <select
      v-if="pageSizes"
      class="adm-pager__size"
      :value="size"
      @change="size = Number(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="s in pageSizes" :key="s" :value="s">{{ s }} 条/页</option>
    </select>
  </div>
</template>

<style scoped>
  .adm-pager {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }
  .adm-pager__info {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }
  .adm-pager__pages {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .adm-pager__btn {
    min-width: 34px;
    height: 34px;
    padding: 0 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    color: var(--color-text);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .adm-pager__btn:hover:not(:disabled):not(.active) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .adm-pager__btn.active {
    background: var(--gradient-primary);
    color: #fff;
    border-color: transparent;
    box-shadow: var(--shadow-glow);
  }
  .adm-pager__btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .adm-pager__ellipsis {
    color: var(--color-text-secondary);
    padding: 0 0.15rem;
  }
  .adm-pager__size {
    margin-left: auto;
    height: 34px;
    padding: 0 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    color: var(--color-text);
    font-size: 0.8125rem;
    font-family: inherit;
    cursor: pointer;
  }
</style>
