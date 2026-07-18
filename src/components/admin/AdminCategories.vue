<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { showToast } from '../../composables/useToast';
  import { handleAdminError } from '../../composables/useAdminToast';
  import { byOrder } from '@/utils/sort';
  import { categorySchema, subCategorySchema } from '../../config/schema';
  import type { Category, SubCategory } from '../../types';
  import { Plus, FolderPlus, Pencil, Trash2, ChevronRight, Folder, Layers } from 'lucide-vue-next';
  import AdminModal from './ui/AdminModal.vue';
  import AdminBadge from './ui/AdminBadge.vue';
  import AdminEmpty from './ui/AdminEmpty.vue';
  import AdminSkeleton from './ui/AdminSkeleton.vue';

  const adminStore = useAdminStore();

  const search = ref('');
  const expanded = ref<Record<string, boolean>>({});

  const linkCount = (categoryId: string): number =>
    adminStore.links.filter((l) => l.categoryId === categoryId).length;
  const subLinkCount = (categoryId: string, subId: string): number =>
    adminStore.links.filter((l) => l.categoryId === categoryId && l.subCategoryId === subId).length;

  const filteredCats = computed<Category[]>(() => {
    const q = search.value.trim().toLowerCase();
    const cats = [...adminStore.categories].sort(byOrder);
    if (!q) return cats;
    return cats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.subCategories ?? []).some((s) => s.name.toLowerCase().includes(q))
    );
  });

  const toggle = (id: string): void => {
    expanded.value[id] = !expanded.value[id];
  };

  /* ---------- 分类弹窗 ---------- */
  const catModal = ref(false);
  const editingCatId = ref<string | null>(null);
  const catForm = reactive({ id: '', name: '', icon: '', order: 0, hidden: false });

  const openCreateCat = (): void => {
    Object.assign(catForm, {
      id: '',
      name: '',
      icon: '',
      order: adminStore.categories.length,
      hidden: false,
    });
    editingCatId.value = null;
    catModal.value = true;
  };
  const openEditCat = (cat: Category): void => {
    Object.assign(catForm, {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      order: cat.order ?? 0,
      hidden: cat.hidden ?? false,
    });
    editingCatId.value = cat.id;
    catModal.value = true;
  };
  const saveCat = async (): Promise<void> => {
    if (!editingCatId.value && !catForm.id.trim()) {
      showToast('请填写分类 ID（英文 slug）');
      return;
    }
    const category: Category = {
      id: catForm.id.trim(),
      name: catForm.name.trim(),
      icon: catForm.icon.trim(),
      order: Number(catForm.order) || 0,
      hidden: catForm.hidden,
    };
    const parsed = categorySchema.safeParse(category);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? '校验失败', 2500);
      return;
    }
    try {
      if (editingCatId.value) {
        await adminStore.updateCategory(editingCatId.value, category);
        showToast('已更新分类');
      } else {
        await adminStore.createCategory(category);
        showToast('已添加分类');
      }
      catModal.value = false;
    } catch (e) {
      handleAdminError(e);
    }
  };
  const removeCat = async (cat: Category): Promise<void> => {
    if (!window.confirm(`确定删除分类「${cat.name}」？其下链接需先迁移/删除`)) return;
    try {
      await adminStore.deleteCategory(cat.id);
      showToast('已删除分类');
    } catch (e) {
      handleAdminError(e, '删除失败');
    }
  };

  /* ---------- 二级分类弹窗 ---------- */
  const subModal = ref(false);
  const editingSubCatId = ref<string | null>(null);
  const editingSubId = ref<string | null>(null);
  const subForm = reactive({ categoryId: '', id: '', name: '', icon: '', order: 0 });

  const openCreateSub = (categoryId?: string): void => {
    Object.assign(subForm, {
      categoryId: categoryId ?? adminStore.categories[0]?.id ?? '',
      id: '',
      name: '',
      icon: '',
      order: 0,
    });
    editingSubCatId.value = null;
    editingSubId.value = null;
    subModal.value = true;
  };
  const openEditSub = (categoryId: string, sub: SubCategory): void => {
    Object.assign(subForm, {
      categoryId,
      id: sub.id,
      name: sub.name,
      icon: sub.icon ?? '',
      order: sub.order ?? 0,
    });
    editingSubCatId.value = categoryId;
    editingSubId.value = sub.id;
    subModal.value = true;
  };
  const saveSub = async (): Promise<void> => {
    if (!subForm.categoryId) {
      showToast('请选择父分类');
      return;
    }
    const sub: SubCategory = {
      id: subForm.id.trim(),
      name: subForm.name.trim(),
      icon: subForm.icon.trim() || undefined,
      order: Number(subForm.order) || undefined,
    };
    const parsed = subCategorySchema.safeParse(sub);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message ?? '校验失败', 2500);
      return;
    }
    try {
      if (editingSubCatId.value && editingSubId.value) {
        await adminStore.updateSub(editingSubCatId.value, editingSubId.value, sub);
        showToast('已更新二级分类');
      } else {
        await adminStore.createSub(subForm.categoryId, sub);
        showToast('已添加二级分类');
      }
      subModal.value = false;
    } catch (e) {
      handleAdminError(e);
    }
  };
  const removeSub = async (categoryId: string, sub: SubCategory): Promise<void> => {
    if (!window.confirm(`确定删除二级分类「${sub.name}」？其下链接需先迁移/删除`)) return;
    try {
      await adminStore.deleteSub(categoryId, sub.id);
      showToast('已删除二级分类');
    } catch (e) {
      handleAdminError(e, '删除失败');
    }
  };

  const loading = computed(() => adminStore.loading && adminStore.categories.length === 0);
</script>

<template>
  <div class="adm-page">
    <div class="adm-page__head">
      <div>
        <h1 class="adm-page__title">分类管理</h1>
        <p class="adm-page__subtitle">管理一级分类与二级分类，可展开查看子分类与链接分布</p>
      </div>
    </div>

    <div class="adm-toolbar">
      <div class="adm-search" style="min-width: 220px; flex: 0 1 280px">
        <Folder :size="16" :stroke-width="1.6" class="adm-search__icon" />
        <input
          v-model="search"
          type="search"
          class="adm-search__input"
          placeholder="搜索分类 / 子分类…"
        />
      </div>
      <span class="adm-toolbar__spacer"></span>
      <button class="admin-btn" @click="openCreateSub()">
        <FolderPlus :size="16" :stroke-width="1.6" /> 新增子分类
      </button>
      <button class="admin-btn admin-btn-primary" @click="openCreateCat">
        <Plus :size="16" :stroke-width="1.6" /> 新增分类
      </button>
    </div>

    <div v-if="loading" class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>分类</th>
            <th>链接数</th>
            <th>二级分类</th>
            <th>排序</th>
            <th>状态</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 5" :key="i">
            <td><AdminSkeleton width="60%" /></td>
            <td><AdminSkeleton width="40%" /></td>
            <td><AdminSkeleton width="40%" /></td>
            <td><AdminSkeleton width="30%" /></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminEmpty
      v-else-if="filteredCats.length === 0"
      :icon="Folder"
      title="暂无分类"
      description="点击右上角「新增分类」创建第一个分类"
    >
      <template #action>
        <button class="admin-btn admin-btn-primary" @click="openCreateCat">
          <Plus :size="16" :stroke-width="1.6" /> 新增分类
        </button>
      </template>
    </AdminEmpty>

    <div v-else class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th style="width: 44px"></th>
            <th>分类</th>
            <th>链接数</th>
            <th>二级分类</th>
            <th>排序</th>
            <th>状态</th>
            <th style="text-align: right">操作</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="cat in filteredCats" :key="cat.id">
            <tr>
              <td class="adm-check-cell">
                <button
                  class="adm-expand"
                  :class="{ 'is-open': expanded[cat.id] }"
                  :aria-label="expanded[cat.id] ? '收起' : '展开'"
                  @click="toggle(cat.id)"
                >
                  <ChevronRight :size="15" :stroke-width="2" />
                </button>
              </td>
              <td>
                <div class="adm-link-cell">
                  <span class="adm-link-cell__icon"
                    ><CategoryIcon :name="cat.icon" :size="16"
                  /></span>
                  <span class="adm-link-cell__name">{{ cat.name }}</span>
                </div>
              </td>
              <td>{{ linkCount(cat.id) }}</td>
              <td>{{ cat.subCategories?.length ?? 0 }}</td>
              <td class="adm-muted mono">{{ cat.order ?? 0 }}</td>
              <td>
                <AdminBadge v-if="cat.hidden" variant="muted">隐藏</AdminBadge>
                <span v-else class="adm-muted">—</span>
              </td>
              <td>
                <div class="adm-row-actions">
                  <button class="admin-link-btn" @click="openCreateSub(cat.id)">＋子分类</button>
                  <button class="admin-link-btn" @click="openEditCat(cat)">
                    <Pencil :size="14" :stroke-width="1.6" /> 编辑
                  </button>
                  <button class="admin-link-btn danger" @click="removeCat(cat)">
                    <Trash2 :size="14" :stroke-width="1.6" /> 删除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="expanded[cat.id]">
              <td></td>
              <td colspan="6" class="adm-subcell">
                <div v-if="(cat.subCategories ?? []).length === 0" class="adm-subempty">
                  暂无二级分类，<button class="admin-link-btn" @click="openCreateSub(cat.id)">
                    点击添加
                  </button>
                </div>
                <table v-else class="adm-subtable">
                  <tbody>
                    <tr v-for="sub in [...(cat.subCategories ?? [])].sort(byOrder)" :key="sub.id">
                      <td style="width: 36px">
                        <span class="adm-link-cell__icon" style="width: 26px; height: 26px">
                          <Layers :size="13" :stroke-width="1.6" />
                        </span>
                      </td>
                      <td class="adm-link-cell__name">{{ sub.name }}</td>
                      <td class="adm-muted">{{ subLinkCount(cat.id, sub.id) }} 链接</td>
                      <td class="adm-muted mono">{{ sub.order ?? 0 }}</td>
                      <td>
                        <div class="adm-row-actions">
                          <button class="admin-link-btn" @click="openEditSub(cat.id, sub)">
                            <Pencil :size="14" :stroke-width="1.6" /> 编辑
                          </button>
                          <button class="admin-link-btn danger" @click="removeSub(cat.id, sub)">
                            <Trash2 :size="14" :stroke-width="1.6" /> 删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- 分类弹窗 -->
    <AdminModal v-model="catModal" :title="editingCatId ? '编辑分类' : '新增分类'">
      <div class="admin-section">
        <div class="adm-form-row">
          <div class="admin-field">
            <label class="admin-label">ID *（英文 slug）</label>
            <input
              v-model="catForm.id"
              class="admin-input"
              type="text"
              :disabled="!!editingCatId"
              placeholder="如 dev"
            />
          </div>
          <div class="admin-field">
            <label class="admin-label">排序</label>
            <input v-model.number="catForm.order" class="admin-input" type="number" />
          </div>
        </div>
        <div class="adm-form-row">
          <div class="admin-field">
            <label class="admin-label">名称 *</label>
            <input
              v-model="catForm.name"
              class="admin-input"
              type="text"
              placeholder="如 开发工具"
            />
          </div>
          <div class="admin-field">
            <label class="admin-label">图标名</label>
            <input v-model="catForm.icon" class="admin-input" type="text" placeholder="如 code" />
          </div>
        </div>
        <label class="admin-check"
          ><input v-model="catForm.hidden" type="checkbox" /> 隐藏该分类</label
        >
      </div>
      <template #actions>
        <button class="admin-btn admin-btn-ghost" @click="catModal = false">取消</button>
        <button class="admin-btn admin-btn-primary" @click="saveCat">保存</button>
      </template>
    </AdminModal>

    <!-- 子分类弹窗 -->
    <AdminModal v-model="subModal" :title="editingSubId ? '编辑二级分类' : '新增二级分类'">
      <div class="admin-section">
        <div class="admin-field">
          <label class="admin-label">父分类 *</label>
          <select v-model="subForm.categoryId" class="admin-select">
            <option v-for="c in [...adminStore.categories].sort(byOrder)" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div class="adm-form-row">
          <div class="admin-field">
            <label class="admin-label">ID *（英文 slug）</label>
            <input
              v-model="subForm.id"
              class="admin-input"
              type="text"
              :disabled="!!editingSubId"
              placeholder="如 dev-proxy"
            />
          </div>
          <div class="admin-field">
            <label class="admin-label">排序</label>
            <input v-model.number="subForm.order" class="admin-input" type="number" />
          </div>
        </div>
        <div class="adm-form-row">
          <div class="admin-field">
            <label class="admin-label">名称 *</label>
            <input
              v-model="subForm.name"
              class="admin-input"
              type="text"
              placeholder="如 科学上网"
            />
          </div>
          <div class="admin-field">
            <label class="admin-label">图标名</label>
            <input v-model="subForm.icon" class="admin-input" type="text" placeholder="可选" />
          </div>
        </div>
      </div>
      <template #actions>
        <button class="admin-btn admin-btn-ghost" @click="subModal = false">取消</button>
        <button class="admin-btn admin-btn-primary" @click="saveSub">保存</button>
      </template>
    </AdminModal>
  </div>
</template>

<style scoped>
  .adm-expand {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition:
      transform var(--transition-fast),
      color var(--transition-fast),
      background var(--transition-fast);
  }
  .adm-expand:hover {
    color: var(--color-primary);
    background: hsl(var(--hue-primary), 80%, 55%, 0.1);
  }
  .adm-expand.is-open {
    transform: rotate(90deg);
    color: var(--color-primary);
  }
  .adm-subcell {
    background: var(--color-bg);
    padding: 0.5rem 1rem 0.75rem 2.5rem !important;
  }
  .adm-subtable {
    width: 100%;
    border-collapse: collapse;
  }
  .adm-subtable td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px dashed var(--color-border);
    font-size: 0.85rem;
    vertical-align: middle;
  }
  .adm-subtable tr:last-child td {
    border-bottom: none;
  }
  .adm-subempty {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
</style>
