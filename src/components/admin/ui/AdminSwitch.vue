<script setup lang="ts">
  const model = defineModel<boolean>({ required: true });
</script>

<template>
  <button
    type="button"
    role="switch"
    class="adm-switch"
    :class="{ 'is-on': model }"
    :aria-checked="model"
    @click="model = !model"
  >
    <span class="adm-switch__thumb"></span>
  </button>
</template>

<style scoped>
  .adm-switch {
    position: relative;
    width: 42px;
    height: 24px;
    flex-shrink: 0;
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-border);
    cursor: pointer;
    padding: 0;
    transition: background var(--transition-fast);
  }
  .adm-switch.is-on {
    background: var(--gradient-primary);
  }
  .adm-switch__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-fast);
  }
  .adm-switch.is-on .adm-switch__thumb {
    transform: translateX(18px);
  }
</style>
