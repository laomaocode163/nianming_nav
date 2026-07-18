<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import {
    useRolesStore,
    PERMISSION_CATALOG,
    ALL_PERMISSIONS,
    type PermissionKey,
    type Role,
  } from '../../stores/roles';
  import { showToast } from '../../composables/useToast';
  import { Plus, Pencil, Trash2, ShieldCheck, ShieldAlert, Check } from 'lucide-vue-next';
  import AdminDrawer from './ui/AdminDrawer.vue';
  import AdminBadge from './ui/AdminBadge.vue';
  import AdminEmpty from './ui/AdminEmpty.vue';
  import AdminSkeleton from './ui/AdminSkeleton.vue';

  const rolesStore = useRolesStore();

  const search = ref('');
  const filtered = computed<Role[]>(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return rolesStore.roles;
    return rolesStore.roles.filter(
      (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  });

  /* ---------- 抽屉表单 ---------- */
  const drawer = ref(false);
  const editingId = ref<string | null>(null);
  const form = reactive({ id: '', name: '', description: '', perms: [] as PermissionKey[] });

  const openCreate = (): void => {
    Object.assign(form, { id: '', name: '', description: '', perms: [] });
    editingId.value = null;
    drawer.value = true;
  };
  const openEdit = (role: Role): void => {
    Object.assign(form, {
      id: role.id,
      name: role.name,
      description: role.description,
      perms: [...role.permissions],
    });
    editingId.value = role.id;
    drawer.value = true;
  };

  const groupAllChecked = (keys: PermissionKey[]): boolean =>
    keys.every((k) => form.perms.includes(k));
  const groupIndeterminate = (keys: PermissionKey[]): boolean =>
    keys.some((k) => form.perms.includes(k)) && !groupAllChecked(keys);
  const toggleGroup = (keys: PermissionKey[]): void => {
    if (groupAllChecked(keys)) {
      form.perms = form.perms.filter((k) => !keys.includes(k));
    } else {
      form.perms = [...new Set([...form.perms, ...keys])];
    }
  };
  const togglePerm = (key: PermissionKey): void => {
    form.perms = form.perms.includes(key)
      ? form.perms.filter((k) => k !== key)
      : [...form.perms, key];
  };

  const save = (): void => {
    if (!form.name.trim()) {
      showToast('请填写角色名称');
      return;
    }
    const role: Role = {
      id: form.id.trim() || `role-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      permissions: [...form.perms],
      builtin: editingId.value ? rolesStore.getById(editingId.value)?.builtin : false,
    };
    try {
      if (editingId.value) {
        rolesStore.updateRole(editingId.value, role);
        showToast('已更新角色');
      } else {
        rolesStore.createRole(role);
        showToast('已添加角色');
      }
      drawer.value = false;
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存失败', 2500);
    }
  };

  const remove = async (role: Role): Promise<void> => {
    if (role.builtin) {
      showToast('内置角色不可删除', 2500);
      return;
    }
    if (!window.confirm(`确定删除角色「${role.name}」？`)) return;
    try {
      rolesStore.deleteRole(role.id);
      showToast('已删除角色');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败', 2500);
    }
  };
</script>

<template>
  <div class="adm-page">
    <div class="adm-page__head">
      <div>
        <h1 class="adm-page__title">角色与权限</h1>
        <p class="adm-page__subtitle">管理后台角色及其权限分配（本地存储，纯前端演示）</p>
      </div>
    </div>

    <div class="adm-toolbar">
      <div class="adm-search" style="min-width: 220px; flex: 0 1 280px">
        <ShieldCheck :size="16" :stroke-width="1.6" class="adm-search__icon" />
        <input v-model="search" type="search" class="adm-search__input" placeholder="搜索角色…" />
      </div>
      <span class="adm-toolbar__spacer"></span>
      <button class="admin-btn admin-btn-primary" @click="openCreate">
        <Plus :size="16" :stroke-width="1.6" /> 新增角色
      </button>
    </div>

    <div v-if="rolesStore.roles.length === 0" class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>角色</th>
            <th>权限</th>
            <th>类型</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 3" :key="i">
            <td><AdminSkeleton width="50%" /></td>
            <td><AdminSkeleton width="30%" /></td>
            <td><AdminSkeleton width="30%" /></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminEmpty
      v-else-if="filtered.length === 0"
      :icon="ShieldAlert"
      title="无匹配角色"
      description="试试调整搜索条件"
    />

    <div v-else class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>角色</th>
            <th>权限覆盖</th>
            <th>类型</th>
            <th style="text-align: right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in filtered" :key="role.id">
            <td>
              <div class="adm-link-cell">
                <span
                  class="adm-link-cell__icon"
                  style="background: var(--gradient-primary); color: #fff"
                >
                  <ShieldCheck :size="15" :stroke-width="1.6" />
                </span>
                <div style="min-width: 0">
                  <span class="adm-link-cell__name">{{ role.name }}</span>
                  <span class="adm-link-cell__url">{{ role.description }}</span>
                </div>
              </div>
            </td>
            <td>
              <AdminBadge
                :variant="
                  role.permissions.length === ALL_PERMISSIONS.length ? 'success' : 'primary'
                "
              >
                {{ role.permissions.length }} / {{ ALL_PERMISSIONS.length }}
              </AdminBadge>
            </td>
            <td>
              <AdminBadge v-if="role.builtin" variant="muted">内置</AdminBadge>
              <AdminBadge v-else variant="warning">自定义</AdminBadge>
            </td>
            <td>
              <div class="adm-row-actions">
                <button class="admin-link-btn" @click="openEdit(role)">
                  <Pencil :size="14" :stroke-width="1.6" /> 编辑
                </button>
                <button
                  class="admin-link-btn danger"
                  :disabled="role.builtin"
                  @click="remove(role)"
                >
                  <Trash2 :size="14" :stroke-width="1.6" /> 删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminDrawer v-model="drawer" :title="editingId ? '编辑角色' : '新增角色'" width="520px">
      <div class="admin-section">
        <div class="adm-form-row">
          <div class="admin-field">
            <label class="admin-label">ID *（英文 slug）</label>
            <input
              v-model="form.id"
              class="admin-input"
              type="text"
              :disabled="!!editingId"
              placeholder="如 editor"
            />
          </div>
          <div class="admin-field">
            <label class="admin-label">名称 *</label>
            <input v-model="form.name" class="admin-input" type="text" placeholder="如 内容编辑" />
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-label">描述</label>
          <input
            v-model="form.description"
            class="admin-input"
            type="text"
            placeholder="角色职责说明"
          />
        </div>
      </div>

      <div class="admin-section">
        <p class="admin-section-title">权限分配</p>
        <div v-for="g in PERMISSION_CATALOG" :key="g.group" class="adm-perm-group">
          <label class="adm-perm-group__head">
            <input
              type="checkbox"
              class="adm-check"
              :checked="groupAllChecked(g.items.map((i) => i.key))"
              :indeterminate="groupIndeterminate(g.items.map((i) => i.key))"
              @change="toggleGroup(g.items.map((i) => i.key))"
            />
            <span class="adm-perm-group__name">{{ g.group }}</span>
            <span class="adm-perm-group__count">
              {{ g.items.filter((i) => form.perms.includes(i.key)).length }} / {{ g.items.length }}
            </span>
          </label>
          <div class="adm-perm-items">
            <label
              v-for="item in g.items"
              :key="item.key"
              class="adm-perm-item"
              :class="{ active: form.perms.includes(item.key) }"
            >
              <input
                type="checkbox"
                class="adm-check"
                :checked="form.perms.includes(item.key)"
                @change="togglePerm(item.key)"
              />
              <span>{{ item.label }}</span>
              <Check
                v-if="form.perms.includes(item.key)"
                :size="14"
                :stroke-width="2.2"
                class="adm-perm-check"
              />
            </label>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="admin-btn admin-btn-ghost" @click="drawer = false">取消</button>
        <button class="admin-btn admin-btn-primary" @click="save">保存角色</button>
      </template>
    </AdminDrawer>
  </div>
</template>

<style scoped>
  .adm-perm-group {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 0.75rem 0.9rem;
    margin-bottom: 0.75rem;
    background: var(--color-bg);
  }
  .adm-perm-group__head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    margin-bottom: 0.6rem;
  }
  .adm-perm-group__count {
    margin-left: auto;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
  .adm-perm-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem 0.75rem;
  }
  .adm-perm-item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.6rem;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    font-size: 0.825rem;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .adm-perm-item:hover {
    border-color: var(--color-border);
    background: var(--color-card);
  }
  .adm-perm-item.active {
    border-color: hsl(var(--hue-primary), 80%, 55%, 0.4);
    background: hsl(var(--hue-primary), 80%, 55%, 0.08);
    color: var(--color-primary);
    font-weight: 600;
  }
  .adm-perm-check {
    margin-left: auto;
    color: var(--color-primary);
  }
  @media (max-width: 520px) {
    .adm-perm-items {
      grid-template-columns: 1fr;
    }
  }
</style>
