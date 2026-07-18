<script setup lang="ts">
  import type { Component } from 'vue';
  import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next';

  withDefaults(
    defineProps<{
      icon: Component;
      label: string;
      value: string | number;
      delta?: string;
      trend?: 'up' | 'down' | 'flat';
      accent?: string;
    }>(),
    { delta: '', trend: 'flat', accent: 'var(--color-primary)' }
  );

  const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus };
</script>

<template>
  <div class="adm-stat" :style="{ '--stat-accent': accent }">
    <div class="adm-stat__icon">
      <component :is="icon" :size="22" :stroke-width="1.6" />
    </div>
    <div class="adm-stat__body">
      <p class="adm-stat__label">{{ label }}</p>
      <p class="adm-stat__value">{{ value }}</p>
      <p v-if="delta" class="adm-stat__delta" :class="`is-${trend}`">
        <component :is="trendIcon[trend]" :size="13" :stroke-width="2" />
        {{ delta }}
      </p>
    </div>
  </div>
</template>

<style scoped>
  .adm-stat {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.15rem 1.25rem;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    transition:
      transform var(--transition-fast),
      box-shadow var(--transition-fast),
      border-color var(--transition-fast);
  }
  .adm-stat:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
    border-color: var(--stat-accent);
  }
  .adm-stat__icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg);
    color: var(--stat-accent);
    background: color-mix(in srgb, var(--stat-accent) 14%, transparent);
  }
  .adm-stat__body {
    min-width: 0;
  }
  .adm-stat__label {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }
  .adm-stat__value {
    margin: 0.15rem 0 0;
    font-size: 1.65rem;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .adm-stat__delta {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    margin: 0.3rem 0 0;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .adm-stat__delta.is-up {
    color: var(--color-success);
  }
  .adm-stat__delta.is-down {
    color: var(--color-danger);
  }
  .adm-stat__delta.is-flat {
    color: var(--color-text-secondary);
  }
</style>
