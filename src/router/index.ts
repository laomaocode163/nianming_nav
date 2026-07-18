import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    // 路由级懒加载：首屏 entry 仅含 Vue/Pinia/路由壳，
    // HomeView 及其依赖作为后续 chunk 加载
    component: () => import('../views/HomeView.vue'),
  },
];

// 管理后台仅本地开发可见；生产构建中 import.meta.env.DEV 为 false，
// 该动态 import 会被 tree-shake。生产下不保留任何 /admin 字面量，
// 用通配兜底把未知路径（含 /admin）重定向回首页。
if (import.meta.env.DEV) {
  routes.push({
    path: '/admin',
    component: () => import('../views/AdminView.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../components/admin/AdminDashboard.vue'),
        meta: { title: '概览', group: 'overview' },
      },
      {
        path: 'links',
        name: 'admin-links',
        component: () => import('../components/admin/AdminLinksTable.vue'),
        meta: { title: '链接管理', group: 'content' },
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('../components/admin/AdminCategories.vue'),
        meta: { title: '分类管理', group: 'content' },
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: () => import('../components/admin/AdminRoles.vue'),
        meta: { title: '角色与权限', group: 'system' },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('../components/admin/AdminSettings.vue'),
        meta: { title: '设置', group: 'system' },
      },
    ],
  });
} else {
  routes.push({ path: '/:pathMatch(.*)*', redirect: '/' });
}

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
