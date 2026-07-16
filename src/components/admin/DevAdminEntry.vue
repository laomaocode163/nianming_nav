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
    <svg
      class="admin-gear"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      />
    </svg>
  </button>
</template>

<style scoped>
  .dev-admin-entry {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 9998;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-text-secondary);
    cursor: pointer;
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      all 200ms var(--ease-out-expo),
      box-shadow 300ms var(--ease-out-expo);
  }

  .dev-admin-entry:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    transform: scale(1.08);
    box-shadow: var(--shadow-glow);
  }

  .dev-admin-entry:active {
    transform: scale(0.95);
  }

  .admin-gear {
    transition: transform 500ms var(--ease-in-out-quint);
  }

  .dev-admin-entry:hover .admin-gear {
    transform: rotate(90deg);
  }
</style>
