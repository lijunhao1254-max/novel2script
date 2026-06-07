/**
 * 转换状态管理 Store v2.0
 * 管理小说→剧本的转换全流程状态，支持分段进度和警告收集
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { convertNovel, estimateConversion } from '@/api/convert'
import { useAiConfigStore } from '@/stores/aiConfig'

export const useConvertStore = defineStore('convert', () => {
  // ---- 状态 ----
  const inputText = ref('')
  const outputText = ref('')
  const isConverting = ref(false)
  const currentStep = ref(0)
  const stepMessage = ref('')
  const error = ref(null)
  const stats = ref(null)

  // 新增：分段进度
  const chunkProgress = ref({ current: 0, total: 0 })
  const progressPercentValue = ref(0)

  // 新增：预估信息
  const estimate = ref(null)

  // 新增：警告列表
  const warnings = ref([])

  // 转换进度百分比
  const progressPercent = computed(() => progressPercentValue.value)

  // 是否可以开始转换
  const canConvert = computed(() => {
    return inputText.value.trim().length > 0 && !isConverting.value
  })

  // 是否有输出结果
  const hasOutput = computed(() => {
    return outputText.value.trim().length > 0
  })

  // 是否有警告
  const hasWarnings = computed(() => warnings.value.length > 0)

  // ---- 操作 ----

  /**
   * 设置输入文本（同时更新预估信息）
   */
  function setInputText(text) {
    inputText.value = text || ''
    if (text && text.trim().length > 0) {
      estimate.value = estimateConversion(text)
    } else {
      estimate.value = null
    }
  }

  /**
   * 开始转换
   */
  async function startConvert({ text, file, abortController } = {}) {
    if (!text?.trim() && !file) {
      error.value = '请输入小说文本或上传文件'
      return
    }

    isConverting.value = true
    error.value = null
    outputText.value = ''
    stats.value = null
    warnings.value = []
    currentStep.value = 0
    stepMessage.value = ''
    chunkProgress.value = { current: 0, total: 0 }
    progressPercentValue.value = 0

    try {
      const aiConfigStore = useAiConfigStore()
      const aiConfig = aiConfigStore.isConfigured ? {
        apiKey: aiConfigStore.apiKey,
        apiUrl: aiConfigStore.apiUrl,
        model: aiConfigStore.apiModel
      } : null

      const result = await convertNovel({
        text: text || '',
        file,
        onProgress: (phase, detail) => {
          stepMessage.value = detail.message || ''

          if (phase === 'processing') {
            chunkProgress.value = {
              current: detail.current || 0,
              total: detail.total || 0
            }
          }
          if (detail.percent !== undefined) {
            progressPercentValue.value = detail.percent
          }

          // 映射 phase 到旧版 step（兼容 UI）
          if (phase === 'init') currentStep.value = 1
          else if (phase === 'split') currentStep.value = 1
          else if (phase === 'processing') currentStep.value = 2
          else if (phase === 'merging') currentStep.value = 3
          else if (phase === 'done') currentStep.value = 4
        },
        signal: abortController?.signal,
        aiConfig
      })

      outputText.value = result.yaml
      stats.value = result.stats || null
      warnings.value = result.warnings || []
    } catch (err) {
      if (err.name === 'AbortError') {
        error.value = null
      } else {
        error.value = err.message || '转换失败，请稍后重试'
        outputText.value = `# 转换失败\n# ${error.value}\n`
      }
    } finally {
      isConverting.value = false
      if (currentStep.value < 4) {
        currentStep.value = 0
      }
    }
  }

  /**
   * 取消转换
   */
  function cancelConvert(abortController) {
    if (abortController) {
      abortController.abort()
    }
    isConverting.value = false
    currentStep.value = 0
    stepMessage.value = ''
    chunkProgress.value = { current: 0, total: 0 }
    progressPercentValue.value = 0
  }

  /**
   * 清空所有状态
   */
  function clearAll() {
    inputText.value = ''
    outputText.value = ''
    isConverting.value = false
    currentStep.value = 0
    stepMessage.value = ''
    error.value = null
    stats.value = null
    warnings.value = []
    estimate.value = null
    chunkProgress.value = { current: 0, total: 0 }
    progressPercentValue.value = 0
  }

  return {
    // 状态
    inputText,
    outputText,
    isConverting,
    currentStep,
    stepMessage,
    error,
    stats,
    warnings,
    estimate,
    chunkProgress,
    // 计算属性
    progressPercent,
    canConvert,
    hasOutput,
    hasWarnings,
    // 方法
    setInputText,
    startConvert,
    cancelConvert,
    clearAll
  }
})
