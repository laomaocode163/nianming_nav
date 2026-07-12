<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useAdminStore } from '../stores/admin';

  const adminStore = useAdminStore();
  const tab = ref<'links' | 'categories' | 'subcategories'>('links');

  const tabs: Array<{ key: typeof tab.value; label: string }> = [
    { key: 'links', label: '网址' },
    { key: 'categories', label: '导航分类' },
    { key: 'subcategories', label: '网址分类' },
  ];

  onMounted(() => {
    adminStore.loadAll();
  });
</script>

<template>
  <div class="admin-view">
    <header class="admin-header">
      <div>
        <h1 class="admin-title">管理后台</h1>
        <p class="admin-sub">本地开发工具 · 改动直接写入 src/config/data/*.json</p>
      </div>
      <RouterLink to="/" class="admin-back">← 返回首页</RouterLink>
    </header>

    <nav class="admin-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="admin-tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </nav>

    <main class="admin-main">
      <AdminLinks v-if="tab === 'links'" />
      <AdminCategories v-else-if="tab === 'categories'" />
      <AdminSubCategories v-else-if="tab === 'subcategories'" />
    </main>
  </div>
</template>

<style scoped>
  .admin-view {
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-text);
    padding: 1.5rem;
  }

  .admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .admin-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
  }

  .admin-sub {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .admin-back {
    font-size: 0.875rem;
    color: var(--color-primary);
    text-decoration: none;
    padding: 0.5rem 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    transition: all 150ms var(--ease-out-expo);
  }

  .admin-back:hover {
    border-color: var(--color-primary);
  }

  .admin-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .admin-tab {
    padding: 0.5rem 1.25rem;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 150ms var(--ease-out-expo);
  }

  .admin-tab.active {
    background: var(--gradient-primary);
    border-color: transparent;
    color: #fff;
  }

  .admin-main {
    max-width: 1100px;
  }
</style>
