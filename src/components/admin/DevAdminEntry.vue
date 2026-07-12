<script setup lang="ts">
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const openAdmin = (): void => {
    router.push('/admin');
  };
</script>

<template>
  <button
    class="dev-admin-entry"
    title="管理后台（仅开发环境）"
    aria-label="打开管理后台"
    @click="openAdmin"
  >
    ⚙
  </button>
</template>

<style scoped>
  .dev-admin-entry {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 9998;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-text-secondary);
    font-size: 1.125rem;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dev-admin-entry:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    transform: scale(1.05);
  }
</style>
