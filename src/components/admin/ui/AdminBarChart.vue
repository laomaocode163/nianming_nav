<script setup lang="ts">
  import { computed } from 'vue';

  interface BarItem {
    label: string;
    value: number;
    color?: string;
  }

  const props = defineProps<{ data: BarItem[]; max?: number }>();

  const maxValue = computed(() => props.max ?? Math.max(1, ...props.data.map((d) => d.value)));

  const pct = (v: number): number => Math.round((v / maxValue.value) * 100);
</script>

<template>
  <div class="adm-barchart">
    <div v-for="d in data" :key="d.label" class="adm-bar">
      <span class="adm-bar__value">{{ d.value }}</span>
      <div class="adm-bar__track">
        <div
          class="adm-bar__fill"
          :style="{
            height: pct(d.value) + '%',
            background: d.color ?? 'var(--gradient-primary)',
          }"
        ></div>
      </div>
      <span class="adm-bar__label" :title="d.label">{{ d.label }}</span>
    </div>
  </div>
</template>

<style scoped>
  .adm-barchart {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    height: 220px;
    padding-top: 1.25rem;
  }
  .adm-bar {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    gap: 0.4rem;
  }
  .adm-bar__value {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-secondary);
  }
  .adm-bar__track {
    flex: 1;
    width: 100%;
    max-width: 38px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .adm-bar__fill {
    width: 100%;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    min-height: 4px;
    transition:
      filter var(--transition-fast),
      transform var(--transition-fast);
  }
  .adm-bar:hover .adm-bar__fill {
    filter: brightness(1.08);
    transform: scaleY(1.02);
    transform-origin: bottom;
  }
  .adm-bar__label {
    font-size: 0.72rem;
    color: var(--color-text-secondary);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>
