<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
          <rect width="40" height="40" rx="10" fill="url(#logo-grad)"/>
          <path d="M12 28V12l8 6-8 6v4" fill="#fff"/>
          <path d="M22 16l8 6-8 6" fill="#fff" opacity="0.6"/>
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
              <stop stop-color="#4F46E5"/>
              <stop offset="1" stop-color="#7C3AED"/>
            </linearGradient>
          </defs>
        </svg>
        <span>幕启 · MuQi</span>
      </div>

      <!-- 标题 -->
      <h2 class="login-title">{{ isLoginMode ? '登录 / 注册' : '设置昵称' }}</h2>
      <p class="login-subtitle">
        {{ isLoginMode ? '输入手机号，验证后自动登录或注册' : '欢迎加入，请设置你的昵称' }}
      </p>

      <!-- 手机号 + 验证码登录 -->
      <form v-if="isLoginMode" class="login-form" @submit.prevent="handleLogin">
        <!-- 手机号 -->
        <div class="form-group">
          <label class="form-label">手机号</label>
          <div class="input-wrapper">
            <span class="input-prefix">+86</span>
            <input
              ref="phoneInput"
              v-model="phone"
              type="tel"
              class="form-input"
              placeholder="请输入手机号"
              maxlength="11"
              @input="onPhoneInput"
            />
          </div>
          <p class="form-hint" v-if="phoneError">{{ phoneError }}</p>
        </div>

        <!-- 验证码 -->
        <div class="form-group">
          <label class="form-label">验证码</label>
          <div class="input-wrapper code-row">
            <input
              v-model="smsCode"
              type="text"
              class="form-input code-input"
              placeholder="请输入验证码"
              maxlength="6"
              @input="onCodeInput"
            />
            <button
              type="button"
              class="btn-sms"
              :disabled="!canSendSms || authStore.smsCountdown > 0"
              @click="handleSendSms"
            >
              <template v-if="authStore.smsCountdown > 0">
                {{ authStore.smsCountdown }}s 后重试
              </template>
              <template v-else>
                {{ authStore.isSendingSms ? '发送中…' : '获取验证码' }}
              </template>
            </button>
          </div>
          <p class="form-hint" v-if="codeError">{{ codeError }}</p>
        </div>

        <!-- 验证码弹窗 -->
        <Teleport to="body">
          <div class="sms-toast-overlay" v-if="showSmsToast" @click.self="showSmsToast = false">
            <div class="sms-toast">
              <div class="sms-toast-icon">
                <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="#EEF2FF" stroke="#4F46E5" stroke-width="2"/>
                  <rect x="14" y="16" width="20" height="16" rx="3" fill="#4F46E5"/>
                  <path d="M16 18l8 7 8-7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 class="sms-toast-title">验证码已发送</h3>
              <p class="sms-toast-phone">{{ maskedPhone }}</p>
              <div class="sms-toast-code">{{ showSmsCode }}</div>
              <p class="sms-toast-hint">（Mock 模式，请填写以上验证码）</p>
              <button class="sms-toast-btn" @click="onSmsToastClose">知道了</button>
            </div>
          </div>
        </Teleport>

        <!-- 协议 -->
        <div class="agreement">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
            <rect width="16" height="16" rx="4" :fill="agreed ? '#4F46E5' : '#D1D5DB'"/>
            <path v-if="agreed" d="M4.5 8l2.5 2.5 4.5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span @click="agreed = !agreed">
            我已阅读并同意
            <a href="#" @click.prevent>《用户协议》</a>和<a href="#" @click.prevent>《隐私政策》</a>
          </span>
        </div>

        <!-- 错误提示 -->
        <div class="form-error" v-if="loginError">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 5v3M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ loginError }}
        </div>

        <!-- 提交 -->
        <button
          type="submit"
          class="btn-submit"
          :disabled="!canLogin || authStore.isLoading"
        >
          <span v-if="authStore.isLoading" class="spinner"></span>
          {{ authStore.isLoading ? '验证中…' : '登录 / 注册' }}
        </button>
      </form>

      <!-- 设置昵称 -->
      <form v-else class="login-form" @submit.prevent="handleSetNickname">
        <div class="welcome-msg">
          <div class="welcome-icon">
            <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
              <circle cx="24" cy="24" r="22" fill="#ECFDF5" stroke="#6EE7B7" stroke-width="2"/>
              <path d="M14 24l7 7 13-14" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p>验证成功！{{ newUserPhone }} 注册成功</p>
        </div>

        <div class="form-group">
          <label class="form-label">设置昵称</label>
          <input
            v-model="nickname"
            type="text"
            class="form-input"
            placeholder="给自己起个名字吧"
            maxlength="16"
          />
          <p class="form-hint">{{ nickname.length }}/16 个字符</p>
        </div>

        <button
          type="submit"
          class="btn-submit"
          :disabled="!nickname.trim()"
        >
          开始使用
        </button>

        <button type="button" class="btn-skip" @click="skipNickname">
          跳过，使用默认昵称
        </button>
      </form>

      <!-- 底部 -->
      <div class="login-footer">
        <router-link to="/">← 返回首页</router-link>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="login-bg">
      <div class="bg-blob bg-blob-1"></div>
      <div class="bg-blob bg-blob-2"></div>
      <div class="bg-blob bg-blob-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 登录后跳转目标
const redirectPath = computed(() => route.query.redirect || '/')

const phone = ref('')
const smsCode = ref('')
const agreed = ref(false)
const phoneError = ref('')
const codeError = ref('')
const loginError = ref('')

// 验证码弹窗
const showSmsToast = ref(false)
const showSmsCode = ref('')
const maskedPhone = ref('')

// 昵称设置
const isLoginMode = ref(true)
const newUserPhone = ref('')
const nickname = ref('')
const phoneInput = ref(null)

// 手机号校验
const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(phone.value)
})

// 验证码校验
const isCodeValid = computed(() => {
  return /^\d{6}$/.test(smsCode.value)
})

// 是否可以发送验证码
const canSendSms = computed(() => {
  return isPhoneValid.value && !authStore.isSendingSms && authStore.smsCountdown <= 0
})

// 是否可以登录
const canLogin = computed(() => {
  return isPhoneValid.value && isCodeValid.value && agreed.value && !authStore.isLoading
})

// 输入处理
function onPhoneInput() {
  phone.value = phone.value.replace(/\D/g, '')
  phoneError.value = ''
}

function onCodeInput() {
  smsCode.value = smsCode.value.replace(/\D/g, '')
  codeError.value = ''
}

// 发送验证码
async function handleSendSms() {
  phoneError.value = ''
  loginError.value = ''

  if (!isPhoneValid.value) {
    phoneError.value = '请输入正确的手机号'
    return
  }

  const result = await authStore.sendCode(phone.value)
  if (result.success) {
    // Mock 模式下弹出验证码弹窗
    if (result.code) {
      showSmsCode.value = result.code
      maskedPhone.value = phone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      showSmsToast.value = true
    }
  } else {
    phoneError.value = result.error
  }
}

function onSmsToastClose() {
  showSmsToast.value = false
}

// 登录
async function handleLogin() {
  phoneError.value = ''
  codeError.value = ''
  loginError.value = ''

  if (!isPhoneValid.value) {
    phoneError.value = '请输入正确的手机号'
    return
  }
  if (!isCodeValid.value) {
    codeError.value = '请输入6位验证码'
    return
  }
  if (!agreed.value) {
    loginError.value = '请先阅读并同意用户协议和隐私政策'
    return
  }

  const result = await authStore.login(phone.value, smsCode.value)

  if (result.success) {
    if (result.isNewUser) {
      // 新用户 → 进入昵称设置
      newUserPhone.value = phone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      isLoginMode.value = false
    } else {
      // 老用户 → 跳转到目标页
      router.replace(redirectPath.value)
    }
  } else {
    loginError.value = result.error
  }
}

// 设置昵称后进入
function handleSetNickname() {
  if (nickname.value.trim()) {
    authStore.user.nickname = nickname.value.trim()
  }
  router.replace(redirectPath.value)
}

function skipNickname() {
  router.replace(redirectPath.value)
}

// 自动聚焦
onMounted(() => {
  phoneInput.value?.focus()
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #FDF2F8 100%);
}

/* ===== 背景装饰 ===== */
.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}
.bg-blob-1 {
  width: 400px; height: 400px;
  background: #818CF8;
  top: -100px; right: -100px;
  animation: float1 8s ease-in-out infinite;
}
.bg-blob-2 {
  width: 300px; height: 300px;
  background: #A78BFA;
  bottom: -80px; left: -80px;
  animation: float2 10s ease-in-out infinite;
}
.bg-blob-3 {
  width: 200px; height: 200px;
  background: #F472B6;
  top: 50%; left: 50%;
  animation: float3 12s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 30px) scale(1.1); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -20px) scale(1.15); }
}
@keyframes float3 {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-60%, -40%) scale(1.2); }
}

/* ===== 卡片 ===== */
.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow:
    0 4px 24px rgba(0,0,0,0.06),
    0 1px 4px rgba(0,0,0,0.04);
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}
.login-logo span {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  letter-spacing: -0.02em;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  letter-spacing: -0.03em;
}
.login-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 28px;
  line-height: 1.5;
}

/* ===== 表单 ===== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border: 1.5px solid #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-wrapper:focus-within {
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
  background: #fff;
}

.input-prefix {
  padding: 0 14px;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  border-right: 1px solid #E5E7EB;
  height: 44px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  height: 44px;
  padding: 0 14px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: #111827;
  font-family: inherit;
}
.form-input::placeholder {
  color: #9CA3AF;
}

.code-row {
  padding-right: 6px;
}
.code-input {
  flex: 1;
}

.btn-sms {
  flex-shrink: 0;
  padding: 0 16px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  font-family: inherit;
}
.btn-sms:hover:not(:disabled) {
  background: #E0E7FF;
}
.btn-sms:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-hint {
  font-size: 12px;
  color: #EF4444;
  padding-left: 2px;
}

/* ===== 协议 ===== */
.agreement {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.agreement svg {
  flex-shrink: 0;
  margin-top: 1px;
  cursor: pointer;
}
.agreement span {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
}
.agreement a {
  color: #4F46E5;
  text-decoration: none;
}

/* ===== 错误提示 ===== */
.form-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 10px;
  font-size: 13px;
  color: #DC2626;
}

/* ===== 提交按钮 ===== */
.btn-submit {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  font-family: inherit;
  box-shadow: 0 2px 12px rgba(79,70,229,0.3);
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(79,70,229,0.4);
}
.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ===== 欢迎信息 ===== */
.welcome-msg {
  text-align: center;
  padding: 8px 0 16px;
}
.welcome-icon {
  margin-bottom: 12px;
}
.welcome-msg p {
  font-size: 15px;
  color: #374151;
  font-weight: 500;
}

/* ===== 跳过按钮 ===== */
.btn-skip {
  width: 100%;
  height: 40px;
  border: 1.5px solid #E5E7EB;
  border-radius: 12px;
  background: #fff;
  color: #6B7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.btn-skip:hover {
  border-color: #D1D5DB;
  color: #374151;
  background: #F9FAFB;
}

/* ===== 底部 ===== */
.login-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #F3F4F6;
  text-align: center;
}
.login-footer a {
  font-size: 13px;
  color: #6B7280;
  text-decoration: none;
  transition: color 0.15s;
}
.login-footer a:hover {
  color: #4F46E5;
}

/* ===== 加载动画 ===== */
.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 验证码弹窗 ===== */
.sms-toast-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  animation: overlayIn 0.2s ease;
}

@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sms-toast {
  background: #fff;
  border-radius: 20px;
  padding: 36px 32px 28px;
  text-align: center;
  max-width: 340px;
  width: calc(100% - 48px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.sms-toast-icon {
  margin-bottom: 16px;
}

.sms-toast-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
}

.sms-toast-phone {
  font-size: 14px;
  color: #6B7280;
  margin: 0 0 20px;
}

.sms-toast-code {
  display: inline-block;
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 8px;
  color: #4F46E5;
  background: #EEF2FF;
  border-radius: 12px;
  padding: 12px 24px;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.sms-toast-hint {
  font-size: 12px;
  color: #9CA3AF;
  margin: 0 0 24px;
}

.sms-toast-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.sms-toast-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.35);
}

/* ===== 响应式 ===== */
@media (max-width: 480px) {
  .login-card {
    padding: 28px 20px;
    border-radius: 16px;
  }
  .login-title {
    font-size: 20px;
  }
}
</style>
