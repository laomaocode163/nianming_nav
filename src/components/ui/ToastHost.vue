<script setup lang="ts">
  import { toast } from '../../composables/useToast';
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="toast" class="toast-host" role="status" aria-live="polite">
        {{ toast.text }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .toast-host {
    position: fixed;
    left: 50%;
    bottom: 2.5rem;
    transform: translateX(-50%);
    z-index: 1000;
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-lg);
    background: var(--color-text);
    color: var(--color-bg);
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: var(--shadow-lg);
    pointer-events: none;
    white-space: nowrap;
  }

  .toast-fade-enter-active,
  .toast-fade-leave-active {
    transition:
      opacity 200ms ease,
      transform 200ms ease;
  }

  .toast-fade-enter-from,
  .toast-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
</style>
