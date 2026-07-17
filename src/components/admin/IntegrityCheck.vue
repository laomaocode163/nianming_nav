<script setup lang="ts">
  import { computed } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { findDuplicateUrls, findOrphanLinks } from '../../utils/integrityCheck';
  import { AlertTriangle, Copy, ExternalLink, X } from 'lucide-vue-next';
  import '../../components/admin/admin.css';

  defineProps<{ show: boolean }>();
  const emit = defineEmits<{ close: []; 'goto-links': [] }>();

  const adminStore = useAdminStore();

  const orphans = computed(() => findOrphanLinks(adminStore.categories, adminStore.links));
  const duplicates = computed(() => findDuplicateUrls(adminStore.links));

  const totalIssues = computed(() => orphans.value.length + duplicates.value.length);
</script>

<template>
  <div v-if="show" class="admin-modal-mask" @click.self="emit('close')">
    <div class="admin-modal admin-check-modal">
      <div class="admin-check-head">
        <h3 class="admin-modal-title">
          <AlertTriangle :size="18" :stroke-width="1.5" />
          数据检查
        </h3>
        <button class="admin-link-btn" @click="emit('close')">
          <X :size="16" :stroke-width="1.5" />
        </button>
      </div>

      <p class="admin-check-summary">
        共发现
        <strong :class="{ danger: totalIssues > 0 }">{{ totalIssues }}</strong>
        处问题：孤儿链接 {{ orphans.length }} 条，重复 URL {{ duplicates.length }} 组。
      </p>

      <!-- 孤儿链接 -->
      <section class="admin-check-section">
        <h4 class="admin-check-h">
          <span class="admin-chip danger">孤儿链接 {{ orphans.length }}</span>
        </h4>
        <div v-if="orphans.length === 0" class="admin-check-ok">✓ 未发现引用缺失分类的链接</div>
        <ul v-else class="admin-check-list">
          <li v-for="o in orphans" :key="o.link.id" class="admin-check-item">
            <div class="admin-check-item-main">
              <span class="admin-check-name">{{ o.link.name }}</span>
              <span class="admin-check-reason">{{ o.reason }}</span>
            </div>
            <a
              class="admin-check-link"
              :href="o.link.url"
              target="_blank"
              rel="noopener noreferrer"
              title="打开链接"
            >
              <ExternalLink :size="14" :stroke-width="1.5" />
            </a>
          </li>
        </ul>
      </section>

      <!-- 重复 URL -->
      <section class="admin-check-section">
        <h4 class="admin-check-h">
          <span class="admin-chip">重复 URL {{ duplicates.length }}</span>
        </h4>
        <div v-if="duplicates.length === 0" class="admin-check-ok">✓ 未发现重复 URL</div>
        <ul v-else class="admin-check-list">
          <li v-for="d in duplicates" :key="d.key" class="admin-check-item">
            <div class="admin-check-item-main">
              <span class="admin-check-url">{{ d.key }}</span>
              <span class="admin-check-reason">
                <Copy :size="12" :stroke-width="1.5" />
                {{ d.items.length }} 条：
                <span v-for="(it, i) in d.items" :key="it.id">
                  {{ it.name }}<span v-if="i < d.items.length - 1">、</span>
                </span>
              </span>
            </div>
          </li>
        </ul>
      </section>

      <div class="admin-modal-actions">
        <button class="admin-btn admin-btn-ghost" @click="emit('close')">关闭</button>
        <button class="admin-btn admin-btn-primary" @click="emit('goto-links')">
          前往网址管理
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .admin-check-modal {
    width: min(640px, 94vw);
  }
  .admin-check-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .admin-check-summary {
    margin: 0.5rem 0 1.25rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }
  .admin-check-summary strong {
    color: var(--color-text);
  }
  .admin-check-summary strong.danger {
    color: var(--color-danger);
  }
  .admin-check-section {
    margin-bottom: 1.25rem;
  }
  .admin-check-h {
    margin: 0 0 0.6rem;
    font-size: 0.9375rem;
    font-weight: 700;
  }
  .admin-check-ok {
    padding: 0.75rem 0.9rem;
    border-radius: var(--radius-md);
    background: hsl(150, 60%, 50%, 0.08);
    color: #10b981;
    font-size: 0.8125rem;
  }
  .admin-check-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 240px;
    overflow-y: auto;
  }
  .admin-check-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
  }
  .admin-check-item-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .admin-check-name {
    font-weight: 600;
    font-size: 0.875rem;
  }
  .admin-check-url {
    font-size: 0.8125rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: var(--color-text);
    word-break: break-all;
  }
  .admin-check-reason {
    font-size: 0.75rem;
    color: var(--color-danger);
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .admin-check-link {
    color: var(--color-primary);
    flex-shrink: 0;
  }
</style>
