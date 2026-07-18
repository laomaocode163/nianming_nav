<script setup lang="ts">
  withDefaults(
    defineProps<{
      variant?: 'text' | 'circle' | 'rect';
      width?: string;
      height?: string;
      radius?: string;
    }>(),
    { variant: 'text', width: '100%', height: '0.85rem', radius: 'var(--radius-sm)' }
  );
</script>

<template>
  <span
    class="adm-skeleton"
    :class="`is-${variant}`"
    :style="{ width, height, borderRadius: radius }"
    aria-hidden="true"
  ></span>
</template>

<style scoped>
  .adm-skeleton {
    display: block;
    position: relative;
    overflow: hidden;
    background: var(--color-border);
    opacity: 0.6;
  }
  .is-circle {
    border-radius: 50%;
  }
  .adm-skeleton::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--color-text) 8%, transparent),
      transparent
    );
    animation: adm-shimmer 1.3s infinite;
  }
  @keyframes adm-shimmer {
    100% {
      transform: translateX(100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .adm-skeleton::after {
      animation: none;
    }
  }
</style>
