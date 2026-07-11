import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    // 路由级懒加载：首屏 entry 仅含 Vue/Pinia/路由壳，
    // HomeView 及其依赖（Element Plus、站点数据）作为后续 chunk 加载
    component: () => import('../views/HomeView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
