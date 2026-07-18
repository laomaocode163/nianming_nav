<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { EMOJIS } from '@/config/emojis';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      placeholder?: string;
    }>(),
    { placeholder: '选择图标' }
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();

  const open = ref(false);
  const query = ref('');
  const custom = ref('');

  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return EMOJIS;
    return EMOJIS.filter((e) => e.name.toLowerCase().includes(q));
  });

  watch(
    () => props.modelValue,
    (v) => {
      custom.value = v;
    },
    { immediate: true }
  );

  const toggle = (): void => {
    open.value = !open.value;
    if (open.value) query.value = '';
  };

  const close = (): void => {
    open.value = false;
  };

  const select = (char: string): void => {
    emit('update:modelValue', char);
    custom.value = char;
    close();
  };

  const applyCustom = (): void => {
    const v = custom.value.trim();
    emit('update:modelValue', v);
    if (v) close();
  };
</script>

<template>
  <div class="emoji-picker">
    <button type="button" class="emoji-trigger" :class="{ active: open }" @click="toggle">
      <span v-if="modelValue" class="emoji-current">{{ modelValue }}</span>
      <span v-else class="emoji-placeholder">{{ placeholder }}</span>
    </button>

    <div v-if="open" class="emoji-catcher" @click="close"></div>

    <div v-if="open" class="emoji-popover" role="dialog" aria-label="选择图标">
      <input
        v-model="query"
        class="emoji-search"
        type="search"
        placeholder="搜索图标…"
        autocomplete="off"
      />
      <div class="emoji-grid">
        <button
          v-for="e in filtered"
          :key="e.char"
          type="button"
          class="emoji-cell"
          :title="e.name"
          @click="select(e.char)"
        >
          {{ e.char }}
        </button>
        <p v-if="filtered.length === 0" class="emoji-empty">无匹配，可下方自定义</p>
      </div>
      <div class="emoji-custom">
        <input
          v-model="custom"
          class="emoji-custom-input"
          type="text"
          placeholder="自定义符号，如 </>"
          @keyup.enter="applyCustom"
        />
        <button type="button" class="emoji-custom-btn" @click="applyCustom">使用</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .emoji-picker {
    position: relative;
  }

  .emoji-trigger {
    width: 100%;
    min-height: 40px;
    padding: 0.4rem 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-family: inherit;
    transition:
      border-color 150ms var(--ease-out-expo),
      box-shadow 150ms var(--ease-out-expo);
  }

  .emoji-trigger.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px hsl(var(--hue-primary), 80%, 55%, 0.15);
  }

  .emoji-placeholder {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .emoji-catcher {
    position: fixed;
    inset: 0;
    z-index: 10000;
  }

  .emoji-popover {
    position: absolute;
    top: calc(100% + 0.375rem);
    left: 0;
    z-index: 10001;
    width: min(320px, 90vw);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-float);
    padding: 0.625rem;
    animation: admin-pop 180ms var(--ease-out-expo);
  }

  .emoji-search {
    width: 100%;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    font-family: inherit;
  }

  .emoji-search:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.15rem;
    max-height: 200px;
    overflow-y: auto;
    padding: 0.1rem;
  }

  .emoji-cell {
    aspect-ratio: 1;
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    font-size: 1.15rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 120ms var(--ease-out-expo);
  }

  .emoji-cell:hover {
    background: hsl(var(--hue-primary), 80%, 55%, 0.12);
  }

  .emoji-empty {
    grid-column: 1 / -1;
    text-align: center;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    padding: 0.5rem;
  }

  .emoji-custom {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .emoji-custom-input {
    flex: 1;
    padding: 0.4rem 0.55rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
  }

  .emoji-custom-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .emoji-custom-btn {
    border: none;
    background: var(--gradient-primary);
    color: #fff;
    border-radius: var(--radius-md);
    padding: 0 0.85rem;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
</style>
