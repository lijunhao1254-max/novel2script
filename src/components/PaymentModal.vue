<template>
  <Teleport to="body">
    <div v-if="visible" class="pay-overlay" @click.self="handleClose">
      <div class="pay-modal" :class="{ 'state-success': payState === 'success', 'state-fail': payState === 'fail' }">

        <!-- 关闭按钮 -->
        <button class="pay-close" @click="handleClose">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- ===== 步骤1：确认套餐 ===== -->
        <template v-if="payState === 'confirm'">
          <div class="pay-header">
            <div class="pay-header-icon">🎯</div>
            <h2 class="pay-title">确认订阅套餐</h2>
          </div>

          <!-- 套餐摘要 -->
          <div class="plan-summary">
            <div class="plan-summary-name">
              <span class="plan-badge" :class="planBadgeClass">{{ planName }}</span>
              <span class="plan-cycle">{{ billingLabel }}</span>
            </div>
            <div class="plan-summary-price">
              <span class="plan-price-currency">¥</span>
              <span class="plan-price-amount">{{ planPrice }}</span>
              <span class="plan-price-period">{{ billingPeriod }}</span>
            </div>
            <div class="plan-save-tag" v-if="isYearly && planName !== '免费版'">
              🎉 年付节省 ¥{{ yearlySaving }}
            </div>
            <ul class="plan-summary-features">
              <li v-for="f in planFeatures" :key="f">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                {{ f }}
              </li>
            </ul>
          </div>

          <!-- 月付/年付切换 -->
          <div class="cycle-toggle" v-if="planName !== '免费版'">
            <span>计费周期：</span>
            <div class="cycle-btns">
              <button :class="{ active: !localYearly }" @click="localYearly = false">月付</button>
              <button :class="{ active: localYearly }" @click="localYearly = true">
                年付
                <span class="save-badge">省20%</span>
              </button>
            </div>
          </div>

          <button class="btn-pay-confirm" @click="goToPayMethod">
            去支付 ¥{{ planPrice }}
          </button>
          <p class="pay-note">下单后可在账户中管理订阅，随时取消续费</p>
        </template>

        <!-- ===== 步骤2：选择支付方式 ===== -->
        <template v-if="payState === 'method'">
          <div class="pay-header">
            <button class="pay-back" @click="payState = 'confirm'">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h2 class="pay-title">选择支付方式</h2>
          </div>

          <div class="pay-amount-display">
            <span class="pay-amount-label">应付金额</span>
            <span class="pay-amount-value">¥{{ planPrice }}</span>
          </div>

          <div class="pay-methods">
            <button
              class="pay-method-btn"
              :class="{ active: payMethod === 'wechat' }"
              @click="payMethod = 'wechat'"
            >
              <div class="pay-method-icon wechat-icon">
                <svg viewBox="0 0 48 48" width="28" height="28"><path fill="#07C160" d="M19.2 32.6c-.7 0-1.2-.1-1.8-.4l-4.5 2.3 1.2-4c-3.2-2.1-5.1-5.2-5.1-8.6 0-6.6 6.1-11.9 13.6-11.9s13.6 5.3 13.6 11.9c0 6.6-6.1 11.9-13.6 11.9zM13.2 23.7c.9 0 1.6-.7 1.6-1.6s-.7-1.6-1.6-1.6-1.6.7-1.6 1.6.7 1.6 1.6 1.6zm6.3 0c.9 0 1.6-.7 1.6-1.6s-.7-1.6-1.6-1.6-1.6.7-1.6 1.6.7 1.6 1.6 1.6z"/><path fill="#07C160" d="M33.6 38.4c.5.2 1 .3 1.5.3 6.2 0 11.2-4.5 11.2-10.1s-5-10.1-11.2-10.1-11.2 4.5-11.2 10.1c0 2.8 1.2 5.3 3.2 7.1l-.9 3.3 3.7-1.8c1 .4 2.4.7 3.7.7zm-3.7-11.6c-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3 1.3.6 1.3 1.3-.6 1.3-1.3 1.3zm5.1 0c-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3 1.3.6 1.3 1.3-.6 1.3-1.3 1.3z"/></svg>
              </div>
              <div class="pay-method-info">
                <span class="pay-method-name">微信支付</span>
                <span class="pay-method-desc">微信扫码，安全快速</span>
              </div>
              <div class="pay-method-check" v-if="payMethod === 'wechat'">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </button>

            <button
              class="pay-method-btn"
              :class="{ active: payMethod === 'alipay' }"
              @click="payMethod = 'alipay'"
            >
              <div class="pay-method-icon alipay-icon">
                <svg viewBox="0 0 48 48" width="28" height="28"><circle cx="24" cy="24" r="22" fill="#1677FF"/><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold" font-family="PingFang SC, sans-serif">支</text></svg>
              </div>
              <div class="pay-method-info">
                <span class="pay-method-name">支付宝</span>
                <span class="pay-method-desc">支付宝扫码，即刻到账</span>
              </div>
              <div class="pay-method-check" v-if="payMethod === 'alipay'">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </button>
          </div>

          <button class="btn-pay-confirm" :disabled="!payMethod" @click="goToQrCode">
            确认支付
          </button>
          <p class="pay-note">支付完成后系统自动升级，无需手动确认</p>
        </template>

        <!-- ===== 步骤3：扫码支付 ===== -->
        <template v-if="payState === 'qrcode'">
          <div class="pay-header">
            <button class="pay-back" @click="payState = 'method'">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h2 class="pay-title">扫码完成支付</h2>
          </div>

          <div class="qr-wrap">
            <div class="qr-method-label" :class="payMethod">
              <template v-if="payMethod === 'wechat'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#07C160"><circle cx="12" cy="12" r="10"/></svg>
                微信支付
              </template>
              <template v-else>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#1677FF"><circle cx="12" cy="12" r="10"/></svg>
                支付宝
              </template>
            </div>

            <!-- 二维码区域（模拟） -->
            <div class="qr-code-area">
              <div class="qr-code-mock">
                <svg viewBox="0 0 100 100" width="140" height="140">
                  <!-- 模拟二维码图案 -->
                  <rect width="100" height="100" fill="#fff"/>
                  <rect x="5" y="5" width="30" height="30" fill="none" stroke="#000" stroke-width="3"/>
                  <rect x="10" y="10" width="20" height="20" fill="#000"/>
                  <rect x="65" y="5" width="30" height="30" fill="none" stroke="#000" stroke-width="3"/>
                  <rect x="70" y="10" width="20" height="20" fill="#000"/>
                  <rect x="5" y="65" width="30" height="30" fill="none" stroke="#000" stroke-width="3"/>
                  <rect x="10" y="70" width="20" height="20" fill="#000"/>
                  <rect x="42" y="5" width="6" height="6" fill="#000"/>
                  <rect x="50" y="5" width="6" height="6" fill="#000"/>
                  <rect x="42" y="13" width="6" height="6" fill="#000"/>
                  <rect x="42" y="42" width="6" height="6" fill="#000"/>
                  <rect x="50" y="42" width="6" height="6" fill="#000"/>
                  <rect x="58" y="42" width="6" height="6" fill="#000"/>
                  <rect x="42" y="50" width="6" height="6" fill="#000"/>
                  <rect x="58" y="50" width="6" height="6" fill="#000"/>
                  <rect x="42" y="58" width="6" height="6" fill="#000"/>
                  <rect x="50" y="58" width="6" height="6" fill="#000"/>
                  <rect x="65" y="42" width="6" height="6" fill="#000"/>
                  <rect x="73" y="42" width="6" height="6" fill="#000"/>
                  <rect x="65" y="50" width="6" height="6" fill="#000"/>
                  <rect x="73" y="58" width="6" height="6" fill="#000"/>
                  <rect x="81" y="42" width="12" height="12" fill="#000"/>
                  <rect x="65" y="65" width="12" height="12" fill="#000"/>
                  <rect x="81" y="65" width="6" height="6" fill="#000"/>
                  <rect x="81" y="73" width="12" height="12" fill="#000"/>
                  <rect x="65" y="81" width="20" height="12" fill="#000"/>
                  <!-- Novel2Script 标识 -->
                  <text x="50" y="96" text-anchor="middle" font-size="6" fill="#666" font-family="monospace">Novel2Script</text>
                </svg>
              </div>
              <div class="qr-expire">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                二维码有效期：{{ countdown }}秒
              </div>
            </div>

            <div class="qr-amount">
              <span class="qr-amount-label">{{ planName }} · {{ billingLabel }}</span>
              <span class="qr-amount-value">¥{{ planPrice }}</span>
            </div>

            <div class="qr-hint">
              <p>请使用{{ payMethod === 'wechat' ? '微信' : '支付宝' }}扫描上方二维码完成支付</p>
            </div>

            <!-- 模拟支付成功按钮（开发测试用） -->
            <button class="btn-simulate-pay" @click="simulatePaySuccess">
              模拟支付成功（测试）
            </button>
          </div>
        </template>

        <!-- ===== 步骤4：支付成功 ===== -->
        <template v-if="payState === 'success'">
          <div class="pay-result-wrap">
            <div class="pay-result-icon success">
              <svg viewBox="0 0 60 60" width="64" height="64">
                <circle cx="30" cy="30" r="28" fill="#10b981" opacity="0.12"/>
                <circle cx="30" cy="30" r="22" fill="#10b981"/>
                <polyline points="20 30 27 37 40 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2 class="pay-result-title">支付成功 🎉</h2>
            <p class="pay-result-desc">{{ planName }}已激活，感谢您的订阅！</p>
            <div class="pay-result-info">
              <div class="pay-result-row">
                <span>套餐</span>
                <strong>{{ planName }}</strong>
              </div>
              <div class="pay-result-row">
                <span>金额</span>
                <strong>¥{{ planPrice }}</strong>
              </div>
              <div class="pay-result-row">
                <span>订单号</span>
                <span class="order-no">{{ orderNo }}</span>
              </div>
            </div>
            <div class="pay-result-actions">
              <button class="btn-primary" @click="goConvert">立即使用</button>
              <button class="btn-secondary" @click="handleClose">关闭</button>
            </div>
          </div>
        </template>

        <!-- ===== 步骤5：支付失败 ===== -->
        <template v-if="payState === 'fail'">
          <div class="pay-result-wrap">
            <div class="pay-result-icon fail">
              <svg viewBox="0 0 60 60" width="64" height="64">
                <circle cx="30" cy="30" r="28" fill="#ef4444" opacity="0.12"/>
                <circle cx="30" cy="30" r="22" fill="#ef4444"/>
                <line x1="21" y1="21" x2="39" y2="39" stroke="white" stroke-width="3" stroke-linecap="round"/>
                <line x1="39" y1="21" x2="21" y2="39" stroke="white" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </div>
            <h2 class="pay-result-title">支付未完成</h2>
            <p class="pay-result-desc">请检查网络或重新扫码支付</p>
            <div class="pay-result-actions">
              <button class="btn-primary" @click="payState = 'qrcode'">重新支付</button>
              <button class="btn-secondary" @click="handleClose">取消</button>
            </div>
          </div>
        </template>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  visible: { type: Boolean, default: false },
  plan: { type: Object, default: null },
  yearly: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'success'])

const router = useRouter()
const payState = ref('confirm')  // confirm | method | qrcode | success | fail
const payMethod = ref('')
const countdown = ref(300)
const localYearly = ref(props.yearly)
const orderNo = ref('')

let countdownTimer = null

// ===== 计算属性 =====
const planName = computed(() => props.plan?.name || '专业版')

const planBadgeClass = computed(() => {
  const name = planName.value
  if (name.includes('专业')) return 'badge-pro'
  if (name.includes('基础')) return 'badge-basic'
  if (name.includes('按需')) return 'badge-paygo'
  return 'badge-free'
})

const planFeatures = computed(() => {
  return props.plan?.features?.slice(0, 4) || []
})

const billingLabel = computed(() => localYearly.value ? '年付' : '月付')
const billingPeriod = computed(() => localYearly.value ? '/年' : '/月')

const planPrice = computed(() => {
  if (!props.plan) return '0'
  const base = localYearly.value
    ? props.plan.yearlyPrice
    : props.plan.price
  return base || '0'
})

const yearlySaving = computed(() => {
  if (!props.plan || !props.plan.price || !props.plan.yearlyPrice) return 0
  const monthly = parseFloat(props.plan.price) || 0
  const yearlyMonthly = parseFloat(props.plan.yearlyPrice) || 0
  return Math.round((monthly - yearlyMonthly) * 12)
})

// ===== 步骤跳转 =====
function goToPayMethod() {
  payState.value = 'method'
}

function goToQrCode() {
  if (!payMethod.value) return
  payState.value = 'qrcode'
  startCountdown()
}

function startCountdown() {
  countdown.value = 300
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      payState.value = 'fail'
    }
  }, 1000)
}

function simulatePaySuccess() {
  clearInterval(countdownTimer)
  orderNo.value = 'N2S' + Date.now()
  payState.value = 'success'
  emit('success', { plan: planName.value, orderNo: orderNo.value })
}

function goConvert() {
  handleClose()
  router.push('/convert')
}

function handleClose() {
  clearInterval(countdownTimer)
  emit('close')
  // 延迟重置状态
  setTimeout(() => {
    payState.value = 'confirm'
    payMethod.value = ''
    countdown.value = 300
  }, 300)
}

// 监听 visible，每次打开时重置状态
watch(() => props.visible, (v) => {
  if (v) {
    payState.value = 'confirm'
    payMethod.value = ''
    localYearly.value = props.yearly
  }
})

watch(() => props.yearly, (v) => {
  localYearly.value = v
})

onUnmounted(() => {
  clearInterval(countdownTimer)
})
</script>

<style scoped>
/* ===== Overlay ===== */
.pay-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: overlayIn 0.2s ease;
}
@keyframes overlayIn { from { opacity: 0 } to { opacity: 1 } }

/* ===== Modal ===== */
.pay-modal {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.18);
  padding: 32px 32px 28px;
  animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 90vh;
  overflow-y: auto;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px) }
  to { opacity: 1; transform: scale(1) translateY(0) }
}

.pay-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 32px; height: 32px;
  border: none;
  background: var(--color-gray-100, #f3f4f6);
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-gray-500, #6b7280);
  transition: all 0.15s;
}
.pay-close:hover { background: var(--color-gray-200, #e5e7eb); color: #000; }

.pay-back {
  background: none; border: none;
  padding: 4px; cursor: pointer;
  color: var(--color-gray-500, #6b7280);
  display: flex; align-items: center;
  border-radius: 6px;
  transition: background 0.15s;
}
.pay-back:hover { background: var(--color-gray-100, #f3f4f6); }

/* ===== Header ===== */
.pay-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}
.pay-header-icon {
  font-size: 24px;
  line-height: 1;
}
.pay-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-gray-900, #111827);
  margin: 0;
}

/* ===== Plan Summary ===== */
.plan-summary {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 20px;
}
.plan-summary-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.plan-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
}
.plan-badge.badge-pro { background: linear-gradient(90deg, #6366f1, #8b5cf6); color: #fff; }
.plan-badge.badge-basic { background: linear-gradient(90deg, #0ea5e9, #38bdf8); color: #fff; }
.plan-badge.badge-paygo { background: linear-gradient(90deg, #f59e0b, #fbbf24); color: #fff; }
.plan-badge.badge-free { background: var(--color-gray-200, #e5e7eb); color: var(--color-gray-600, #4b5563); }

.plan-cycle {
  font-size: 12px;
  color: var(--color-gray-500, #6b7280);
  background: rgba(255,255,255,0.7);
  padding: 2px 8px;
  border-radius: 6px;
}

.plan-summary-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 6px;
}
.plan-price-currency { font-size: 16px; font-weight: 600; color: var(--color-gray-900, #111); }
.plan-price-amount { font-size: 36px; font-weight: 800; color: var(--color-gray-900, #111); line-height: 1; }
.plan-price-period { font-size: 13px; color: var(--color-gray-500, #6b7280); }

.plan-save-tag {
  font-size: 12px;
  color: #059669;
  background: #d1fae5;
  padding: 3px 10px;
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 10px;
}

.plan-summary-features {
  list-style: none;
  padding: 0; margin: 8px 0 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.plan-summary-features li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-gray-600, #4b5563);
}

/* ===== Cycle Toggle ===== */
.cycle-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--color-gray-600, #4b5563);
  margin-bottom: 20px;
}
.cycle-btns {
  display: flex;
  gap: 6px;
}
.cycle-btns button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 16px;
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  color: var(--color-gray-600, #4b5563);
}
.cycle-btns button.active {
  background: var(--color-primary-600, #4f46e5);
  color: #fff;
  border-color: var(--color-primary-600, #4f46e5);
}
.save-badge {
  font-size: 10px;
  background: rgba(255,255,255,0.25);
  padding: 1px 5px;
  border-radius: 4px;
}

/* ===== Pay Confirm Button ===== */
.btn-pay-confirm {
  width: 100%;
  padding: 14px;
  background: var(--gradient-primary, linear-gradient(135deg, #4f46e5, #7c3aed));
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-pay-confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(79,70,229,0.3); }
.btn-pay-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

.pay-note {
  text-align: center;
  font-size: 12px;
  color: var(--color-gray-400, #9ca3af);
  margin: 10px 0 0;
}

/* ===== Amount Display ===== */
.pay-amount-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-gray-50, #f9fafb);
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
}
.pay-amount-label { font-size: 13px; color: var(--color-gray-500, #6b7280); }
.pay-amount-value { font-size: 22px; font-weight: 800; color: var(--color-gray-900, #111); }

/* ===== Pay Methods ===== */
.pay-methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.pay-method-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1.5px solid var(--color-gray-200, #e5e7eb);
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-family: inherit;
  width: 100%;
}
.pay-method-btn:hover { border-color: var(--color-primary-300, #a5b4fc); background: var(--color-primary-50, #eef2ff); }
.pay-method-btn.active { border-color: var(--color-primary-600, #4f46e5); background: var(--color-primary-50, #eef2ff); }

.pay-method-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.wechat-icon { background: #e7f9ee; }
.alipay-icon { background: #eff6ff; }

.pay-method-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pay-method-name { font-size: 14px; font-weight: 600; color: var(--color-gray-800, #1f2937); }
.pay-method-desc { font-size: 12px; color: var(--color-gray-500, #6b7280); }

.pay-method-check { margin-left: auto; }

/* ===== QR Code ===== */
.qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-method-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 99px;
}
.qr-method-label.wechat { color: #07C160; background: #e7f9ee; }
.qr-method-label.alipay { color: #1677FF; background: #eff6ff; }

.qr-code-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.qr-code-mock {
  width: 164px; height: 164px;
  border: 2px solid var(--color-gray-200, #e5e7eb);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 8px;
}

.qr-expire {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-gray-400, #9ca3af);
}

.qr-amount {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.qr-amount-label { font-size: 12px; color: var(--color-gray-500, #6b7280); }
.qr-amount-value { font-size: 28px; font-weight: 800; color: var(--color-gray-900, #111); }

.qr-hint {
  font-size: 13px;
  color: var(--color-gray-500, #6b7280);
  text-align: center;
}

.btn-simulate-pay {
  margin-top: 4px;
  padding: 8px 20px;
  border: 1.5px dashed var(--color-gray-300, #d1d5db);
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  color: var(--color-gray-500, #6b7280);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.btn-simulate-pay:hover {
  border-color: var(--color-primary-400, #818cf8);
  color: var(--color-primary-600, #4f46e5);
}

/* ===== Results ===== */
.pay-result-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.pay-result-icon { display: flex; align-items: center; justify-content: center; }

.pay-result-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-gray-900, #111);
  margin: 0;
}
.pay-result-desc {
  font-size: 14px;
  color: var(--color-gray-500, #6b7280);
  margin: 0;
  text-align: center;
}

.pay-result-info {
  width: 100%;
  background: var(--color-gray-50, #f9fafb);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pay-result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}
.pay-result-row span { color: var(--color-gray-500, #6b7280); }
.pay-result-row strong { font-weight: 600; color: var(--color-gray-800, #1f2937); }
.order-no { font-family: monospace; font-size: 11px; color: var(--color-gray-400, #9ca3af); }

.pay-result-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}
.pay-result-actions .btn-primary {
  flex: 1;
  padding: 12px;
  background: var(--gradient-primary, linear-gradient(135deg, #4f46e5, #7c3aed));
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.pay-result-actions .btn-primary:hover { transform: translateY(-1px); }
.pay-result-actions .btn-secondary {
  padding: 12px 20px;
  border: 1.5px solid var(--color-gray-200, #e5e7eb);
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  color: var(--color-gray-600, #4b5563);
  transition: all 0.15s;
}
.pay-result-actions .btn-secondary:hover { background: var(--color-gray-50, #f9fafb); }
</style>
