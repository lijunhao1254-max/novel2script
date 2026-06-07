import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('[Vue Error]', err, info)
  showErrorBanner('页面渲染出错: ' + (err?.message || String(err)))
}

// 警告处理
app.config.warnHandler = (msg, vm, info) => {
  console.warn('[Vue Warn]', msg, info)
}

// 未捕获的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason)
  showErrorBanner('异步错误: ' + (event.reason?.message || String(event.reason)))
})

function showErrorBanner(text) {
  const appDiv = document.getElementById('app')
  if (appDiv && !document.getElementById('vue-error-overlay')) {
    const overlay = document.createElement('div')
    overlay.id = 'vue-error-overlay'
    overlay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#DC2626;color:#fff;padding:16px 20px;font-size:14px;font-family:sans-serif;max-height:200px;overflow:auto;white-space:pre-wrap;'
    overlay.textContent = text
    appDiv.prepend(overlay)
  }
}

// 监控路由跳转
router.beforeEach((to, from, next) => {
  console.log('[Router] Navigating to:', to.path)
  next()
})

router.onError((err) => {
  console.error('[Router Error]', err)
  showErrorBanner('路由错误: ' + err.message)
})

app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 在挂载前恢复登录状态
const authStore = useAuthStore()
authStore.restoreSession()

app.mount('#app')

console.log('[App] Mounted successfully')
