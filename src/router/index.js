import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Convert from '@/views/Convert.vue'
import Login from '@/views/Login.vue'
import ScriptCreate from '@/views/ScriptCreate.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/convert', name: 'Convert', component: Convert, meta: { requiresAuth: true } },
  { path: '/create', name: 'ScriptCreate', component: ScriptCreate, meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: Login, meta: { guest: true } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  }
})

// 路由守卫：未登录时跳转到登录页
router.beforeEach((to, from, next) => {
  // 需要异步检查登录状态，但在 beforeEach 中不能直接使用 store
  // 这里通过 localStorage 快速判断
  const token = localStorage.getItem('n2s_token')

  if (to.meta.requiresAuth && !token) {
    // 需要登录但未登录 → 跳转登录页，带上目标路径
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && token) {
    // 已登录用户访问登录页 → 跳转首页
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
