<template>
  <div class="create-page">
    <!-- 页面头部 -->
    <div class="create-header">
      <h1>AI 剧本创作</h1>
      <p>上传或粘贴结构化 YAML 剧本，AI 自动创作完整剧本文本</p>
    </div>

    <div class="create-workspace">

      <!-- ===== 左侧：YAML 输入区 ===== -->
      <div class="panel panel-input">
        <div class="panel-topbar">
          <div class="panel-tabs">
            <button :class="{ active: inputMode === 'paste' }" @click="inputMode = 'paste'">粘贴 YAML</button>
            <button :class="{ active: inputMode === 'upload' }" @click="inputMode = 'upload'">上传文件</button>
          </div>
          <span class="char-count" v-if="yamlText">
            {{ structureStats ? `${structureStats.actCount} 幕 · ${structureStats.sceneCount} 场景 · ${structureStats.dialogueCount} 对白` : '已输入' }}
          </span>
        </div>

        <!-- 粘贴模式 -->
        <div class="panel-body" v-if="inputMode === 'paste'">
          <textarea
            v-model="yamlText"
            class="yaml-textarea"
            placeholder="在此粘贴 YAML 格式的结构化剧本…

示例：
script:
  meta:
    title: &quot;我的剧本&quot;
  acts:
    - act_id: 1
      act_title: &quot;相遇&quot;
      scenes:
        - scene_id: 1
          location: &quot;室内·咖啡馆&quot;
          time: &quot;日&quot;
          mood: &quot;轻松&quot;
          scene_note: &quot;午后阳光…&quot;
          characters:
            - name: &quot;苏晚&quot;
              role: &quot;女主&quot;
          dialogues:
            - dialogue_id: 1
              type: spoken
              speaker: &quot;苏晚&quot;
              line: &quot;你怎么来了？&quot;
              action: &quot;抬起头&quot;"
            @input="onYamlInput"
          ></textarea>
        </div>

        <!-- 上传模式 -->
        <div class="panel-body upload-body" v-else>
          <div
            class="upload-zone"
            :class="{ dragover: isDragover }"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @drop.prevent="onDrop"
            @click="triggerFileInput"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept=".yaml,.yml"
              style="display:none"
              @change="onFileSelected"
            >
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor"
                 stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:#6366f1">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p class="upload-main">点击或拖拽 YAML 文件</p>
            <p class="upload-hint">支持 .yaml / .yml 文件</p>
          </div>
          <div class="file-info" v-if="uploadedFile">
            <span class="file-name">{{ uploadedFile.name }}</span>
            <button class="file-remove" @click="clearFile">×</button>
          </div>
        </div>

        <!-- YAML 解析状态 -->
        <div class="yaml-status" v-if="yamlText">
          <div v-if="yamlError" class="yaml-status-error">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ yamlError }}
          </div>
          <div v-else-if="structureStats" class="yaml-status-ok">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            YAML 格式正确 · {{ structureStats.characterCount }} 个角色
            <span v-if="structureStats.characters.length > 0" class="char-list">
              ({{ structureStats.characters.slice(0,4).join('、') }}{{ structureStats.characters.length > 4 ? '…' : '' }})
            </span>
          </div>
        </div>

        <!-- 风格选择 -->
        <div class="style-selector">
          <div class="style-label">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            创作风格
          </div>
          <div class="style-grid">
            <button
              v-for="s in styles"
              :key="s.id"
              class="style-btn"
              :class="{ active: selectedStyle === s.id }"
              @click="selectedStyle = s.id"
              :title="s.desc"
            >
              <span class="style-icon">{{ s.icon }}</span>
              <span class="style-name">{{ s.name }}</span>
            </button>
          </div>
        </div>

        <!-- AI 状态 -->
        <div class="ai-selector-bar">
          <div class="ai-selector-left">
            <span class="ai-provider-label">🧠 智谱 AI</span>
            <span v-if="aiConfigStore.isConfigured" class="ai-status-badge ready">
              <span class="ai-dot"></span>已配置
            </span>
            <span v-else class="ai-status-badge need-key">
              <span class="ai-dot"></span>未配置（将用规则模式）
            </span>
          </div>
          <button class="btn-ai-config" @click="showAiConfig = true">
            {{ aiConfigStore.isConfigured ? '修改 Key' : '配置 Key' }}
          </button>
        </div>

        <!-- 操作按钮 -->
        <div class="panel-footer">
          <button
            class="btn-primary create-btn"
            :disabled="!canCreate"
            @click="handleCreate"
          >
            <svg v-if="!isCreating" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin-icon">
              <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
            </svg>
            {{ isCreating ? '创作中…' : 'AI 开始创作' }}
          </button>
          <button v-if="isCreating" class="btn-cancel" @click="handleCancel">取消</button>
          <button class="btn-text" @click="handleClear" v-if="yamlText || outputText">清空</button>
        </div>
      </div>

      <!-- ===== 右侧：剧本输出区 ===== -->
      <div class="panel panel-output">
        <div class="panel-topbar">
          <div class="output-tabs">
            <button :class="{ active: outputTab === 'script' }" @click="outputTab = 'script'">剧本文本</button>
            <button :class="{ active: outputTab === 'structure' }" @click="outputTab = 'structure'">结构预览</button>
          </div>
          <div class="output-actions" v-if="outputText">
            <button class="btn-icon" @click="copyOutput" title="复制">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="btn-icon" @click="downloadScript" title="下载剧本">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 剧本文本输出 -->
        <div class="panel-body script-body" v-if="outputTab === 'script'">
          <div v-if="outputText || streamingText" class="script-output">
            <div class="script-text" v-html="renderedScript"></div>
            <div v-if="isCreating" class="typing-cursor">▌</div>
          </div>
          <div class="empty-state" v-else>
            <div class="empty-icon">
              <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor"
                   stroke-width="1.5" stroke-linecap="round" opacity="0.3">
                <path d="M12 4H8a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4h-4"/>
                <rect x="14" y="2" width="20" height="8" rx="2"/>
                <line x1="16" y1="24" x2="32" y2="24"/>
                <line x1="16" y1="30" x2="28" y2="30"/>
              </svg>
            </div>
            <p>AI 创作的剧本将在这里展示</p>
            <p class="hint">在左侧粘贴 YAML 结构，选择风格，点击「AI 开始创作」</p>
          </div>
        </div>

        <!-- 结构预览 -->
        <div class="panel-body structure-body" v-if="outputTab === 'structure'">
          <div v-if="structureStats && parsedScript" class="structure-view">
            <!-- 剧本信息 -->
            <div class="struct-meta">
              <h3 class="struct-title">{{ parsedScript.meta?.title || '未命名剧本' }}</h3>
              <div class="struct-stats">
                <span class="stat-tag">{{ structureStats.actCount }} 幕</span>
                <span class="stat-tag">{{ structureStats.sceneCount }} 场景</span>
                <span class="stat-tag">{{ structureStats.dialogueCount }} 对白</span>
                <span class="stat-tag">{{ structureStats.characterCount }} 角色</span>
              </div>
            </div>

            <!-- 幕/场景树 -->
            <div class="struct-tree">
              <div class="struct-act" v-for="act in parsedScript.acts" :key="act.act_id">
                <div class="struct-act-header">
                  <span class="struct-act-num">第 {{ act.act_id }} 幕</span>
                  <span class="struct-act-title">{{ act.act_title }}</span>
                  <span class="struct-act-count">{{ (act.scenes || []).length }} 场</span>
                </div>
                <div class="struct-scene" v-for="scene in (act.scenes || [])" :key="scene.scene_id">
                  <div class="struct-scene-header">
                    <span class="struct-scene-loc">📍 {{ scene.location }}</span>
                    <span class="struct-scene-time" v-if="scene.time">{{ scene.time }}</span>
                    <span class="struct-scene-mood" v-if="scene.mood">{{ scene.mood }}</span>
                    <span class="struct-dialogue-count">{{ (scene.dialogues || []).length }} 句对白</span>
                  </div>
                  <div class="struct-chars" v-if="scene.characters && scene.characters.length">
                    <span class="struct-char-tag" v-for="c in scene.characters" :key="c.name">
                      {{ c.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <p>请先在左侧输入有效的 YAML 剧本</p>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="create-progress" v-if="isCreating">
          <div class="progress-bar-wrap">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <span class="progress-bar-text">{{ progressPercent }}%</span>
          </div>
          <div class="progress-message" v-if="progressMessage">{{ progressMessage }}</div>
        </div>
      </div>
    </div>

    <!-- AI 配置弹窗 -->
    <AiConfigModal
      :visible="showAiConfig"
      @close="showAiConfig = false"
      @saved="showAiConfig = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAiConfigStore } from '@/stores/aiConfig'
import { showSuccess, showError, showWarning } from '@/utils/toast'
import AiConfigModal from '@/components/AiConfigModal.vue'
import {
  createScriptFromYaml,
  parseScriptYaml,
  getScriptStats,
  SCRIPT_STYLES
} from '@/api/scriptCreate.js'

const aiConfigStore = useAiConfigStore()

// ===== 状态 =====
const inputMode = ref('paste')
const yamlText = ref('')
const yamlError = ref('')
const parsedScript = ref(null)
const structureStats = ref(null)
const uploadedFile = ref(null)
const isDragover = ref(false)
const fileInputRef = ref(null)
const showAiConfig = ref(false)
const selectedStyle = ref('modern')

const isCreating = ref(false)
const outputText = ref('')
const streamingText = ref('')
const outputTab = ref('script')
const progressPercent = ref(0)
const progressMessage = ref('')

const styles = SCRIPT_STYLES

let abortController = null

// ===== 计算属性 =====
const canCreate = computed(() => {
  return !!yamlText.value && !yamlError.value && !!parsedScript.value && !isCreating.value
})

const renderedScript = computed(() => {
  const text = isCreating.value ? streamingText.value : outputText.value
  if (!text) return ''

  // 简单的 Markdown 渲染
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^## (.+)$/gm, '<h2 class="script-act-title">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="script-scene-title">$1</h3>')
    .replace(/^# (.+)$/gm, '<h1 class="script-main-title">$1</h1>')
    .replace(/^---$/gm, '<hr class="script-divider"/>')
    .replace(/^_(.+)_$/gm, '<em class="script-meta">$1</em>')
    .replace(/「(.+?)」/g, '<span class="dialogue-line">「$1」</span>')
    .replace(/【(.+?)】/g, '<span class="scene-header">【$1】</span>')
    .replace(/\n\n/g, '</p><p class="script-para">')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p class="script-para">')
    .replace(/$/, '</p>')
})

// ===== YAML 解析 =====
function onYamlInput() {
  if (!yamlText.value.trim()) {
    yamlError.value = ''
    parsedScript.value = null
    structureStats.value = null
    return
  }
  parseYaml()
}

function parseYaml() {
  const result = parseScriptYaml(yamlText.value)
  if (!result.ok) {
    yamlError.value = result.error
    parsedScript.value = null
    structureStats.value = null
  } else {
    yamlError.value = ''
    parsedScript.value = result.data
    structureStats.value = getScriptStats(result.data)
  }
}

// ===== 文件上传 =====
function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (file) loadYamlFile(file)
}

function onDrop(e) {
  isDragover.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) loadYamlFile(file)
}

function loadYamlFile(file) {
  if (!file.name.match(/\.(yaml|yml)$/i)) {
    showError('请上传 .yaml 或 .yml 格式的文件')
    return
  }
  uploadedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    yamlText.value = e.target.result || ''
    parseYaml()
    inputMode.value = 'paste'
  }
  reader.readAsText(file, 'utf-8')
}

function clearFile() {
  uploadedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ===== 创作主流程 =====
async function handleCreate() {
  if (!canCreate.value) return

  isCreating.value = true
  outputText.value = ''
  streamingText.value = ''
  progressPercent.value = 0
  progressMessage.value = '准备创作…'
  outputTab.value = 'script'

  abortController = new AbortController()

  const result = await createScriptFromYaml({
    yamlText: yamlText.value,
    style: selectedStyle.value,
    aiConfig: aiConfigStore.isConfigured ? {
      apiKey: aiConfigStore.apiKey,
      apiUrl: aiConfigStore.apiUrl,
      apiModel: aiConfigStore.apiModel
    } : null,
    onProgress: (current, total, message) => {
      progressPercent.value = Math.round((current / total) * 100)
      progressMessage.value = message
    },
    onChunk: (text) => {
      streamingText.value += text
    },
    onSceneStart: (sceneName) => {
      progressMessage.value = `正在创作：${sceneName}`
    },
    signal: abortController.signal
  })

  isCreating.value = false
  progressPercent.value = 100

  if (result.ok) {
    outputText.value = result.text
    streamingText.value = ''
    showSuccess('剧本创作完成！')
  } else if (result.cancelled) {
    outputText.value = streamingText.value
    streamingText.value = ''
    showWarning('已取消创作')
  } else {
    showError(result.error || '创作失败，请重试')
    if (streamingText.value) {
      outputText.value = streamingText.value
      streamingText.value = ''
    }
  }
}

function handleCancel() {
  abortController?.abort()
}

function handleClear() {
  yamlText.value = ''
  outputText.value = ''
  streamingText.value = ''
  yamlError.value = ''
  parsedScript.value = null
  structureStats.value = null
  progressPercent.value = 0
  progressMessage.value = ''
  uploadedFile.value = null
}

// ===== 复制/下载 =====
async function copyOutput() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    showSuccess('已复制到剪贴板')
  } catch {
    showError('复制失败，请手动复制')
  }
}

function downloadScript() {
  const title = parsedScript.value?.meta?.title || 'script'
  const blob = new Blob([outputText.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.md`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* ===== 页面布局 ===== */
.create-page {
  min-height: 100vh;
  background: var(--color-gray-50, #f9fafb);
  padding: 88px 24px 48px;
}

.create-header {
  max-width: 1200px;
  margin: 0 auto 28px;
}
.create-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-gray-900, #111827);
  margin: 0 0 6px;
}
.create-header p {
  font-size: 15px;
  color: var(--color-gray-500, #6b7280);
  margin: 0;
}

.create-workspace {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 20px;
  align-items: start;
}

/* ===== Panel 通用 ===== */
.panel {
  background: #fff;
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-gray-100, #f3f4f6);
  background: var(--color-gray-50, #f9fafb);
  gap: 10px;
  flex-shrink: 0;
}

.panel-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-gray-100, #f3f4f6);
  border-radius: 8px;
  padding: 3px;
}
.panel-tabs button {
  padding: 5px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-gray-500, #6b7280);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.panel-tabs button.active {
  background: #fff;
  color: var(--color-gray-900, #111827);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.char-count {
  font-size: 12px;
  color: var(--color-gray-400, #9ca3af);
}

.panel-body {
  flex: 1;
  overflow: hidden;
}

/* ===== YAML 输入框 ===== */
.yaml-textarea {
  width: 100%;
  height: 300px;
  padding: 14px 16px;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--color-gray-800, #1f2937);
  background: transparent;
  box-sizing: border-box;
}
.yaml-textarea::placeholder { color: var(--color-gray-300, #d1d5db); }

/* ===== YAML 状态 ===== */
.yaml-status {
  padding: 8px 16px;
  font-size: 12px;
  border-top: 1px solid var(--color-gray-100, #f3f4f6);
}
.yaml-status-error {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  color: #ef4444;
}
.yaml-status-ok {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #10b981;
}
.char-list { color: var(--color-gray-400, #9ca3af); }

/* ===== 风格选择 ===== */
.style-selector {
  padding: 12px 16px;
  border-top: 1px solid var(--color-gray-100, #f3f4f6);
}
.style-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-gray-500, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.style-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 6px;
  border: 1.5px solid var(--color-gray-200, #e5e7eb);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.style-btn:hover {
  border-color: var(--color-primary-300, #a5b4fc);
  background: var(--color-primary-50, #eef2ff);
}
.style-btn.active {
  border-color: var(--color-primary-600, #4f46e5);
  background: var(--color-primary-50, #eef2ff);
}
.style-icon { font-size: 18px; line-height: 1; }
.style-name { font-size: 11px; font-weight: 500; color: var(--color-gray-600, #4b5563); }
.style-btn.active .style-name { color: var(--color-primary-700, #4338ca); }

/* ===== AI 状态栏 ===== */
.ai-selector-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid var(--color-gray-100, #f3f4f6);
  background: var(--color-gray-50, #f9fafb);
}
.ai-selector-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ai-provider-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-gray-700, #374151);
}
.ai-status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 99px;
}
.ai-status-badge.ready { background: #d1fae5; color: #065f46; }
.ai-status-badge.need-key { background: #fef3c7; color: #92400e; }
.ai-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ready .ai-dot { background: #10b981; }
.need-key .ai-dot { background: #f59e0b; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }

.btn-ai-config {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
  color: var(--color-gray-600, #4b5563);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-ai-config:hover { border-color: var(--color-primary-400, #818cf8); color: var(--color-primary-600, #4f46e5); }

/* ===== 操作按钮 ===== */
.panel-footer {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--color-gray-100, #f3f4f6);
}

.btn-primary.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
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
.btn-primary.create-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(79,70,229,0.3); }
.btn-primary.create-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-cancel {
  padding: 10px 16px;
  border: 1.5px solid #ef4444;
  border-radius: 10px;
  background: transparent;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-cancel:hover { background: #fef2f2; }

.btn-text {
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--color-gray-400, #9ca3af);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s;
}
.btn-text:hover { color: var(--color-gray-600, #4b5563); }

/* ===== 旋转动画 ===== */
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

/* ===== 右侧输出面板 ===== */
.panel-output {
  min-height: 600px;
}

.output-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-gray-100, #f3f4f6);
  border-radius: 8px;
  padding: 3px;
}
.output-tabs button {
  padding: 5px 14px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-gray-500, #6b7280);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.output-tabs button.active {
  background: #fff;
  color: var(--color-gray-900, #111827);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.output-actions {
  display: flex;
  gap: 4px;
}
.btn-icon {
  width: 32px; height: 32px;
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 8px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-gray-500, #6b7280);
  transition: all 0.15s;
}
.btn-icon:hover { border-color: var(--color-primary-400, #818cf8); color: var(--color-primary-600, #4f46e5); }

/* ===== 剧本输出 ===== */
.script-body {
  overflow-y: auto;
  max-height: 600px;
}
.script-output {
  padding: 24px 28px;
  position: relative;
}
.typing-cursor {
  display: inline;
  animation: blink 1s infinite;
  color: var(--color-primary-500, #6366f1);
  font-size: 18px;
}
@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }

/* 剧本文本样式（通过 v-html 注入） */
:deep(.script-main-title) {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-gray-900, #111827);
  margin: 0 0 6px;
}
:deep(.script-act-title) {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-primary-700, #4338ca);
  margin: 24px 0 8px;
  padding-left: 12px;
  border-left: 3px solid var(--color-primary-500, #6366f1);
}
:deep(.script-scene-title) {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-gray-600, #4b5563);
  margin: 16px 0 6px;
}
:deep(.script-divider) {
  border: none;
  border-top: 1px solid var(--color-gray-200, #e5e7eb);
  margin: 16px 0;
}
:deep(.script-meta) {
  font-size: 12px;
  color: var(--color-gray-400, #9ca3af);
  display: block;
  margin-top: 16px;
}
:deep(.script-para) {
  font-size: 14.5px;
  line-height: 1.9;
  color: var(--color-gray-700, #374151);
  margin: 0 0 4px;
}
:deep(.dialogue-line) {
  color: var(--color-primary-700, #4338ca);
  font-weight: 500;
}
:deep(.scene-header) {
  display: inline-block;
  background: var(--color-gray-100, #f3f4f6);
  color: var(--color-gray-600, #4b5563);
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: var(--font-mono, monospace);
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 400px;
  color: var(--color-gray-400, #9ca3af);
}
.empty-icon { margin-bottom: 8px; }
.empty-state p { font-size: 14px; margin: 0; }
.empty-state .hint { font-size: 12px; color: var(--color-gray-300, #d1d5db); text-align: center; max-width: 280px; }

/* ===== 结构预览 ===== */
.structure-body {
  overflow-y: auto;
  max-height: 600px;
  padding: 16px;
}
.struct-meta {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-gray-100, #f3f4f6);
}
.struct-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-gray-900, #111827);
  margin: 0 0 8px;
}
.struct-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.stat-tag {
  font-size: 12px;
  padding: 3px 10px;
  background: var(--color-gray-100, #f3f4f6);
  border-radius: 99px;
  color: var(--color-gray-600, #4b5563);
}

.struct-tree {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.struct-act {
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 10px;
  overflow: hidden;
}
.struct-act-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-primary-50, #eef2ff);
  border-bottom: 1px solid var(--color-primary-100, #e0e7ff);
}
.struct-act-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary-600, #4f46e5);
  background: rgba(79,70,229,0.1);
  padding: 2px 8px;
  border-radius: 6px;
}
.struct-act-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-gray-700, #374151);
  flex: 1;
}
.struct-act-count {
  font-size: 11px;
  color: var(--color-gray-400, #9ca3af);
}

.struct-scene {
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-gray-50, #f9fafb);
}
.struct-scene:last-child { border-bottom: none; }
.struct-scene-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.struct-scene-loc { font-size: 13px; font-weight: 500; color: var(--color-gray-700, #374151); }
.struct-scene-time { font-size: 11px; color: var(--color-gray-400, #9ca3af); }
.struct-scene-mood {
  font-size: 11px;
  padding: 1px 7px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
}
.struct-dialogue-count {
  font-size: 11px;
  color: var(--color-gray-400, #9ca3af);
  margin-left: auto;
}
.struct-chars {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.struct-char-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--color-gray-100, #f3f4f6);
  border-radius: 99px;
  color: var(--color-gray-600, #4b5563);
}

/* ===== 进度条 ===== */
.create-progress {
  padding: 12px 16px;
  border-top: 1px solid var(--color-gray-100, #f3f4f6);
}
.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.progress-bar-track {
  flex: 1;
  height: 4px;
  background: var(--color-gray-100, #f3f4f6);
  border-radius: 2px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--gradient-primary, linear-gradient(90deg, #4f46e5, #7c3aed));
  border-radius: 2px;
  transition: width 0.4s ease;
}
.progress-bar-text {
  font-size: 11px;
  color: var(--color-gray-400, #9ca3af);
  width: 32px;
  text-align: right;
}
.progress-message {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-gray-500, #6b7280);
}

/* ===== 上传区 ===== */
.upload-body {
  padding: 16px;
}
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  border: 2px dashed var(--color-gray-200, #e5e7eb);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.upload-zone:hover, .upload-zone.dragover {
  border-color: var(--color-primary-400, #818cf8);
  background: var(--color-primary-50, #eef2ff);
}
.upload-main { font-size: 14px; font-weight: 500; color: var(--color-gray-700, #374151); margin: 0; }
.upload-hint { font-size: 12px; color: var(--color-gray-400, #9ca3af); margin: 0; }

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  background: var(--color-gray-50, #f9fafb);
  border-radius: 8px;
}
.file-name { font-size: 13px; color: var(--color-gray-700, #374151); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-remove {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--color-gray-400, #9ca3af);
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}
.file-remove:hover { color: #ef4444; }

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .create-workspace {
    grid-template-columns: 1fr;
  }
}
</style>
