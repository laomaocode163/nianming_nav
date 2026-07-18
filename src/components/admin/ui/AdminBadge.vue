<script setup lang="ts">
  withDefaults(
    defineProps<{
      variant?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
      dot?: boolean;
    }>(),
    { variant: 'primary', dot: false }
  );
</script>

<template>
  <span class="adm-badge" :class="`is-${variant}`">
    <span v-if="dot" class="adm-badge__dot"></span>
    <slot />
  </span>
</template>

<style scoped>
  .adm-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.18rem 0.55rem;
    border-radius: var(--radius-full);
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1.4;
    white-space: nowrap;
  }
  .adm-badge__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  .is-primary {
    background: hsl(var(--hue-primary), 80%, 55%, 0.14);
    color: var(--color-primary);
  }
  .is-success {
    background: color-mix(in srgb, var(--color-success) 16%, transparent);
    color: var(--color-success);
  }
  .is-warning {
    background: color-mix(in srgb, var(--color-warning) 18%, transparent);
    color: #b45309;
  }
  .is-danger {
    background: color-mix(in srgb, var(--color-danger) 16%, transparent);
    color: var(--color-danger);
  }
  .is-muted {
    background: var(--color-bg);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
</style>
