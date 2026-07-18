import type { Component } from 'vue';
import { LayoutDashboard, Link2, FolderTree, Settings } from 'lucide-vue-next';

export type AdminGroup = 'overview' | 'content' | 'system';

export const ADMIN_GROUP_LABELS: Record<AdminGroup, string> = {
  overview: '概览',
  content: '内容管理',
  system: '系统',
};

export interface AdminNavItem {
  to: string;
  title: string;
  icon: Component;
  group: AdminGroup;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { to: '/admin/dashboard', title: '数据看板', icon: LayoutDashboard, group: 'overview' },
  { to: '/admin/links', title: '链接管理', icon: Link2, group: 'content' },
  { to: '/admin/categories', title: '分类管理', icon: FolderTree, group: 'content' },
  { to: '/admin/settings', title: '设置', icon: Settings, group: 'system' },
];
