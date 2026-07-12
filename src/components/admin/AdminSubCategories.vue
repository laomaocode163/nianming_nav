<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { showToast } from '../../composables/useToast';
  import { subCategorySchema } from '../../config/schema';
  import type { SubCategory } from '../../types';

  const adminStore = useAdminStore();

  const showForm = ref(false);
  const editingCategoryId = ref<string | null>(null);
  const editingSubId = ref<string | null>(null);

  const emptyForm = () => ({
    categoryId: adminStore.categories[0]?.id ?? '',
    id: '',
    name: '',
    icon: '',
    order: 0,
  });

  const form = reactive(emptyForm());

  const openCreate = (): void => {
    Object.assign(form, emptyForm());
    editingCategoryId.value = null;
    editingSubId.value = null;
    showForm.value = true;
  };

  const openEdit = (view: {
    categoryId: string;
    id: string;
    name: string;
    icon?: string;
    order?: number;
  }): void => {
    Object.assign(form, {
      categoryId: view.categoryId,
      id: view.id,
      name: view.name,
      icon: view.icon ?? '',
      order: view.order ?? 0,
    });
    editingCategoryId.value = view.categoryId;
    editingSubId.value = view.id;
    showForm.value = true;
  };

  const closeForm = (): void => {
    showForm.value = false;
  };

  const save = async (): Promise<void> => {
    if (!form.categoryId) {
      showToast('请选择父分类');
      return;
    }
    const sub: SubCategory = {
      id: form.id.trim(),
      name: form.name.trim(),
      icon: form.icon.trim() || undefined,
      order: Number(form.order) || undefined,
    };
    const parsed = subCategorySchema.safeParse(sub);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? '校验失败', 2500);
      return;
    }
    try {
      if (editingCategoryId.value && editingSubId.value) {
        await adminStore.updateSub(editingCategoryId.value, editingSubId.value, sub);
        showToast('已更新二级分类');
      } else {
        await adminStore.createSub(form.categoryId, sub);
        showToast('已添加二级分类');
      }
      showForm.value = false;
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败', 2500);
    }
  };

  const remove = async (view: { categoryId: string; id: string; name: string }): Promise<void> => {
    if (!window.confirm(`确定删除二级分类「${view.name}」？其下链接需先迁移/删除`)) return;
    try {
      await adminStore.deleteSub(view.categoryId, view.id);
      showToast('已删除二级分类');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败', 2500);
    }
  };
</script>

<template>
  <section>
    <div class="toolbar">
      <button class="btn-primary" @click="openCreate">+ 新增网址分类</button>
    </div>

    <div v-if="adminStore.loading && adminStore.subCategories.length === 0" class="hint">
      加载中…
    </div>
    <div v-else-if="adminStore.subCategories.length === 0" class="hint">暂无网址分类</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>父分类</th>
          <th>名称</th>
          <th>ID</th>
          <th>图标</th>
          <th>排序</th>
          <th class="col-actions">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sub in adminStore.subCategories" :key="`${sub.categoryId}:${sub.id}`">
          <td>{{ sub.categoryName }}</td>
          <td>{{ sub.name }}</td>
          <td class="mono">{{ sub.id }}</td>
          <td>{{ sub.icon }}</td>
          <td>{{ sub.order ?? 0 }}</td>
          <td class="col-actions">
            <button class="btn-link" @click="openEdit(sub)">编辑</button>
            <button class="btn-link danger" @click="remove(sub)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showForm" class="modal-mask" @click.self="closeForm">
      <div class="modal">
        <h3 class="modal-title">{{ editingSubId ? '编辑网址分类' : '新增网址分类' }}</h3>
        <div class="field">
          <label>父分类 *</label>
          <select v-model="form.categoryId">
            <option v-for="c in adminStore.categories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>二级分类 ID *（英文 slug）</label>
          <input
            v-model="form.id"
            type="text"
            :disabled="!!editingSubId"
            placeholder="如 frontend-frameworks"
          />
        </div>
        <div class="field">
          <label>名称 *</label>
          <input v-model="form.name" type="text" placeholder="如 前端框架" />
        </div>
        <div class="field">
          <label>图标（emoji）</label>
          <input v-model="form.icon" type="text" placeholder="如 ⚡" />
        </div>
        <div class="field">
          <label>排序</label>
          <input v-model.number="form.order" type="number" />
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="closeForm">取消</button>
          <button class="btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .toolbar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .hint {
    padding: 2rem;
    text-align: center;
    color: var(--color-text-secondary);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .data-table th,
  .data-table td {
    padding: 0.625rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.875rem;
  }

  .data-table th {
    background: hsl(var(--hue-primary), 12%, 96%);
    color: var(--color-text);
    font-weight: 600;
  }

  .dark .data-table th {
    background: hsl(var(--hue-primary), 20%, 20%);
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .col-actions {
    width: 120px;
    white-space: nowrap;
  }

  .btn-primary {
    background: var(--gradient-primary);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms var(--ease-out-expo);
  }

  .btn-ghost {
    background: var(--color-card);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 150ms var(--ease-out-expo);
  }

  .btn-ghost:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .btn-link {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: 0.8125rem;
    margin-right: 0.5rem;
  }

  .btn-link.danger {
    color: var(--color-danger);
  }

  .modal-mask {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .modal {
    width: min(520px, 92vw);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-lg);
  }

  .modal-title {
    margin: 0 0 1rem;
    font-size: 1.125rem;
  }

  .field {
    margin-bottom: 0.875rem;
  }

  .field label {
    display: block;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.25rem;
  }

  .field input,
  .field select {
    width: 100%;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
  }

  .field input:disabled {
    opacity: 0.6;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
  }
</style>
