<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { showToast } from '../../composables/useToast';
  import { searchSourceSchema } from '../../config/schema';
  import type { SearchSource } from '../../types';
  import { Search, Plus, Star } from 'lucide-vue-next';
  import '../../components/admin/admin.css';

  const adminStore = useAdminStore();

  const sources = ref<SearchSource[]>([...adminStore.searchConfig.externalSources]);
  const selectedId = ref(adminStore.searchConfig.selectedSourceId);

  const persist = async (): Promise<void> => {
    try {
      await adminStore.saveSearchConfig({
        selectedSourceId: selectedId.value,
        externalSources: sources.value,
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存失败', 2500);
    }
  };

  const toggleEnabled = async (src: SearchSource): Promise<void> => {
    src.enabled = !src.enabled;
    await persist();
    showToast(src.enabled ? `已启用「${src.name}」` : `已停用「${src.name}」`);
  };

  const setDefault = async (id: string): Promise<void> => {
    if (selectedId.value === id) return;
    selectedId.value = id;
    await persist();
    showToast('已设为默认搜索引擎');
  };

  const remove = async (src: SearchSource): Promise<void> => {
    if (!window.confirm(`确定删除搜索引擎「${src.name}」？`)) return;
    sources.value = sources.value.filter((s) => s.id !== src.id);
    if (selectedId.value === src.id) {
      selectedId.value = sources.value.find((s) => s.enabled)?.id ?? sources.value[0]?.id ?? '';
    }
    await persist();
    showToast('已删除搜索引擎');
  };

  /* ---------- 新增/编辑弹窗 ---------- */
  const modal = ref(false);
  const editingId = ref<string | null>(null);
  const form = reactive({ id: '', name: '', url: '', enabled: true, icon: '' });

  const openCreate = (): void => {
    Object.assign(form, { id: '', name: '', url: '', enabled: true, icon: '' });
    editingId.value = null;
    modal.value = true;
  };

  const openEdit = (src: SearchSource): void => {
    Object.assign(form, {
      id: src.id,
      name: src.name,
      url: src.url,
      enabled: src.enabled,
      icon: src.icon ?? '',
    });
    editingId.value = src.id;
    modal.value = true;
  };

  const saveSource = async (): Promise<void> => {
    const draft: SearchSource = {
      id: form.id.trim(),
      name: form.name.trim(),
      url: form.url.trim(),
      enabled: form.enabled,
      icon: form.icon.trim() || undefined,
    };
    const parsed = searchSourceSchema.safeParse(draft);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? '校验失败', 2500);
      return;
    }
    if (!editingId.value && sources.value.some((s) => s.id === draft.id)) {
      showToast('该 ID 已存在', 2500);
      return;
    }
    if (editingId.value) {
      const idx = sources.value.findIndex((s) => s.id === editingId.value);
      if (idx >= 0) sources.value[idx] = draft;
    } else {
      sources.value.push(draft);
      if (!selectedId.value) selectedId.value = draft.id;
    }
    modal.value = false;
    await persist();
    showToast(editingId.value ? '已更新搜索引擎' : '已添加搜索引擎');
  };

  const sortedSources = computed(() => [...sources.value]);
</script>

<template>
  <section>
    <div class="admin-toolbar">
      <button class="admin-btn admin-btn-primary" @click="openCreate">
        <Plus :size="16" :stroke-width="1.5" /> 新增搜索引擎
      </button>
      <span class="admin-spacer"></span>
      <span class="admin-count">共 {{ sources.length }} 个</span>
    </div>

    <div v-if="sources.length === 0" class="admin-hint">暂无搜索引擎，点击上方新增</div>

    <ul v-else class="admin-tree">
      <li v-for="src in sortedSources" :key="src.id" class="admin-tree-node">
        <div class="admin-tree-row admin-tree-row--source">
          <button
            class="admin-default-btn"
            :class="{ active: selectedId === src.id }"
            :title="selectedId === src.id ? '当前默认' : '设为默认'"
            @click="setDefault(src.id)"
          >
            <Star
              :size="16"
              :stroke-width="1.5"
              :fill="selectedId === src.id ? 'currentColor' : 'none'"
            />
          </button>
          <span class="admin-tree-icon">
            <img v-if="src.icon" :src="src.icon" class="admin-source-icon" alt="" />
            <Search v-else :size="14" :stroke-width="1.5" />
          </span>
          <span class="admin-tree-name">{{ src.name }}</span>
          <span class="admin-tree-url">{{ src.url }}</span>
          <span v-if="!src.enabled" class="admin-chip muted">已停用</span>
          <span v-if="selectedId === src.id" class="admin-chip">默认</span>
          <span class="admin-spacer"></span>
          <label class="admin-check admin-enable">
            <input type="checkbox" :checked="src.enabled" @change="toggleEnabled(src)" /> 启用
          </label>
          <button class="admin-link-btn" @click="openEdit(src)">编辑</button>
          <button class="admin-link-btn danger" @click="remove(src)">删除</button>
        </div>
      </li>
    </ul>

    <div v-if="modal" class="admin-modal-mask" @click.self="modal = false">
      <div class="admin-modal">
        <h3 class="admin-modal-title">
          <Search :size="18" :stroke-width="1.5" />
          {{ editingId ? '编辑搜索引擎' : '新增搜索引擎' }}
        </h3>
        <div class="admin-section">
          <p class="admin-section-title">基本信息</p>
          <div class="admin-field">
            <label class="admin-label">ID *（英文 slug）</label>
            <input
              v-model="form.id"
              class="admin-input"
              type="text"
              :disabled="!!editingId"
              placeholder="如 google"
            />
          </div>
          <div class="admin-field">
            <label class="admin-label">名称 *</label>
            <input v-model="form.name" class="admin-input" type="text" placeholder="如 Google" />
          </div>
          <div class="admin-field">
            <label class="admin-label">搜索 URL *（含查询占位 = ）</label>
            <input
              v-model="form.url"
              class="admin-input"
              type="text"
              placeholder="https://www.google.com/search?q="
            />
          </div>
          <div class="admin-field">
            <label class="admin-label">图标 URL（可选）</label>
            <input
              v-model="form.icon"
              class="admin-input"
              type="text"
              placeholder="https://icon.horse/icon/..."
            />
          </div>
        </div>
        <div class="admin-section">
          <p class="admin-section-title">其他选项</p>
          <label class="admin-check"
            ><input v-model="form.enabled" type="checkbox" /> 启用该引擎</label
          >
        </div>
        <div class="admin-modal-actions">
          <button class="admin-btn admin-btn-ghost" @click="modal = false">取消</button>
          <button class="admin-btn admin-btn-primary" @click="saveSource">保存</button>
        </div>
      </div>
    </div>
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
    cursor: pointer;
    border-radius: 0.4rem;
    transition: color 0.12s ease;
  }
  .admin-default-btn:hover {
    color: var(--color-primary, #0ea5e9);
  }
  .admin-default-btn.active {
    color: #f59e0b;
  }
  .admin-source-icon {
    width: 16px;
    height: 16px;
    border-radius: 3px;
  }
  .admin-enable {
    font-size: 0.8125rem;
    color: var(--color-text-secondary, #6b7280);
  }
  .admin-tree-row--source {
    gap: 0.5rem;
  }
</style>
