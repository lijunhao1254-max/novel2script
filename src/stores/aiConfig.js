/**
 * AI 配置状态管理 Store
 * 管理用户选择的 AI 服务和 API Key
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// 预设 AI 服务：仅保留真正免费的智谱 AI
export const AI_PROVIDERS = [
  {
    id: 'zhipu',
    name: '智谱 AI',
    icon: '🧠',
    description: 'GLM-4.7-Flash 最新免费模型，200K 上下文，写作能力更强',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4.7-flash',
    registerUrl: 'https://open.bigmodel.cn/',
    pricing: '免费',
    features: ['永久免费', '200K上下文', '中文写作强化']
  }
]

// 从 localStorage 加载持久化配置
function loadConfig() {
  try {
    const saved = localStorage.getItem('aiConfig')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {}
  return null
}

function saveConfig(config) {
  try {
    localStorage.setItem('aiConfig', JSON.stringify(config))
  } catch {}
}

export const useAiConfigStore = defineStore('aiConfig', () => {
  const savedConfig = loadConfig()
  const provider = AI_PROVIDERS[0] // 智谱 AI

  // ---- 状态 ----
  const selectedProvider = ref('zhipu') // 固定为智谱
  const apiKey = ref(savedConfig?.apiKey || import.meta.env.VITE_AI_API_KEY || '')

  // ---- 计算属性 ----
  const currentProvider = computed(() => provider)

  const apiUrl = computed(() => provider.url)

  const apiModel = computed(() => provider.model)

  const isConfigured = computed(() => {
    return !!apiKey.value
  })

  const providerName = computed(() => provider.name)

  // ---- 方法 ----

  function setApiKey(key) {
    apiKey.value = key
    persistConfig()
  }

  function persistConfig() {
    saveConfig({ apiKey: apiKey.value })
  }

  watch(apiKey, () => {
    persistConfig()
  })

  return {
    selectedProvider,
    apiKey,
    currentProvider,
    apiUrl,
    apiModel,
    isConfigured,
    providerName,
    setApiKey
  }
})
