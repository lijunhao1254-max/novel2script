/**
 * 用户认证状态管理 Store
 * 管理登录/注册、token 持久化、用户信息
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sendSmsCode, loginWithSms, getUserInfo } from '@/api/auth'

const TOKEN_KEY = 'n2s_token'

export const useAuthStore = defineStore('auth', () => {
  // ---- 状态 ----
  const token = ref(loadToken())
  const user = ref(null)
  const isLoggedIn = ref(false)
  const isLoading = ref(false)
  const isSendingSms = ref(false)
  const smsCountdown = ref(0)

  // ---- 计算属性 ----
  const nickname = computed(() => {
    return user.value?.nickname || '用户'
  })

  const phone = computed(() => {
    return user.value?.phone || ''
  })

  // ---- 持久化 token ----
  function loadToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || ''
    } catch {
      return ''
    }
  }

  function saveToken(t) {
    token.value = t
    try {
      localStorage.setItem(TOKEN_KEY, t)
    } catch { /* ignore */ }
  }

  function clearToken() {
    token.value = ''
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch { /* ignore */ }
  }

  // ---- 发送验证码 ----
  async function sendCode(phoneNumber) {
    isSendingSms.value = true
    try {
      const result = await sendSmsCode(phoneNumber)
      if (result.success) {
        // 启动60秒倒计时
        smsCountdown.value = 60
        const timer = setInterval(() => {
          smsCountdown.value--
          if (smsCountdown.value <= 0) {
            clearInterval(timer)
          }
        }, 1000)
        return { success: true, code: result.code }
      }
      return { success: false, error: result.error }
    } catch (err) {
      return { success: false, error: err.message || '发送失败' }
    } finally {
      isSendingSms.value = false
    }
  }

  // ---- 登录/注册 ----
  async function login(phoneNumber, code) {
    isLoading.value = true
    try {
      const result = await loginWithSms(phoneNumber, code)

      if (result.success) {
        saveToken(result.token)
        user.value = result.user
        isLoggedIn.value = true
        return {
          success: true,
          isNewUser: result.isNewUser
        }
      }

      return {
        success: false,
        error: result.error || '登录失败'
      }
    } catch (err) {
      return {
        success: false,
        error: err.message || '网络错误，请稍后重试'
      }
    } finally {
      isLoading.value = false
    }
  }

  // ---- 恢复登录状态 ----
  async function restoreSession() {
    if (!token.value) return

    isLoading.value = true
    try {
      const result = await getUserInfo(token.value)
      user.value = result.user
      isLoggedIn.value = true
    } catch {
      // token 无效，清除
      clearToken()
      user.value = null
      isLoggedIn.value = false
    } finally {
      isLoading.value = false
    }
  }

  // ---- 退出登录 ----
  function logout() {
    clearToken()
    user.value = null
    isLoggedIn.value = false
  }

  return {
    // 状态
    token,
    user,
    isLoggedIn,
    isLoading,
    isSendingSms,
    smsCountdown,
    // 计算属性
    nickname,
    phone,
    // 方法
    sendCode,
    login,
    restoreSession,
    logout
  }
})
