<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { useAdminStore } from '../../stores/admin';
  import { showToast } from '../../composables/useToast';
  import { categorySchema, subCategorySchema } from '../../config/schema';
  import type { Category, SubCategory } from '../../types';
  import EmojiPicker from '../ui/EmojiPicker.vue';
  import '../../components/admin/admin.css';

  const adminStore = useAdminStore();

  const expanded = reactive<Record<string, boolean>>({});
  const loading = computed(() => adminStore.loading && adminStore.categories.length === 0);

  const sortedCategories = computed<Category[]>(() =>
    [...adminStore.categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );

  const sortedSubs = (cat: Category): SubCategory[] =>
    [...(cat.subCategories ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const toggleExpand = (id: string): void => {
    expanded[id] = !expanded[id];
  };

  const isExpanded = (id: string): boolean => !!expanded[id];

  /* ---------- 一级分类弹窗 ---------- */
  const catModal = ref(false);
  const editingCatId = ref<string | null>(null);

  const catForm = reactive({
    id: '',
    name: '',
    icon: '',
    order: 0,
    hidden: false,
  });

  const openCreateCat = (): void => {
    Object.assign(catForm, { id: '', name: '', icon: '', order: 0, hidden: false });
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
      showToast(e instanceof Error ? e.message : '操作失败', 2500);
    }
  };

  const removeCat = async (cat: Category): Promise<void> => {
    if (!window.confirm(`确定删除分类「${cat.name}」？其下链接需先迁移/删除`)) return;
    try {
      await adminStore.deleteCategory(cat.id);
      showToast('已删除分类');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败', 2500);
    }
  };

  /* ---------- 二级分类弹窗 ---------- */
  const subModal = ref(false);
  const editingSubCatId = ref<string | null>(null);
  const editingSubId = ref<string | null>(null);

  const subForm = reactive({
    categoryId: '',
    id: '',
    name: '',
    icon: '',
    order: 0,
  });

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
      showToast(e instanceof Error ? e.message : '操作失败', 2500);
    }
  };

  const removeSub = async (categoryId: string, sub: SubCategory): Promise<void> => {
    if (!window.confirm(`确定删除二级分类「${sub.name}」？其下链接需先迁移/删除`)) return;
    try {
      await adminStore.deleteSub(categoryId, sub.id);
      showToast('已删除二级分类');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败', 2500);
    }
  };
</script>

<template>
  <section>
    <div class="admin-toolbar">
      <button class="admin-btn admin-btn-primary" @click="openCreateCat">＋ 新增分类</button>
      <button class="admin-btn" @click="openCreateSub()">＋ 新增子分类</button>
      <span class="admin-spacer"></span>
      <span class="admin-count">共 {{ sortedCategories.length }} 个一级分类</span>
    </div>

    <div v-if="loading" class="admin-hint">加载中…</div>
    <div v-else-if="sortedCategories.length === 0" class="admin-hint">
      暂无分类，点击上方「新增分类」创建
    </div>

    <ul v-else class="admin-tree">
      <li v-for="cat in sortedCategories" :key="cat.id" class="admin-tree-node">
        <div class="admin-tree-row admin-tree-row--cat">
          <button
            class="admin-tree-toggle"
            :class="{ open: isExpanded(cat.id) }"
            :aria-label="isExpanded(cat.id) ? '收起' : '展开'"
            @click="toggleExpand(cat.id)"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="admin-tree-name">{{ cat.name }}</span>
          <span v-if="cat.hidden" class="admin-chip muted">隐藏</span>
          <span class="admin-chip">{{ sortedSubs(cat).length }} 子项</span>
          <span class="admin-spacer"></span>
          <span class="admin-tree-order">#{{ cat.order ?? 0 }}</span>
          <button class="admin-link-btn" @click="openEditCat(cat)">编辑</button>
          <button class="admin-link-btn" @click="openCreateSub(cat.id)">＋子项</button>
          <button class="admin-link-btn danger" @click="removeCat(cat)">删除</button>
        </div>

        <ul v-if="isExpanded(cat.id)" class="admin-tree-children">
          <li v-for="sub in sortedSubs(cat)" :key="sub.id" class="admin-tree-node">
            <div class="admin-tree-row admin-tree-row--sub">
              <span class="admin-tree-name">{{ sub.name }}</span>
              <span class="admin-spacer"></span>
              <span class="admin-tree-order">#{{ sub.order ?? 0 }}</span>
              <button class="admin-link-btn" @click="openEditSub(cat.id, sub)">编辑</button>
              <button class="admin-link-btn danger" @click="removeSub(cat.id, sub)">删除</button>
            </div>
          </li>
          <li v-if="sortedSubs(cat).length === 0" class="admin-tree-empty">暂无子分类</li>
        </ul>
      </li>
    </ul>

    <!-- 一级分类弹窗 -->
    <div v-if="catModal" class="admin-modal-mask" @click.self="catModal = false">
      <div class="admin-modal">
        <h3 class="admin-modal-title">
          <span v-if="catForm.icon" class="admin-modal-icon">{{ catForm.icon }}</span>
          {{ editingCatId ? '编辑分类' : '新增分类' }}
        </h3>
        <div class="admin-field">
          <label class="admin-label">分类 ID *（英文 slug）</label>
          <input
            v-model="catForm.id"
            class="admin-input"
            type="text"
            :disabled="!!editingCatId"
            placeholder="如 ai"
          />
        </div>
        <div class="admin-field">
          <label class="admin-label">名称 *</label>
          <input v-model="catForm.name" class="admin-input" type="text" placeholder="如 人工智能" />
        </div>
        <div class="admin-field">
          <label class="admin-label">图标</label>
          <EmojiPicker v-model="catForm.icon" placeholder="点击选择图标" />
        </div>
        <div class="admin-field-row">
          <div class="admin-field">
            <label class="admin-label">排序</label>
            <input v-model.number="catForm.order" class="admin-input" type="number" />
          </div>
          <label class="admin-check admin-field">
            <input v-model="catForm.hidden" type="checkbox" /> 隐藏该分类
          </label>
        </div>
        <div class="admin-modal-actions">
          <button class="admin-btn admin-btn-ghost" @click="catModal = false">取消</button>
          <button class="admin-btn admin-btn-primary" @click="saveCat">保存</button>
        </div>
      </div>
    </div>

    <!-- 二级分类弹窗 -->
    <div v-if="subModal" class="admin-modal-mask" @click.self="subModal = false">
      <div class="admin-modal">
        <h3 class="admin-modal-title">
          <span v-if="subForm.icon" class="admin-modal-icon">{{ subForm.icon }}</span>
          {{ editingSubId ? '编辑子分类' : '新增子分类' }}
        </h3>
        <div class="admin-field">
          <label class="admin-label">父分类 *</label>
          <select v-model="subForm.categoryId" class="admin-select">
            <option v-for="c in adminStore.categories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div class="admin-field">
          <label class="admin-label">子分类 ID *（英文 slug）</label>
          <input
            v-model="subForm.id"
            class="admin-input"
            type="text"
            :disabled="!!editingSubId"
            placeholder="如 frontend-frameworks"
          />
        </div>
        <div class="admin-field">
          <label class="admin-label">名称 *</label>
          <input v-model="subForm.name" class="admin-input" type="text" placeholder="如 前端框架" />
        </div>
        <div class="admin-field">
          <label class="admin-label">图标</label>
          <EmojiPicker v-model="subForm.icon" placeholder="点击选择图标" />
        </div>
        <div class="admin-field">
          <label class="admin-label">排序</label>
          <input v-model.number="subForm.order" class="admin-input" type="number" />
        </div>
        <div class="admin-modal-actions">
          <button class="admin-btn admin-btn-ghost" @click="subModal = false">取消</button>
          <button class="admin-btn admin-btn-primary" @click="saveSub">保存</button>
        </div>
      </div>
    </div>
  </section>
</template>
