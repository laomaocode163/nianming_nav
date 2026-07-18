<script setup lang="ts">
  import { computed } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { Search, Star } from 'lucide-vue-next';
  import '../../components/admin/admin.css';

  const adminStore = useAdminStore();

  const sources = computed(() => adminStore.searchConfig.externalSources);
  const selectedId = computed(() => adminStore.searchConfig.selectedSourceId);
</script>

<template>
  <section>
    <div class="admin-toolbar">
      <span class="admin-count">共 {{ sources.length }} 个搜索引擎</span>
    </div>

    <div v-if="sources.length === 0" class="admin-hint">暂无搜索引擎</div>

    <ul v-else class="admin-tree">
      <li v-for="src in sources" :key="src.id" class="admin-tree-node">
        <div class="admin-tree-row admin-tree-row--source">
          <span
            class="admin-default-btn"
            :class="{ active: selectedId === src.id }"
            :title="selectedId === src.id ? '当前默认' : ''"
          >
            <Star
              :size="16"
              :stroke-width="1.5"
              :fill="selectedId === src.id ? 'currentColor' : 'none'"
            />
          </span>
          <span class="admin-tree-icon">
            <img v-if="src.icon" :src="src.icon" class="admin-source-icon" alt="" />
            <Search v-else :size="14" :stroke-width="1.5" />
          </span>
          <span class="admin-tree-name">{{ src.name }}</span>
          <span class="admin-tree-url">{{ src.url }}</span>
          <span v-if="!src.enabled" class="admin-chip muted">已停用</span>
          <span v-else class="admin-chip">已启用</span>
          <span v-if="selectedId === src.id" class="admin-chip">默认</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
  .admin-default-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    color: var(--color-text-secondary, #6b7280);
    border-radius: 0.4rem;
  }
  .admin-default-btn.active {
    color: #f59e0b;
  }
  .admin-source-icon {
    width: 16px;
    height: 16px;
    border-radius: 3px;
  }
  .admin-tree-row--source {
    gap: 0.5rem;
  }
</style>
