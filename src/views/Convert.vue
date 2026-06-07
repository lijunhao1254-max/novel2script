<template>
  <div class="convert-page">
    <!-- 错误提示 -->
    <div v-if="pageError" class="page-error-banner">
      <p>{{ pageError }}</p>
      <button @click="pageError = ''">关闭</button>
    </div>

    <div class="convert-header">
      <h1>粘贴你的小说，生成结构化剧本</h1>
      <p>支持 TXT / DOCX 上传，或直接在左侧粘贴文本</p>
    </div>

    <div class="convert-workspace">
      <!-- 左侧：输入 -->
      <div class="panel panel-input">
        <div class="panel-topbar">
          <div class="panel-tabs">
            <button :class="{ active: inputMode === 'paste' }" @click="inputMode = 'paste'">粘贴文本</button>
            <button :class="{ active: inputMode === 'upload' }" @click="inputMode = 'upload'">上传文件</button>
          </div>
          <span class="char-count" :class="{ 'char-warn': store.estimate?.isLong }">
            {{ (store.inputText?.length || 0).toLocaleString() }} 字
            <span v-if="store.estimate?.isLong" class="char-warn-icon" title="文本较长，建议分批处理">⚠</span>
          </span>
        </div>

        <div class="panel-body" v-if="inputMode === 'paste'">
          <textarea
            v-model="store.inputText"
            class="input-textarea"
            placeholder="在此粘贴小说文本…&#10;&#10;示例：&#10;苏晚推开门，看见顾寒正站在落地窗前。&#10;'你怎么来了？'他头也不回。&#10;'合同的事。'苏晚把文件拍在桌上。"
            @input="onInputChange"
          ></textarea>
        </div>

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
              ref="fileInput"
              type="file"
              accept=".txt,.docx,.doc"
              style="display:none"
              @change="onFileSelected"
            >
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor"
                 stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p class="upload-main">点击或拖拽文件到此处</p>
            <p class="upload-hint">支持 .txt / .docx，单文件 ≤ 10MB</p>
            <p class="upload-hint upload-warn">DOCX 建议先另存为 .txt 纯文本以获得最佳效果</p>
          </div>
          <!-- 已选文件信息 -->
          <div class="file-info" v-if="selectedFile">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            <button class="file-remove" @click="clearFile" title="移除">×</button>
          </div>
        </div>

        <!-- 预估信息条 -->
        <div v-if="store.estimate && !store.isConverting" class="estimate-bar">
          <div class="estimate-item" v-if="store.estimate.chunks > 1">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <span>{{ store.estimate.chunks }} 个分段</span>
          </div>
          <div class="estimate-item" v-if="store.estimate.chunks > 1">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>约 {{ store.estimate.estimatedSeconds }} 秒</span>
          </div>
          <div class="estimate-item" v-if="store.estimate.isLong">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#D97706"
                 stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span style="color:#D97706">建议分批处理</span>
          </div>
        </div>

        <!-- AI 服务状态条 -->
        <div class="ai-selector-bar">
          <div class="ai-selector-left">
            <span class="ai-provider-label">🧠 智谱 AI</span>
            <span v-if="aiConfigStore.isConfigured" class="ai-status-badge ready">
              <span class="ai-dot"></span> 已配置
            </span>
            <span v-else class="ai-status-badge need-key">
              <span class="ai-dot"></span> 未配置
            </span>
          </div>
          <button class="btn-ai-config" @click="showAiConfig = true" title="配置智谱 AI API Key">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            {{ aiConfigStore.isConfigured ? '修改 Key' : '配置 Key' }}
          </button>
        </div>

        <div class="panel-footer">
          <button
            class="btn-primary convert-btn"
            :disabled="!canConvert"
            @click="handleConvert"
          >
            <svg v-if="!store.isConverting" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            {{ store.isConverting ? '转换中…' : (aiConfigStore.isConfigured ? 'AI 智能转换' : '开始转换') }}
          </button>
          <button
            v-if="store.isConverting"
            class="btn-cancel"
            @click="handleCancel"
          >
            取消
          </button>
          <button class="btn-text" @click="handleClear" v-if="store.inputText || store.outputText">清空</button>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="panel panel-output">
        <div class="panel-topbar">
          <div class="output-tabs">
            <button :class="{ active: outputTab === 'yaml' }" @click="outputTab = 'yaml'">YAML 输出</button>
            <button :class="{ active: outputTab === 'preview' }" @click="outputTab = 'preview'">预览</button>
          </div>
          <div class="output-actions" v-if="store.outputText">
            <button class="btn-icon" @click="copyOutput" title="复制">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="btn-icon" @click="downloadYaml" title="下载 YAML">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          </div>
        </div>

        <!-- YAML 输出 -->
        <div class="panel-body yaml-body" v-if="outputTab === 'yaml'">
          <pre v-if="store.outputText"><code v-html="highlightedYaml"></code></pre>
          <div class="empty-state" v-else>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor"
                 stroke-width="1.5" stroke-linecap="round" opacity="0.3">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>转换结果将在此处显示</p>
            <p class="hint">支持 YAML 输出 / 剧本预览</p>
          </div>
        </div>

        <!-- 预览模式 -->
        <div class="panel-body preview-body" v-if="outputTab === 'preview'">
          <div v-if="parsedScenes.length" class="preview-scenes">
            <!-- 统计信息 -->
            <div class="preview-stats" v-if="store.stats">
              <span class="stat-item" v-if="store.stats.characters">
                <strong>{{ store.stats.characters }}</strong> 个角色
              </span>
              <span class="stat-item" v-if="store.stats.scenes">
                <strong>{{ store.stats.scenes }}</strong> 个场景
              </span>
              <span class="stat-item" v-if="store.stats.dialogues">
                <strong>{{ store.stats.dialogues }}</strong> 句对白
              </span>
            </div>

            <div class="scene-card" v-for="(scene, i) in parsedScenes" :key="i">
              <div class="scene-header">
                <span class="scene-loc">{{ scene.location }}</span>
                <span class="scene-time" v-if="scene.time">{{ scene.time }}</span>
              </div>
              <div class="scene-dialogues">
                <div class="dl-line" v-for="(d, j) in scene.dialogues" :key="j">
                  <span class="dl-speaker">{{ d.speaker }}</span>
                  <span class="dl-line-text">"{{ d.line }}"</span>
                  <span class="dl-action" v-if="d.action">{{ d.action }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <p>暂无预览数据</p>
            <p class="hint">请先在左侧输入小说文本并点击"开始转换"</p>
          </div>
        </div>

        <!-- 警告信息 -->
        <div v-if="store.hasWarnings && !store.isConverting" class="warnings-panel">
          <div class="warnings-header">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#D97706"
                 stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>提示</span>
          </div>
          <ul class="warnings-list">
            <li v-for="(w, i) in store.warnings" :key="i">{{ w }}</li>
          </ul>
        </div>

        <!-- 转换进度 -->
        <div class="convert-progress" v-if="store.isConverting">
          <!-- 进度条 -->
          <div class="progress-bar-wrap">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" :style="{ width: store.progressPercent + '%' }"></div>
            </div>
            <span class="progress-bar-text">{{ store.progressPercent }}%</span>
          </div>

          <!-- 分段进度（长文本时显示） -->
          <div class="chunk-progress" v-if="store.chunkProgress.total > 1">
            <span class="chunk-label">AI 解析进度</span>
            <span class="chunk-count">{{ store.chunkProgress.current }} / {{ store.chunkProgress.total }} 段</span>
          </div>

          <!-- 状态消息 -->
          <div class="progress-message" v-if="store.stepMessage">
            {{ store.stepMessage }}
          </div>
        </div>
      </div>
    </div>

    <!-- AI 配置弹窗 -->
    <AiConfigModal
      :visible="showAiConfig"
      @close="showAiConfig = false"
      @saved="onAiConfigSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConvertStore } from '@/stores/convert'
import { useAiConfigStore } from '@/stores/aiConfig'
import { highlightYaml, parseYamlToScenes } from '@/utils/yaml'
import { validateFile } from '@/utils/yaml'
import { readFile } from '@/utils/file'
import { showSuccess, showError, showWarning, showInfo } from '@/utils/toast'
import AiConfigModal from '@/components/AiConfigModal.vue'

const store = useConvertStore()
const aiConfigStore = useAiConfigStore()

// 页面级错误捕获
const pageError = ref('')

const inputMode = ref('paste')
const outputTab = ref('yaml')
const isDragover = ref(false)
const fileInput = ref(null)
const selectedFile = ref(null)
const showAiConfig = ref(false)
let abortController = null

const canConvert = computed(() => {
  if (inputMode.value === 'upload') {
    return !!selectedFile.value && !store.isConverting
  }
  return (store.inputText?.trim()?.length || 0) > 0 && !store.isConverting
})

/* ---- YAML 解析预览 ---- */
const parsedScenes = computed(() => {
  return parseYamlToScenes(store.outputText)
})

/* ---- YAML 语法高亮 ---- */
const highlightedYaml = computed(() => {
  return highlightYaml(store.outputText)
})

/* ---- 输入变化时更新预估 ---- */
function onInputChange() {
  store.setInputText(store.inputText)
}

/* ---- 文件操作 ---- */
function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  processFile(file)
}

function onDrop(e) {
  isDragover.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

function processFile(file) {
  const validation = validateFile(file)
  if (!validation.valid) {
    showWarning(validation.error)
    return
  }
  selectedFile.value = file
  // 预读文件内容到 inputText，用于字数统计和预估
  readFile(file).then(text => {
    store.setInputText(text)
  }).catch(err => {
    if (file.name && !file.name.toLowerCase().endsWith('.txt')) {
      store.setInputText('')
    } else {
      showError(err.message)
    }
  })
}

function clearFile() {
  selectedFile.value = null
  store.setInputText('')
  if (fileInput.value) fileInput.value.value = ''
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/* ---- 转换 ---- */
async function handleConvert() {
  abortController = new AbortController()
  outputTab.value = 'yaml'

  try {
    await store.startConvert({
      file: inputMode.value === 'upload' ? selectedFile.value : undefined,
      text: inputMode.value === 'paste' ? store.inputText : '',
      abortController
    })

    if (store.error) {
      showError(store.error)
    } else if (store.outputText && !abortController.signal.aborted) {
      const msg = aiConfigStore.isConfigured ? 'AI 智能转换完成！' : '转换完成！'
      if (store.hasWarnings) {
        showWarning(`${msg}（${store.warnings.length} 条提示）`)
      } else {
        showSuccess(msg)
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      showError(err.message || '转换失败')
    }
  }
}

function handleCancel() {
  store.cancelConvert(abortController)
  abortController = null
  showInfo('已取消转换')
}

function handleClear() {
  store.clearAll()
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

/* ---- AI 配置 ---- */
function onAiConfigSaved() {
  showSuccess('智谱 AI 配置已保存')
}

/* ---- 输出操作 ---- */
async function copyOutput() {
  try {
    await navigator.clipboard.writeText(store.outputText)
    showSuccess('已复制到剪贴板')
  } catch {
    showError('复制失败，请手动选择复制')
  }
}

function downloadYaml() {
  const blob = new Blob([store.outputText], { type: 'text/yaml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'novel2script-output.yaml'
  a.click()
  URL.revokeObjectURL(a.href)
  showSuccess('YAML 文件下载中…')
}
</script>

<style scoped>
.convert-page {
  min-height: 100vh;
  background: var(--color-gray-50);
  padding: 96px 24px 48px;
}
.page-error-banner {
  max-width: 1400px;
  margin: 0 auto 20px;
  padding: 16px 20px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: var(--radius-md);
  color: #DC2626;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-error-banner button {
  background: none;
  border: none;
  color: #DC2626;
  cursor: pointer;
  font-size: 13px;
}

.convert-header {
  text-align: center;
  margin-bottom: 32px;
}
.convert-header h1 {
  font-size: clamp(20px, 3vw, 28px);
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 8px;
}
.convert-header p {
  font-size: 14px;
  color: var(--color-gray-500);
}

/* ========== Workspace ========== */
.convert-workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 600px;
}

/* ========== Panel ========== */
.panel {
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}

.panel-tabs,
.output-tabs {
  display: flex;
  gap: 4px;
}
.panel-tabs button,
.output-tabs button {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-gray-500);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}
.panel-tabs button.active,
.output-tabs button.active {
  background: #fff;
  color: var(--color-primary-600);
  box-shadow: var(--shadow-sm);
}
.char-count {
  font-size: 12px;
  color: var(--color-gray-400);
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 4px;
}
.char-count.char-warn {
  color: #D97706;
}
.char-warn-icon {
  font-size: 11px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* ========== 输入区 ========== */
.input-textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 20px;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-gray-800);
  background: transparent;
}
.input-textarea::placeholder {
  color: var(--color-gray-400);
  font-family: var(--font-sans);
}

.upload-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.upload-zone {
  width: 100%;
  max-width: 400px;
  padding: 48px 32px;
  border: 2px dashed var(--color-gray-300);
  border-radius: var(--radius-lg);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-gray-400);
}
.upload-zone:hover,
.upload-zone.dragover {
  border-color: var(--color-primary-400);
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}
.upload-main { font-size: 15px; font-weight: 500; margin-top: 16px; }
.upload-hint { font-size: 12px; margin-top: 6px; }
.upload-warn { color: var(--color-gray-400); font-style: italic; }

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 14px;
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-primary-700);
}
.file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.file-size { color: var(--color-primary-400); font-size: 12px; white-space: nowrap; }
.file-remove {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--color-primary-400);
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.file-remove:hover { color: var(--color-error); }

.panel-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-gray-200);
  background: #fff;
}

/* ========== 预估信息条 ========== */
.estimate-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: var(--color-primary-50);
  border-top: 1px solid var(--color-primary-100);
  font-size: 12px;
  color: var(--color-primary-600);
  flex-wrap: wrap;
}
.estimate-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ========== AI 状态条 ========== */
.ai-selector-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid var(--color-gray-100);
  background: var(--color-gray-50);
}
.ai-selector-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.ai-provider-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-gray-700);
  white-space: nowrap;
}

.ai-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}
.ai-status-badge.ready {
  background: #F0FDF4;
  color: #166534;
  border: 1px solid #BBF7D0;
}
.ai-status-badge.need-key {
  background: #FFFBEB;
  color: #92400E;
  border: 1px solid #FDE68A;
}
.ai-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ai-status-badge.ready .ai-dot { background: #22C55E; }
.ai-status-badge.need-key .ai-dot { background: #F59E0B; }

.btn-ai-config {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #fff;
  border: 1.5px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-gray-600);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.btn-ai-config:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-300);
  color: var(--color-primary-600);
}

.convert-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
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
.convert-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-hover);
}
.convert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 10px 20px;
  background: #fff;
  color: var(--color-error);
  border: 1.5px solid var(--color-error);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover { background: rgba(239,68,68,0.05); }

.btn-text {
  background: none;
  border: none;
  color: var(--color-gray-500);
  font-size: 13px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  transition: all 0.15s;
}
.btn-text:hover { color: var(--color-gray-700); background: var(--color-gray-100); }

/* ========== 输出区 ========== */
.output-actions { display: flex; gap: 6px; }
.btn-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-gray-500);
  transition: all 0.15s;
}
.btn-icon:hover { color: var(--color-primary-600); border-color: var(--color-primary-300); }

.yaml-body {
  padding: 20px;
  background: #1E1B4B;
  min-height: 400px;
}
.yaml-body pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.8;
  color: #93C5FD;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: keep-all;
}

.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 400px;
  color: var(--color-gray-400);
  font-size: 14px;
  text-align: center;
  gap: 8px;
}
.empty-state .hint { font-size: 12px; color: var(--color-gray-300); }

/* ========== 预览模式 ========== */
.preview-body { padding: 20px; background: #fff; }
.preview-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.stat-item {
  padding: 6px 14px;
  background: var(--color-primary-50);
  border-radius: var(--radius-full);
  font-size: 13px;
  color: var(--color-primary-600);
}
.stat-item strong { font-weight: 700; }
.preview-scenes { display: flex; flex-direction: column; gap: 20px; }
.scene-card {
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.scene-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}
.scene-loc { font-size: 13px; font-weight: 600; color: var(--color-gray-800); }
.scene-time { font-size: 12px; color: var(--color-gray-400); }
.scene-dialogues { padding: 12px 16px; }
.dl-line {
  padding: 6px 0;
  border-bottom: 1px solid var(--color-gray-50);
  font-size: 14px;
  line-height: 1.6;
}
.dl-speaker {
  font-weight: 600;
  color: var(--color-primary-600);
  margin-right: 8px;
}
.dl-line-text { color: var(--color-gray-800); }
.dl-action {
  display: block;
  font-size: 12px;
  color: var(--color-gray-400);
  font-style: italic;
  margin-top: 2px;
}

/* ========== 警告面板 ========== */
.warnings-panel {
  padding: 12px 16px;
  background: #FFFBEB;
  border-top: 1px solid #FDE68A;
}
.warnings-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #92400E;
  margin-bottom: 8px;
}
.warnings-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #92400E;
  line-height: 1.6;
}
.warnings-list li + li {
  margin-top: 4px;
}

/* ========== 进度条 v2 ========== */
.convert-progress {
  padding: 20px 16px;
  border-top: 1px solid var(--color-gray-200);
  background: #fff;
}
.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.progress-bar-track {
  flex: 1;
  height: 6px;
  background: var(--color-gray-100);
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.progress-bar-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary-600);
  font-family: var(--font-mono);
  min-width: 36px;
  text-align: right;
}

.chunk-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.chunk-label {
  font-size: 12px;
  color: var(--color-gray-400);
}
.chunk-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary-600);
  font-family: var(--font-mono);
}

.progress-message {
  text-align: center;
  font-size: 13px;
  color: var(--color-gray-500);
  font-family: var(--font-mono);
}

/* ========== 响应式 ========== */
@media (max-width: 900px) {
  .convert-workspace {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .input-textarea { min-height: 280px; }
  .yaml-body { min-height: 320px; }
  .convert-page { padding: 84px 16px 32px; }
}
</style>
