<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { showToast } from '../../composables/useToast';
  import { linkSchema } from '../../config/schema';
  import type { Link } from '../../types';

  const adminStore = useAdminStore();

  const showForm = ref(false);
  const editingId = ref<string | null>(null);
  const search = ref('');

  const filteredLinks = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return adminStore.links;
    return adminStore.links.filter((l) => {
      const cat = categoryNameOf(l.categoryId).toLowerCase();
      const sub = subNameOf(l.categoryId, l.subCategoryId).toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        cat.includes(q) ||
        sub.includes(q)
      );
    });
  });

  const emptyForm = () => ({
    id: '',
    name: '',
    url: '',
    categoryId: adminStore.categories[0]?.id ?? '',
    subCategoryId: '',
    description: '',
    pinned: false,
    hidden: false,
  });

  const form = reactive(emptyForm());

  const subOptions = computed(() => {
    const cat = adminStore.categories.find((c) => c.id === form.categoryId);
    return cat?.subCategories ?? [];
  });

  const categoryNameOf = (id: string): string =>
    adminStore.categories.find((c) => c.id === id)?.name ?? id;

  const subNameOf = (categoryId: string, subId?: string): string => {
    if (!subId) return '—';
    const cat = adminStore.categories.find((c) => c.id === categoryId);
    return cat?.subCategories?.find((s) => s.id === subId)?.name ?? subId;
  };

  const openCreate = (): void => {
    Object.assign(form, emptyForm());
    editingId.value = null;
    showForm.value = true;
  };

  const openEdit = (link: Link): void => {
    Object.assign(form, {
      id: link.id,
      name: link.name,
      url: link.url,
      categoryId: link.categoryId,
      subCategoryId: link.subCategoryId ?? '',
      description: link.description ?? '',
      pinned: link.pinned ?? false,
      hidden: link.hidden ?? false,
    });
    editingId.value = link.id;
    showForm.value = true;
  };

  const closeForm = (): void => {
    showForm.value = false;
  };

  const onCategoryChange = (): void => {
    form.subCategoryId = '';
  };

  const isValidUrl = (url: string): boolean => /^https?:\/\/.+/i.test(url.trim());

  const save = async (): Promise<void> => {
    if (!editingId.value && !form.id.trim()) {
      showToast('请填写链接 ID（英文 slug）');
      return;
    }
    const link: Link = {
      id: (editingId.value ?? form.id.trim()) as string,
      name: form.name.trim(),
      url: form.url.trim(),
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId || undefined,
      description: form.description.trim() || undefined,
      pinned: form.pinned,
      hidden: form.hidden,
    };
    if (!isValidUrl(link.url)) {
      showToast('请输入合法的 http(s) 链接');
      return;
    }
    const parsed = linkSchema.safeParse(link);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? '校验失败', 2500);
      return;
    }
    try {
      if (editingId.value) {
        await adminStore.updateLink(editingId.value, link);
        showToast('已更新链接');
      } else {
        await adminStore.createLink(link);
        showToast('已添加链接');
      }
      showForm.value = false;
      if (adminStore.autoFetchFavicons) {
        await adminStore.runFetchFavicons(false);
        showToast('已抓取 favicon');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '操作失败', 2500);
    }
  };

  const remove = async (link: Link): Promise<void> => {
    if (!window.confirm(`确定删除「${link.name}」？`)) return;
    try {
      await adminStore.deleteLink(link.id);
      showToast('已删除链接');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败', 2500);
    }
  };

  const manualFetch = async (): Promise<void> => {
    try {
      await adminStore.runFetchFavicons(false);
      showToast('已抓取 favicon');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '抓取失败', 2500);
    }
  };
</script>

<template>
  <section>
    <div class="toolbar">
      <button class="btn-primary" @click="openCreate">+ 新增链接</button>
      <label class="fetch-toggle">
        <input v-model="adminStore.autoFetchFavicons" type="checkbox" />
        保存后自动抓取 favicon
      </label>
      <button class="btn-ghost" @click="manualFetch">抓取全部 favicon</button>
      <input v-model="search" class="search" type="search" placeholder="搜索名称 / URL / 分类…" />
      <span class="count">共 {{ filteredLinks.length }} 条</span>
    </div>

    <div v-if="adminStore.loading && adminStore.links.length === 0" class="hint">加载中…</div>
    <div v-else-if="adminStore.links.length === 0" class="hint">暂无链接</div>
    <div v-else-if="filteredLinks.length === 0" class="hint">无匹配结果</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>URL</th>
          <th>分类</th>
          <th>二级分类</th>
          <th>置顶</th>
          <th>隐藏</th>
          <th class="col-actions">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="link in filteredLinks" :key="link.id">
          <td>{{ link.name }}</td>
          <td class="cell-url">
            <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.url }}</a>
          </td>
          <td>{{ categoryNameOf(link.categoryId) }}</td>
          <td>{{ subNameOf(link.categoryId, link.subCategoryId) }}</td>
          <td>{{ link.pinned ? '✓' : '' }}</td>
          <td>{{ link.hidden ? '✓' : '' }}</td>
          <td class="col-actions">
            <button class="btn-link" @click="openEdit(link)">编辑</button>
            <button class="btn-link danger" @click="remove(link)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 表单弹窗 -->
    <div v-if="showForm" class="modal-mask" @click.self="closeForm">
      <div class="modal">
        <h3 class="modal-title">{{ editingId ? '编辑链接' : '新增链接' }}</h3>
        <div class="field">
          <label>名称 *</label>
          <input v-model="form.name" type="text" placeholder="如 GitHub" />
        </div>
        <div class="field">
          <label>URL *</label>
          <input v-model="form.url" type="text" placeholder="https://..." />
        </div>
        <div class="field-row">
          <div class="field">
            <label>分类 *</label>
            <select v-model="form.categoryId" @change="onCategoryChange">
              <option v-for="c in adminStore.categories" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>二级分类</label>
            <select v-model="form.subCategoryId">
              <option value="">（无）</option>
              <option v-for="s in subOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>描述</label>
          <input v-model="form.description" type="text" placeholder="可选" />
        </div>
        <div class="field-row">
          <label class="check"><input v-model="form.pinned" type="checkbox" /> 置顶</label>
          <label class="check"><input v-model="form.hidden" type="checkbox" /> 隐藏</label>
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
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .fetch-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .search {
    margin-left: auto;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    min-width: 220px;
  }

  .count {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
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

  .cell-url {
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cell-url a {
    color: var(--color-primary);
    text-decoration: none;
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
    flex: 1;
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

  .field-row {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
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
