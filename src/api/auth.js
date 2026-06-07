/**
 * 用户认证 API 封装
 * 支持手机号 + 验证码登录/注册
 */

// ==================== Mock 数据存储 ====================
const mockUsers = new Map()

/**
 * 模拟发送短信验证码
 * @param {string} phone
 * @returns {Promise<{ success: boolean, code?: string }>}
 */
export async function sendSmsCode(phone) {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

  if (useMock) {
    return mockSendSms(phone)
  }
  return realSendSms(phone)
}

/**
 * 手机号验证码登录/注册（自动判断）
 * @param {string} phone
 * @param {string} code
 * @returns {Promise<{ success: boolean, token?: string, user?: object, isNewUser?: boolean, error?: string }>}
 */
export async function loginWithSms(phone, code) {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

  if (useMock) {
    return mockLoginWithSms(phone, code)
  }
  return realLoginWithSms(phone, code)
}

/**
 * 获取当前用户信息
 * @param {string} token
 * @returns {Promise<{ user: object }>}
 */
export async function getUserInfo(token) {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

  if (useMock) {
    return mockGetUserInfo(token)
  }
  return realGetUserInfo(token)
}

// ==================== Mock 实现 ====================

// 存储验证码：phone -> { code, expires }
const smsStore = new Map()

function mockSendSms(phone) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        resolve({ success: false, error: '请输入正确的手机号' })
        return
      }

      // 检查60秒内是否已发送
      const existing = smsStore.get(phone)
      if (existing && Date.now() - existing.time < 60000) {
        const remain = Math.ceil((60000 - (Date.now() - existing.time)) / 1000)
        resolve({ success: false, error: `请${remain}秒后再试` })
        return
      }

      // 生成6位验证码
      const code = String(Math.floor(100000 + Math.random() * 900000))
      smsStore.set(phone, { code, time: Date.now() })

      resolve({ success: true, code })
    }, 800)
  })
}

function mockLoginWithSms(phone, code) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        resolve({ success: false, error: '请输入正确的手机号' })
        return
      }

      // 验证验证码
      const smsRecord = smsStore.get(phone)
      if (!smsRecord) {
        resolve({ success: false, error: '请先获取验证码' })
        return
      }

      // 验证码5分钟过期
      if (Date.now() - smsRecord.time > 300000) {
        smsStore.delete(phone)
        resolve({ success: false, error: '验证码已过期，请重新获取' })
        return
      }

      if (smsRecord.code !== code) {
        resolve({ success: false, error: '验证码错误' })
        return
      }

      // 验证成功，清除验证码记录
      smsStore.delete(phone)

      // 检查是否为新用户
      const existingUser = mockUsers.get(phone)
      const isNewUser = !existingUser

      const user = existingUser || {
        id: 'user_' + Date.now(),
        phone,
        nickname: '用户' + phone.slice(-4),
        avatar: '',
        createdAt: new Date().toISOString()
      }

      // 保存/更新用户
      mockUsers.set(phone, user)

      // 生成简单 token
      const token = 'mock_token_' + btoa(phone + '_' + Date.now())

      resolve({
        success: true,
        token,
        user,
        isNewUser
      })
    }, 1000)
  })
}

function mockGetUserInfo(token) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!token || !token.startsWith('mock_token_')) {
        reject(new Error('无效的登录凭证'))
        return
      }
      // 简单解析
      try {
        const payload = atob(token.replace('mock_token_', ''))
        const phone = payload.split('_')[0]
        const user = mockUsers.get(phone)
        if (user) {
          resolve({ user })
        } else {
          reject(new Error('用户不存在'))
        }
      } catch {
        reject(new Error('无效的登录凭证'))
      }
    }, 300)
  })
}

// ==================== 真实 API 实现（预留） ====================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

async function realSendSms(phone) {
  const res = await fetch(`${API_BASE_URL}/auth/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
  return res.json()
}

async function realLoginWithSms(phone, code) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code })
  })
  return res.json()
}

async function realGetUserInfo(token) {
  const res = await fetch(`${API_BASE_URL}/user/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}
