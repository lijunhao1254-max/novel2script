<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-container">
          <!-- 头部 -->
          <div class="modal-header">
            <h2>
              <span class="header-icon">🧠</span>
              配置智谱 AI
            </h2>
            <button class="modal-close" @click="$emit('close')" title="关闭">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <!-- 服务介绍 -->
            <div class="provider-intro">
              <div class="provider-icon-big">🧠</div>
              <div class="provider-detail">
                <h3>{{ provider.name }}</h3>
                <p>{{ provider.description }}</p>
                <div class="provider-tags">
                  <span v-for="f in provider.features" :key="f" class="tag">{{ f }}</span>
                </div>
              </div>
            </div>

            <!-- API Key 输入 -->
            <div class="section">
              <h3 class="section-title">
                填写 API Key
                <a :href="provider.registerUrl" target="_blank" class="register-link">
                  去官网获取 Key →
                </a>
              </h3>
              <div class="input-row">
                <input
                  v-model="keyInput"
                  :type="showKey ? 'text' : 'password'"
                  class="form-input"
                  placeholder="粘贴你的智谱 API Key"
                  @keyup.enter="handleSave"
                />
                <button class="toggle-key" @click="showKey = !showKey" title="显示/隐藏">
                  <svg v-if="!showKey" viewBox="0 0 24 24" width="16" height="16" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <path d="m14.12 14.12A3 3 0 1 1 9.88 9.88"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
              <div class="form-hint">
                接口地址：{{ provider.url }}<br/>
                使用模型：{{ provider.model }}
              </div>
            </div>

            <!-- 免费额度说明 -->
            <div class="free-notice">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>GLM-4.7-Flash 最新模型<strong>完全免费</strong>，注册即用，无需充值。</span>
            </div>

            <!-- 状态提示 -->
            <div class="status-bar" v-if="keyInput">
              <div v-if="keyInput.trim()" class="status-ok">
                <span class="status-dot ok"></span>
                配置就绪，可以使用 AI 智能转换
              </div>
            </div>
          </div>

          <!-- 底部 -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="$emit('close')">取消</button>
            <button class="btn-save" :disabled="!canSave" @click="handleSave">
              保存配置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAiConfigStore, AI_PROVIDERS } from '@/stores/aiConfig'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'saved'])

const store = useAiConfigStore()
const provider = AI_PROVIDERS[0]

const keyInput = ref('')
const showKey = ref(false)

const canSave = computed(() => !!keyInput.value.trim())

watch(() => props.visible, (val) => {
  if (val) {
    keyInput.value = store.apiKey || ''
  }
})

function handleSave() {
  store.setApiKey(keyInput.value.trim())
  emit('saved')
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  background: #fff;
  border-radius: var(--radius-xl);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-gray-200);
  flex-shrink: 0;
}
.modal-header h2 {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-gray-900);
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon {
  font-size: 22px;
  line-height: 1;
}
.modal-close {
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-gray-400);
  transition: all 0.15s;
}
.modal-close:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

/* 服务介绍 */
.provider-intro {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(135deg, #F0F4FF, #EDE9FE);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
  border: 1px solid #DDD6FE;
}
.provider-icon-big {
  font-size: 36px;
  line-height: 1;
  flex-shrink: 0;
}
.provider-detail h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-gray-800);
  margin-bottom: 4px;
}
.provider-detail p {
  font-size: 13px;
  color: var(--color-gray-600);
  margin-bottom: 8px;
  line-height: 1.5;
}
.provider-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tag {
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(99, 102, 241, 0.1);
  color: #4F46E5;
  border-radius: var(--radius-full);
}

/* 表单 */
.section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.register-link {
  font-size: 12px;
  color: var(--color-primary-600);
  text-decoration: none;
  font-weight: 500;
}
.register-link:hover {
  text-decoration: underline;
}
.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-mono);
  color: var(--color-gray-800);
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
}
.form-input:focus {
  border-color: var(--color-primary-400);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.form-input::placeholder {
  color: var(--color-gray-400);
  font-family: var(--font-sans);
}
.input-row {
  display: flex;
  gap: 8px;
}
.input-row .form-input {
  flex: 1;
}
.toggle-key {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1.5px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-gray-400);
  transition: all 0.15s;
  flex-shrink: 0;
}
.toggle-key:hover {
  border-color: var(--color-gray-400);
  color: var(--color-gray-600);
}
.form-hint {
  font-size: 12px;
  color: var(--color-gray-400);
  line-height: 1.6;
  font-family: var(--font-mono);
  word-break: break-all;
  margin-top: 8px;
}

/* 免费提示 */
.free-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: #166534;
  line-height: 1.5;
  margin-bottom: 16px;
}
.free-notice svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* 状态栏 */
.status-bar {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-ok {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  color: #166534;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
}
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.ok { background: #22C55E; }

/* 底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-gray-200);
  flex-shrink: 0;
}
.btn-cancel {
  padding: 9px 20px;
  background: #fff;
  border: 1.5px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-gray-600);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
}
.btn-save {
  padding: 9px 24px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-primary);
}
.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-hover);
}
.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-container {
  transform: scale(0.95) translateY(10px);
}
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(10px);
}
</style>
