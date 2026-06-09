<template>
  <!-- ========== NAVBAR ========== -->
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="navbar-inner container">
      <router-link to="/" class="navbar-logo">
        幕启 <span>· MuQi</span>
      </router-link>

      <div class="navbar-links" :class="{ open: mobileOpen }">
        <a @click="navTo('#features')">功能</a>
        <a @click="navTo('#showcase')">产品</a>
        <a @click="navTo('#pricing')">定价</a>
        <a @click="navTo('#flow')">流程</a>

        <!-- AI 创作入口 -->
        <router-link
          v-if="authStore.isLoggedIn"
          to="/create"
          class="navbar-create-link"
          @click="closeMobile"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          AI 创作
        </router-link>

        <!-- 已登录 -->
        <template v-if="authStore.isLoggedIn">
          <router-link to="/convert" class="navbar-cta" @click="closeMobile">
            免费开始
          </router-link>
          <div class="navbar-user" @click="toggleUserMenu">
            <span class="user-avatar">{{ authStore.nickname.charAt(0) }}</span>
            <span class="user-name">{{ authStore.nickname }}</span>
            <svg class="user-arrow" :class="{ open: userMenuOpen }" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6l4 4 4-4" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="user-dropdown" v-if="userMenuOpen" @click.stop>
            <div class="dropdown-header">
              <span class="dropdown-phone">{{ authStore.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}</span>
            </div>
            <button class="dropdown-item" @click="handleLogout">退出登录</button>
          </div>
        </template>

        <!-- 未登录 -->
        <template v-else>
          <router-link to="/login" class="navbar-login" @click="closeMobile">
            登录
          </router-link>
          <router-link to="/login" class="navbar-cta" @click="closeMobile">
            免费开始
          </router-link>
        </template>
      </div>

      <button class="navbar-hamburger" :class="{ active: mobileOpen }"
              @click="mobileOpen = !mobileOpen" aria-label="菜单">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>

  <!-- Mobile overlay -->
  <div class="mobile-overlay" :class="{ open: mobileOpen }" @click="mobileOpen = false"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isScrolled = ref(false)
const mobileOpen = ref(false)
const userMenuOpen = ref(false)

function onScroll() {
  isScrolled.value = window.scrollY > 20
}

function closeMobile() {
  mobileOpen.value = false
  userMenuOpen.value = false
}

/**
 * 智能导航：如果在首页，直接平滑滚动到锚点；
 * 如果在其他页面，先跳转到首页再滚动。
 */
function navTo(hash) {
  closeMobile()
  if (route.path === '/') {
    const el = document.querySelector(hash)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  } else {
    router.push({ path: '/', hash })
  }
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function handleLogout() {
  authStore.logout()
  userMenuOpen.value = false
  mobileOpen.value = false
  if (route.path === '/convert') {
    router.push('/')
  }
}

// 点击页面其他位置关闭用户菜单
function closeUserMenu(e) {
  if (userMenuOpen.value) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  document.addEventListener('click', closeUserMenu)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', closeUserMenu)
})
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  height: 72px;
  background: rgba(248, 250, 252, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s var(--ease-default);
}
.navbar.scrolled {
  background: rgba(248, 250, 252, 0.97);
  border-bottom-color: var(--color-gray-200);
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.navbar-logo {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-gray-900);
  letter-spacing: -0.02em;
}
.navbar-logo span { color: var(--color-primary-600); }

.navbar-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.navbar-links a {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-gray-600);
  transition: color 0.2s;
  cursor: pointer;
}
.navbar-links a:hover { color: var(--color-primary-600); }

/* AI 创作按钮 */
.navbar-create-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-primary-600, #4f46e5) !important;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-primary-200, #c7d2fe);
  background: var(--color-primary-50, #eef2ff);
  transition: all 0.2s;
}
.navbar-create-link:hover {
  background: var(--color-primary-100, #e0e7ff) !important;
  border-color: var(--color-primary-400, #818cf8) !important;
  transform: translateY(-1px);
}

.navbar-cta {
  display: inline-flex;
  align-items: center;
  padding: 10px 22px;
  background: var(--gradient-primary);
  color: #fff !important;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-primary);
  transition: all 0.2s;
  font-size: 14px;
}
.navbar-cta:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-hover);
}

/* 登录按钮 */
.navbar-login {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-gray-600);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  cursor: pointer;
}
.navbar-login:hover {
  color: var(--color-primary-600);
  background: var(--color-primary-50);
}

/* 用户信息 */
.navbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.navbar-user:hover {
  background: var(--color-gray-100);
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}
.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-gray-700);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-arrow {
  color: var(--color-gray-400);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.user-arrow.open {
  transform: rotate(180deg);
}

/* 用户下拉菜单 */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  overflow: hidden;
  z-index: 200;
}
.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-gray-100);
}
.dropdown-phone {
  font-size: 12px;
  color: var(--color-gray-400);
}
.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--color-gray-600);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  font-family: inherit;
}
.dropdown-item:hover {
  background: var(--color-gray-50);
  color: var(--color-error);
}

.navbar-hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  padding: 6px;
  z-index: 101;
}
.navbar-hamburger span {
  display: block;
  width: 22px; height: 2px;
  background: var(--color-gray-800);
  border-radius: 1px;
  transition: all 0.25s;
}
.navbar-hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.navbar-hamburger.active span:nth-child(2) { opacity: 0; }
.navbar-hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

.mobile-overlay {
  display: none;
}

@media (max-width: 768px) {
  .navbar-links {
    position: fixed;
    top: 0; right: -100%;
    width: 280px; height: 100vh;
    flex-direction: column;
    align-items: flex-start;
    padding: 88px 28px 32px;
    background: rgba(248,250,252,0.99);
    backdrop-filter: blur(16px);
    box-shadow: -4px 0 24px rgba(0,0,0,0.08);
    transition: right 0.3s var(--ease-default);
    z-index: 99;
    gap: 0;
  }
  .navbar-links.open { right: 0; }
  .navbar-links a {
    width: 100%;
    padding: 16px 0;
    font-size: 16px;
    border-bottom: 1px solid var(--color-gray-100);
  }
  .navbar-cta {
    margin-top: 20px;
    width: 100%;
    text-align: center;
    justify-content: center;
    padding: 14px;
    font-size: 15px;
  }
  .navbar-login {
    width: 100%;
    text-align: center;
    margin-top: 8px;
  }
  .navbar-user {
    margin-top: 20px;
    width: 100%;
    justify-content: flex-start;
    padding: 10px 12px;
  }
  .user-dropdown {
    position: relative;
    top: 8px;
    right: auto;
    width: 100%;
  }
  .navbar-hamburger { display: flex; }
  .mobile-overlay.open {
    display: block;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 98;
  }
}
</style>
