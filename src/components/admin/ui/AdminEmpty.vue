<script setup lang="ts">
  import type { Component } from 'vue';
  import { Inbox } from 'lucide-vue-next';

  withDefaults(
    defineProps<{
      icon?: Component;
      title?: string;
      description?: string;
    }>(),
    { icon: () => Inbox, title: '暂无数据', description: '' }
  );
</script>

<template>
  <div class="adm-empty">
    <div class="adm-empty__icon">
      <component :is="icon" :size="26" :stroke-width="1.5" />
    </div>
    <p class="adm-empty__title">{{ title }}</p>
    <p v-if="description" class="adm-empty__desc">{{ description }}</p>
    <div v-if="$slots.action" class="adm-empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
  .adm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 3rem 1.5rem;
    text-align: center;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--gradient-subtle);
    color: var(--color-text-secondary);
  }
  .adm-empty__icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: hsl(var(--hue-primary), 80%, 55%, 0.1);
    color: var(--color-primary);
    margin-bottom: 0.25rem;
  }
  .adm-empty__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text);
  }
  .adm-empty__desc {
    margin: 0;
    font-size: 0.8125rem;
    max-width: 28rem;
  }
  .adm-empty__action {
    margin-top: 0.5rem;
  }
</style>
