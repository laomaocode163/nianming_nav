/**
 * 角色与权限本地 store（纯前端，localStorage 持久化）。
 * 管理后台无独立权限后端，此模块用于演示完整的角色 / 权限管理功能，
 * 不写入站点数据文件，仅保存在浏览器本地。
 */
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type PermissionKey =
  | 'links.view'
  | 'links.edit'
  | 'categories.view'
  | 'categories.edit'
  | 'settings.view'
  | 'settings.edit'
  | 'roles.view'
  | 'roles.edit';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
  builtin?: boolean;
}

export interface PermissionItem {
  key: PermissionKey;
  label: string;
}

export interface PermissionGroup {
  group: string;
  items: PermissionItem[];
}

export const PERMISSION_CATALOG: PermissionGroup[] = [
  {
    group: '内容管理',
    items: [
      { key: 'links.view', label: '查看链接' },
      { key: 'links.edit', label: '编辑链接' },
      { key: 'categories.view', label: '查看分类' },
      { key: 'categories.edit', label: '编辑分类' },
    ],
  },
  {
    group: '系统设置',
    items: [
      { key: 'settings.view', label: '查看设置' },
      { key: 'settings.edit', label: '修改设置' },
    ],
  },
  {
    group: '权限管理',
    items: [
      { key: 'roles.view', label: '查看角色' },
      { key: 'roles.edit', label: '管理角色' },
    ],
  },
];

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_CATALOG.flatMap((g) =>
  g.items.map((i) => i.key)
);

const STORAGE_KEY = 'nianming-admin-roles';

const SEED: Role[] = [
  {
    id: 'super',
    name: '超级管理员',
    description: '拥有全部权限，可管理所有模块',
    permissions: [...ALL_PERMISSIONS],
    builtin: true,
  },
  {
    id: 'editor',
    name: '内容编辑',
    description: '可维护链接与分类，但不能修改系统设置',
    permissions: ['links.view', 'links.edit', 'categories.view', 'categories.edit', 'roles.view'],
  },
  {
    id: 'guest',
    name: '访客',
    description: '仅可查看内容，无编辑权限',
    permissions: ['links.view', 'categories.view'],
  },
];

const load = (): Role[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Role[];
  } catch {
    /* ignore */
  }
  return JSON.parse(JSON.stringify(SEED)) as Role[];
};

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>(load());

  watch(
    roles,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      } catch {
        /* ignore quota */
      }
    },
    { deep: true }
  );

  const getById = (id: string): Role | undefined => roles.value.find((r) => r.id === id);

  const createRole = (role: Role): void => {
    if (roles.value.some((r) => r.id === role.id)) {
      throw new Error(`角色 ID「${role.id}」已存在`);
    }
    roles.value.push(role);
  };

  const updateRole = (id: string, role: Role): void => {
    const idx = roles.value.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error('角色不存在');
    roles.value[idx] = role;
  };

  const deleteRole = (id: string): void => {
    const role = roles.value.find((r) => r.id === id);
    if (!role) throw new Error('角色不存在');
    if (role.builtin) throw new Error('内置角色不可删除');
    roles.value = roles.value.filter((r) => r.id !== id);
  };

  return { roles, getById, createRole, updateRole, deleteRole };
});
