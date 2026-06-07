<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="demo-overlay" @click.self="close">
        <div class="demo-modal">
          <!-- 头部 -->
          <div class="demo-header">
            <h2>30 秒演示：小说 → 结构化剧本</h2>
            <button class="demo-close" @click="close" aria-label="关闭">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- 演示主体 -->
          <div class="demo-body">
            <!-- 左侧：输入 -->
            <div class="demo-panel demo-input-panel">
              <div class="panel-bar">
                <span class="panel-dot red"></span>
                <span class="panel-dot yellow"></span>
                <span class="panel-dot green"></span>
                <span class="panel-label">输入：小说文本</span>
              </div>
              <div class="demo-input-content">
                <p v-for="(line, i) in visibleInputLines" :key="i" class="input-line">
                  {{ line }}<span v-if="i === visibleInputLines.length - 1 && isTyping" class="cursor-blink">|</span>
                </p>
              </div>
            </div>

            <!-- 中间箭头 -->
            <div class="demo-arrow">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>

            <!-- 右侧：输出 -->
            <div class="demo-panel demo-output-panel">
              <div class="panel-bar">
                <span class="panel-dot red"></span>
                <span class="panel-dot yellow"></span>
                <span class="panel-dot green"></span>
                <span class="panel-label">输出：YAML 结构化剧本</span>
              </div>
              <pre class="demo-output-content"><code v-html="visibleOutputHtml"></code><span v-if="isTypingOutput" class="cursor-blink">|</span></pre>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="demo-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <span class="progress-text">{{ currentPhaseLabel }}</span>
          </div>

          <!-- 底部 CTA -->
          <div class="demo-footer">
            <p class="demo-stat">内测招募中，前 100 名免费使用 3 个月</p>
            <router-link to="/convert" class="btn-primary" @click="close">立即免费试用</router-link>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const inputLines = [
  '苏晚推开办公室的门，',
  '看见顾寒正站在落地窗前。',
  '"你怎么来了？"他头也不回。',
  '"合同的事。"苏晚把文件拍在桌上。',
  '他终于转过身，目光微冷：',
  '"这就是你想要的？"',
  '"不，这是你想要的。"',
  '苏晚的声音出奇地平静。'
]

const outputLines = [
  'script:',
  '  meta:',
  '    title: "深夜办公室"',
  '    format: "竖屏短剧"',
  '    generated_at: "2026-06-06"',
  '  acts:',
  '    - act: 1',
  '      scenes:',
  '        - scene:',
  '            location: "室内·总裁办公室"',
  '            time: "夜"',
  '            characters: [苏晚, 顾寒]',
  '            dialogues:',
  '              - speaker: "顾寒"',
  '                line: "你怎么来了？"',
  '                action: "头也不回"',
  '              - speaker: "苏晚"',
  '                line: "合同的事。"',
  '                action: "把文件拍在桌上"',
  '              - speaker: "顾寒"',
  '                line: "这就是你想要的？"',
  '                action: "转过身，目光微冷"',
  '              - speaker: "苏晚"',
  '                line: "不，这是你想要的。"',
  '                action: "声音平静"'
]

const phases = [
  { label: '正在解析文本结构…', startTime: 0, inputLines: 3, outputLines: 0 },
  { label: '识别角色：苏晚、顾寒…', startTime: 5, inputLines: 5, outputLines: 3 },
  { label: '正在生成对白和场景…', startTime: 10, inputLines: 7, outputLines: 10 },
  { label: '生成 YAML 结构化输出…', startTime: 16, inputLines: 8, outputLines: 22 },
  { label: '转换完成！', startTime: 24, inputLines: 8, outputLines: 26 }
]

const currentTime = ref(0)
const isTyping = ref(true)
const isTypingOutput = ref(true)
let timer = null
let startTimestamp = null

const visibleInputLines = computed(() => {
  const phase = getCurrentPhase()
  return inputLines.slice(0, phase.inputLines)
})

const visibleOutputHtml = computed(() => {
  const phase = getCurrentPhase()
  const lines = outputLines.slice(0, phase.outputLines)
  return highlightYamlLines(lines).join('\n')
})

const progressPercent = computed(() => {
  return Math.min(100, Math.round((currentTime.value / 28) * 100))
})

const currentPhaseLabel = computed(() => {
  const phase = getCurrentPhase()
  return phase.label
})

function getCurrentPhase() {
  for (let i = phases.length - 1; i >= 0; i--) {
    if (currentTime.value >= phases[i].startTime) return phases[i]
  }
  return phases[0]
}

function highlightYamlLines(lines) {
  return lines.map(line => {
    // 注释
    if (/^\s*#/.test(line)) {
      return `<span class="yc">${esc(line)}</span>`
    }
    // key: value
    const match = line.match(/^(\s*)([\w\u4e00-\u9fff]+)(:)(\s*)(.*)/)
    if (match) {
      const [, indent, key, colon, space, value] = match
      let valHtml = ''
      if (value.startsWith('"') && value.endsWith('"')) {
        valHtml = `<span class="yv">${esc(value)}</span>`
      } else if (value.startsWith('[') && value.endsWith(']')) {
        valHtml = `<span class="yd">${esc(value)}</span>`
      } else if (value) {
        valHtml = `<span class="yv">${esc(value)}</span>`
      }
      return `${indent}<span class="yk">${esc(key)}</span><span class="yc">${colon}</span>${space}${valHtml}`
    }
    // 列表项
    if (/^\s*-/.test(line)) {
      return line.replace(/^(\s*)(-)/, '$1<span class="yd">$2</span>')
    }
    return esc(line)
  })
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function startAnimation() {
  startTimestamp = Date.now()
  currentTime.value = 0
  isTyping.value = true
  isTypingOutput.value = true
  tick()
}

function tick() {
  const elapsed = (Date.now() - startTimestamp) / 1000
  currentTime.value = Math.min(28, elapsed)

  // 打字完成后停止光标闪烁
  if (currentTime.value >= 24) {
    isTyping.value = false
  }
  if (currentTime.value >= 27) {
    isTypingOutput.value = false
  }

  if (currentTime.value < 28) {
    timer = requestAnimationFrame(tick)
  }
}

function close() {
  cancelAnimationFrame(timer)
  emit('close')
}

watch(() => props.visible, (v) => {
  if (v) {
    startAnimation()
  } else {
    cancelAnimationFrame(timer)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(timer)
})
</script>

<style scoped>
/* 遮罩 */
.demo-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* 模态窗口 */
.demo-modal {
  width: 100%;
  max-width: 960px;
  max-height: 90vh;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
}

/* 头部 */
.demo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-gray-200);
}
.demo-header h2 {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-gray-900);
}
.demo-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-100);
  border: none;
  border-radius: 8px;
  color: var(--color-gray-500);
  cursor: pointer;
  transition: all 0.15s;
}
.demo-close:hover {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}

/* 主体 */
.demo-body {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  padding: 20px;
  flex: 1;
  min-height: 0;
}

.demo-panel {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.panel-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--color-gray-100);
  border-bottom: 1px solid var(--color-gray-200);
}
.panel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.panel-dot.red { background: #EF4444; }
.panel-dot.yellow { background: #F59E0B; }
.panel-dot.green { background: #10B981; }
.panel-label {
  margin-left: 6px;
  font-size: 11px;
  color: var(--color-gray-500);
  font-family: var(--font-mono);
}

/* 输入面板 */
.demo-input-panel {
  background: #fff;
}
.demo-input-content {
  padding: 16px;
  flex: 1;
  font-size: 14px;
  line-height: 2;
  color: var(--color-gray-700);
  overflow-y: auto;
}
.input-line {
  margin: 0;
  white-space: pre-wrap;
}

/* 输出面板 */
.demo-output-panel {
  background: #1E1B4B;
}
.demo-output-content {
  padding: 16px;
  flex: 1;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.9;
  color: #93C5FD;
  white-space: pre-wrap;
  overflow-y: auto;
  margin: 0;
}

/* YAML 高亮 */
.yk { color: #C4B5FD; }
.yc { color: #64748B; font-style: italic; }
.yd { color: #F472B6; }
.yv { color: #93C5FD; }

/* 光标闪烁 */
.cursor-blink {
  animation: blink 0.8s infinite;
  color: #F472B6;
  font-weight: 700;
}
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 箭头 */
.demo-arrow {
  display: flex;
  align-items: center;
  color: var(--color-primary-400);
  flex-shrink: 0;
}

/* 进度条 */
.demo-progress {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}
.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--color-gray-200);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 2px;
  transition: width 0.3s linear;
}
.progress-text {
  font-size: 13px;
  color: var(--color-primary-600);
  font-weight: 500;
  white-space: nowrap;
}

/* 底部 */
.demo-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-gray-200);
  background: #fff;
}
.demo-stat {
  font-size: 14px;
  color: var(--color-gray-500);
  font-weight: 500;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 10px 28px;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: var(--shadow-primary);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-hover);
}

/* 过渡动画 */
.modal-fade-enter-active { transition: opacity 0.3s ease; }
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }

.modal-fade-enter-active .demo-modal { animation: modal-in 0.3s ease; }
.modal-fade-leave-active .demo-modal { animation: modal-out 0.2s ease; }

@keyframes modal-in {
  from { transform: scale(0.95) translateY(10px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes modal-out {
  from { transform: scale(1) translateY(0); opacity: 1; }
  to { transform: scale(0.95) translateY(10px); opacity: 0; }
}

/* 响应式 */
@media (max-width: 768px) {
  .demo-body {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .demo-arrow {
    transform: rotate(90deg);
    justify-content: center;
    padding: 0;
  }
  .demo-panel {
    min-height: 180px;
    max-height: 220px;
  }
  .demo-footer {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>
