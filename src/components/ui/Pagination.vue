<script setup lang="ts">
  import { computed, ref } from 'vue';

  const props = defineProps<{
    currentPage: number;
    pageSize: number;
    total: number;
    /** 导航栏连续展示的页码按钮上限（默认 5）。 */
    maxVisible?: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:currentPage', page: number): void;
    (e: 'change', page: number): void;
  }>();

  const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
  const maxVisible = computed(() => Math.max(1, props.maxVisible ?? 5));

  /**
   * 纯连续滑动窗口：始终展示 `maxVisible` 个连续页码，无省略号、无首尾固定。
   * 窗口以当前页为中心，贴近边界时自动贴边。
   * 例如 maxVisible=5 时：1-5 → 5-10 → 10-15，以此类推。
   */
  const pages = computed<number[]>(() => {
    const count = maxVisible.value;
    const cur = props.currentPage;
    const max = totalPages.value;
    if (max <= count) {
      return Array.from({ length: max }, (_, i) => i + 1);
    }
    const half = Math.floor(count / 2);
    let start = Math.max(1, cur - half);
    const end = Math.min(max, start + count - 1);
    // 贴近右边界时向左对齐
    start = Math.max(1, end - count + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  const go = (page: number): void => {
    const p = Math.min(totalPages.value, Math.max(1, page));
    if (p === props.currentPage) return;
    emit('update:currentPage', p);
    emit('change', p);
  };

  const prev = (): void => go(props.currentPage - 1);
  const next = (): void => go(props.currentPage + 1);

  // 跳转到指定页：输入框 + 跳转按钮，所有页面均可直达，不丢内容
  const jumpValue = ref<number | null>(null);
  const submitJump = (): void => {
    if (jumpValue.value == null || Number.isNaN(jumpValue.value)) return;
    go(Math.floor(jumpValue.value));
    jumpValue.value = null;
  };
</script>

<template>
  <nav v-if="totalPages > 1" class="pager" aria-label="分页导航">
    <button class="pager-btn" aria-label="上一页" :disabled="currentPage <= 1" @click="prev">
      ‹
    </button>
    <button
      v-for="p in pages"
      :key="p"
      class="pager-btn"
      :class="{ active: p === currentPage }"
      :aria-current="p === currentPage ? 'page' : undefined"
      @click="go(p)"
    >
      {{ p }}
    </button>
    <button
      class="pager-btn"
      aria-label="下一页"
      :disabled="currentPage >= totalPages"
      @click="next"
    >
      ›
    </button>

    <!-- 跳转：页面数超过导航栏上限时显示，直达任意页 -->
    <span v-if="totalPages > maxVisible" class="pager-jump">
      <input
        v-model.number="jumpValue"
        class="pager-jump-input"
        type="number"
        :min="1"
        :max="totalPages"
        :aria-label="`跳转到第 1 至 ${totalPages} 页中的某一页`"
        @keyup.enter="submitJump"
      />
      <button class="pager-btn pager-jump-btn" type="button" @click="submitJump">跳转</button>
    </span>
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

  .pager-jump {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-left: 0.25rem;
  }

  .pager-jump-input {
    width: 3.25rem;
    height: 34px;
    padding: 0 0.5rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-text);
    font-size: 0.875rem;
    text-align: center;
    outline: none;
    transition: border-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pager-jump-input:focus {
    border-color: var(--color-primary);
  }

  /* 隐藏 number 输入的上下箭头，保持外观整洁 */
  .pager-jump-input::-webkit-outer-spin-button,
  .pager-jump-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .pager-jump-input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .pager-jump-btn {
    padding: 0 0.75rem;
  }

  @media (max-width: 480px) {
    .pager-btn {
      min-width: 30px;
      height: 30px;
      font-size: 0.8125rem;
    }

    .pager-jump-input {
      width: 2.75rem;
      height: 30px;
      font-size: 0.8125rem;
    }
  }
</style>
