<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { showToast } from '../../composables/useToast';
  import { categorySchema } from '../../config/schema';
  import type { Category } from '../../types';

  const adminStore = useAdminStore();

  const showForm = ref(false);
  const editingId = ref<string | null>(null);

  const emptyForm = () => ({
    id: '',
    name: '',
    icon: '',
    order: 0,
    hidden: false,
  });

  const form = reactive(emptyForm());

  const openCreate = (): void => {
    Object.assign(form, emptyForm());
    editingId.value = null;
    showForm.value = true;
  };

  const openEdit = (cat: Category): void => {
    Object.assign(form, {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      order: cat.order ?? 0,
      hidden: cat.hidden ?? false,
    });
    editingId.value = cat.id;
    showForm.value = true;
  };

  const closeForm = (): void => {
    showForm.value = false;
  };

  const save = async (): Promise<void> => {
    if (!editingId.value && !form.id.trim()) {
      showToast('请填写分类 ID（英文 slug）');
      return;
    }
    const category: Category = {
      id: form.id.trim(),
      name: form.name.trim(),
      icon: form.icon.trim(),
      order: Number(form.order) || 0,
      hidden: form.hidden,
    };
    const parsed = categorySchema.safeParse(category);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? '校验失败', 2500);
      return;
    }
    try {
      if (editingId.value) {
        await adminStore.updateCategory(editingId.value, category);
        showToast('已更新分类');
      } else {
        await adminStore.createCategory(category);
        showToast('已添加分类');
      }
      showForm.value = false;
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败', 2500);
    }
  };

  const remove = async (cat: Category): Promise<void> => {
    if (!window.confirm(`确定删除分类「${cat.name}」？其下链接需先迁移/删除`)) return;
    try {
      await adminStore.deleteCategory(cat.id);
      showToast('已删除分类');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败', 2500);
    }
  };
</script>

<template>
  <section>
    <div class="toolbar">
      <button class="btn-primary" @click="openCreate">+ 新增分类</button>
    </div>

    <div v-if="adminStore.loading && adminStore.categories.length === 0" class="hint">加载中…</div>
    <div v-else-if="adminStore.categories.length === 0" class="hint">暂无分类</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>图标</th>
          <th>名称</th>
          <th>ID</th>
          <th>排序</th>
          <th>隐藏</th>
          <th>二级分类数</th>
          <th class="col-actions">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cat in adminStore.categories" :key="cat.id">
          <td>{{ cat.icon }}</td>
          <td>{{ cat.name }}</td>
          <td class="mono">{{ cat.id }}</td>
          <td>{{ cat.order ?? 0 }}</td>
          <td>{{ cat.hidden ? '✓' : '' }}</td>
          <td>{{ cat.subCategories?.length ?? 0 }}</td>
          <td class="col-actions">
            <button class="btn-link" @click="openEdit(cat)">编辑</button>
            <button class="btn-link danger" @click="remove(cat)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showForm" class="modal-mask" @click.self="closeForm">
      <div class="modal">
        <h3 class="modal-title">{{ editingId ? '编辑分类' : '新增分类' }}</h3>
        <div class="field">
          <label>分类 ID *（英文 slug）</label>
          <input v-model="form.id" type="text" :disabled="!!editingId" placeholder="如 ai" />
        </div>
        <div class="field">
          <label>名称 *</label>
          <input v-model="form.name" type="text" placeholder="如 人工智能" />
        </div>
        <div class="field">
          <label>图标（emoji）</label>
          <input v-model="form.icon" type="text" placeholder="如 ⚙️" />
        </div>
        <div class="field">
          <label>排序</label>
          <input v-model.number="form.order" type="number" />
        </div>
        <label class="check"><input v-model="form.hidden" type="checkbox" /> 隐藏该分类</label>
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

  .field input {
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

  .check {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
  }
</style>
