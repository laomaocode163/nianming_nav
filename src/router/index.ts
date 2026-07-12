import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

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
// 该动态 import 会被 tree-shake，且 /admin 仅做重定向兜底。
if (import.meta.env.DEV) {
  routes.push({
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
  });
} else {
  routes.push({ path: '/admin', redirect: '/' });
}

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
