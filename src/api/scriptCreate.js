/**
 * AI 剧本创作引擎 v1.0
 *
 * 核心功能：读取 YAML 结构化剧本 → AI 根据结构反向创作完整剧本文本
 *
 * 工作流：
 * 1. 解析 YAML 剧本（script → meta → acts → scenes → dialogues）
 * 2. 构建 AI 提示词（包含场景结构、角色信息、对白列表）
 * 3. 调用智谱 GLM API，逐幕生成剧本文本
 * 4. 流式输出，实时展示生成进度
 */

// ===== 常量 =====
/** 每次发给 AI 的最大 token 数（scene 级别） */
const MAX_SCENE_TOKENS = 1200

/** 风格定义表 */
export const SCRIPT_STYLES = [
  {
    id: 'modern',
    name: '现代都市',
    icon: '🏙️',
    desc: '白话流畅，节奏明快，适合都市短剧、职场恋爱',
    keywords: '语言简洁直白，节奏快，情绪饱满，多动作描写，少环境铺垫'
  },
  {
    id: 'literary',
    name: '文艺叙事',
    icon: '📖',
    desc: '有文学质感，叙事细腻，适合正剧、文艺片',
    keywords: '语言优美，情绪细腻，多内心描写，场景描写丰富，情节舒缓'
  },
  {
    id: 'ancient',
    name: '古风古典',
    icon: '🏮',
    desc: '文言半白话，古韵十足，适合古装剧、仙侠剧',
    keywords: '带古典文言色彩，称谓使用古代风格（公子/姑娘/大人），句式典雅'
  },
  {
    id: 'thriller',
    name: '悬疑惊悚',
    icon: '🌑',
    desc: '紧张压抑，反转强烈，适合悬疑剧、心理惊悚',
    keywords: '语言简短有力，情节充满悬念，多暗示和隐喻，营造紧张气氛，少废话'
  }
]

// ===== 轻量 YAML 解析器 =====
/**
 * 从 YAML 文本提取顶层键值（字符串）
 */
function extractYamlStr(yamlText, key) {
  const re = new RegExp(`^\\s*${key}\\s*:\\s*["\']?([^"\'\\n]+)["\']?`, 'm')
  const m = yamlText.match(re)
  return m ? m[1].trim() : ''
}

/**
 * 从 YAML 文本提取数字值
 */
function extractYamlNum(yamlText, key) {
  const v = extractYamlStr(yamlText, key)
  return v ? parseInt(v) : null
}

/**
 * 解析 YAML acts 数组（递归提取层级结构）
 * 使用缩进层级追踪解析策略
 */
function parseYamlStructure(yamlText) {
  const lines = yamlText.split('\n')
  const result = { meta: {}, acts: [] }

  let inMeta = false
  let inActs = false
  let currentAct = null
  let currentScene = null
  let inCharacters = false
  let inDialogues = false
  let currentDialogue = null
  let inAliases = false

  function getIndent(line) {
    return line.match(/^(\s*)/)?.[1]?.length || 0
  }

  function stripQuotes(s) {
    if (!s) return s
    return s.trim().replace(/^["']|["']$/g, '')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const indent = getIndent(line)

    if (!trimmed || trimmed.startsWith('#')) continue

    // 顶层键
    if (indent === 0) {
      if (trimmed === 'script:') continue
      if (trimmed.startsWith('meta:')) { inMeta = true; inActs = false; continue }
      if (trimmed.startsWith('acts:')) { inMeta = false; inActs = true; continue }
    }

    // meta 字段（indent <= 4）
    if (inMeta && indent >= 2 && indent <= 6 && !inActs) {
      const [k, ...vParts] = trimmed.split(':')
      const v = vParts.join(':').trim()
      if (k && v) {
        result.meta[k.trim()] = stripQuotes(v)
      }
      continue
    }

    // acts 数组项
    if (inActs) {
      // 新 act（以 - 开始，indent 为 2-4）
      if (trimmed.startsWith('- act_id:') || (trimmed.startsWith('-') && indent <= 4 && trimmed.includes('act_id'))) {
        currentAct = { act_id: null, act_title: '', scenes: [] }
        result.acts.push(currentAct)
        currentScene = null
        inCharacters = false
        inDialogues = false
        const idMatch = trimmed.match(/act_id\s*:\s*(\d+)/)
        if (idMatch) currentAct.act_id = parseInt(idMatch[1])
        continue
      }

      if (currentAct && !currentScene) {
        if (trimmed.startsWith('act_id:') || trimmed.startsWith('- act_id:')) {
          const m = trimmed.match(/act_id\s*:\s*(\d+)/)
          if (m) currentAct.act_id = parseInt(m[1])
          continue
        }
        if (trimmed.startsWith('act_title:')) {
          currentAct.act_title = stripQuotes(trimmed.replace('act_title:', '').trim())
          continue
        }
        if (trimmed === 'scenes:') continue
      }

      // 新 scene
      if (currentAct && (trimmed.startsWith('- scene_id:') || (trimmed.startsWith('-') && trimmed.includes('scene_id')))) {
        currentScene = { scene_id: null, location: '', time: '', mood: '', scene_note: '', characters: [], dialogues: [] }
        currentAct.scenes.push(currentScene)
        inCharacters = false
        inDialogues = false
        currentDialogue = null
        const idMatch = trimmed.match(/scene_id\s*:\s*(\d+)/)
        if (idMatch) currentScene.scene_id = parseInt(idMatch[1])
        continue
      }

      if (currentScene) {
        // characters 标记
        if (trimmed === 'characters:') { inCharacters = true; inDialogues = false; continue }
        // dialogues 标记
        if (trimmed === 'dialogues:') { inDialogues = true; inCharacters = false; continue }

        if (inCharacters) {
          if (trimmed === 'aliases:') { inAliases = true; continue }
          if (trimmed.startsWith('-') && trimmed.includes('name:')) {
            const char = { name: '', role: '角色', aliases: [] }
            currentScene.characters.push(char)
            const nameM = trimmed.match(/name\s*:\s*["']?([^"'\n]+)["']?/)
            if (nameM) char.name = nameM[1].trim()
            inAliases = false
            continue
          }
          if (trimmed.startsWith('- name:') || trimmed.startsWith('name:')) {
            const lastChar = currentScene.characters[currentScene.characters.length - 1]
            if (lastChar) {
              const m = trimmed.match(/name\s*:\s*["']?([^"'\n,]+)["']?/)
              if (m) lastChar.name = m[1].trim()
            }
            inAliases = false
            continue
          }
          if (trimmed.startsWith('role:')) {
            const lastChar = currentScene.characters[currentScene.characters.length - 1]
            if (lastChar) lastChar.role = stripQuotes(trimmed.replace('role:', '').trim())
            continue
          }
          if (inAliases && trimmed.startsWith('-')) {
            const lastChar = currentScene.characters[currentScene.characters.length - 1]
            if (lastChar) lastChar.aliases.push(stripQuotes(trimmed.replace('-', '').trim()))
            continue
          }
        }

        if (inDialogues) {
          if (trimmed.startsWith('- dialogue_id:') || (trimmed.startsWith('-') && trimmed.includes('dialogue_id'))) {
            currentDialogue = { dialogue_id: null, type: 'spoken', speaker: '', line: '', action: '', note: '' }
            currentScene.dialogues.push(currentDialogue)
            const idMatch = trimmed.match(/dialogue_id\s*:\s*(\d+)/)
            if (idMatch) currentDialogue.dialogue_id = parseInt(idMatch[1])
            continue
          }
          if (currentDialogue) {
            if (trimmed.startsWith('type:')) { currentDialogue.type = stripQuotes(trimmed.replace('type:', '').trim()); continue }
            if (trimmed.startsWith('speaker:')) { currentDialogue.speaker = stripQuotes(trimmed.replace('speaker:', '').trim()); continue }
            if (trimmed.startsWith('line:')) { currentDialogue.line = stripQuotes(trimmed.replace('line:', '').trim()); continue }
            if (trimmed.startsWith('action:')) { currentDialogue.action = stripQuotes(trimmed.replace('action:', '').trim()); continue }
            if (trimmed.startsWith('note:')) { currentDialogue.note = stripQuotes(trimmed.replace('note:', '').trim()); continue }
          }
        }

        // scene 字段
        if (!inCharacters && !inDialogues) {
          if (trimmed.startsWith('scene_id:')) { const m = trimmed.match(/scene_id\s*:\s*(\d+)/); if (m) currentScene.scene_id = parseInt(m[1]); continue }
          if (trimmed.startsWith('location:')) { currentScene.location = stripQuotes(trimmed.replace('location:', '').trim()); continue }
          if (trimmed.startsWith('time:')) { currentScene.time = stripQuotes(trimmed.replace('time:', '').trim()); continue }
          if (trimmed.startsWith('mood:')) { currentScene.mood = stripQuotes(trimmed.replace('mood:', '').trim()); continue }
          if (trimmed.startsWith('scene_note:')) { currentScene.scene_note = stripQuotes(trimmed.replace('scene_note:', '').trim()); continue }
        }
      }
    }
  }

  return result
}

// ===== 解析 YAML =====
/**
 * 解析 YAML 字符串，返回剧本结构
 * @param {string} yamlText
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function parseScriptYaml(yamlText) {
  try {
    if (!yamlText || typeof yamlText !== 'string') {
      return { ok: false, error: 'YAML 内容为空' }
    }

    const result = parseYamlStructure(yamlText)

    if (!result.acts || result.acts.length === 0) {
      return { ok: false, error: '未找到 acts 字段，请检查 YAML 格式是否正确（需包含 acts: 数组）' }
    }

    // 验证至少有一个 scene
    const hasScenes = result.acts.some(a => a.scenes && a.scenes.length > 0)
    if (!hasScenes) {
      return { ok: false, error: '未找到任何 scenes，请检查 YAML 格式' }
    }

    return { ok: true, data: result }
  } catch (e) {
    return { ok: false, error: `YAML 解析失败：${e.message}` }
  }
}

// ===== 构建 Prompt =====
/**
 * 为单个 scene 构建 AI 提示词
 */
function buildScenePrompt(scene, act, meta, style) {
  const styleObj = SCRIPT_STYLES.find(s => s.id === style) || SCRIPT_STYLES[0]

  const charLines = (scene.characters || []).map(c => {
    const aliases = c.aliases && c.aliases.length > 0
      ? `（别名：${c.aliases.join('/')}）`
      : ''
    return `  - ${c.name}（${c.role || '角色'}）${aliases}`
  }).join('\n')

  const dialogueLines = (scene.dialogues || []).map((d, i) => {
    const type = d.type === 'inner' ? '[内心]' : '[对白]'
    const action = d.action ? `（${d.action}）` : ''
    return `  ${i + 1}. ${type} ${d.speaker}：「${d.line}」${action}`
  }).join('\n')

  const sceneNote = scene.scene_note ? `场景备注：${scene.scene_note}` : ''

  return `请将以下【剧本结构】扩写为完整的中文剧本文本。

要求：
1. 风格：${styleObj.name}——${styleObj.keywords}
2. 必须保留所有对白内容（可适当润色）
3. 非对白段落（环境描写、动作、心理）按剧本格式输出
4. 输出格式：标准剧本格式，不要输出 YAML，不要输出编号，不要输出解释说明
5. 字数：300-600 字（不含对白引号）

【剧本结构】
幕次：第 ${act.act_id} 幕 · ${act.act_title || ''}
场景：${act.act_id}-${scene.scene_id}
地点：${scene.location || '未指定'}
时间：${scene.time || ''}
情绪：${scene.mood || ''}
${sceneNote}

出场角色：
${charLines || '  （无角色信息）'}

对白列表（按顺序展开）：
${dialogueLines || '  （无对白，仅场景描写）'}

——以下直接输出剧本正文——`
}

// ===== 系统 Prompt =====
const SYSTEM_PROMPT = `你是专业编剧，擅长将结构化剧本大纲扩写为完整剧本文本。
规则：
1. 直接输出剧本正文，不要输出JSON/YAML/代码块
2. 保持角色性格一致，对白要有个性
3. 场景描写简洁，动作描写具体
4. 中文标点规范，台词用「」括起来
5. 每个场景开头用【地点-时间】格式标注，例如：【室内·办公室-日】`

// ===== 主转换函数 =====
/**
 * 根据 YAML 剧本创作完整剧本文本
 */
export async function createScriptFromYaml({
  yamlText,
  style = 'modern',
  aiConfig,
  onProgress,
  onChunk,
  onSceneStart,
  signal
}) {
  // 1. 解析 YAML
  const parsed = parseScriptYaml(yamlText)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error }
  }

  const scriptData = parsed.data
  const meta = scriptData.meta || {}
  const acts = scriptData.acts || []

  // 2. 收集所有 scene
  const allScenes = []
  for (const act of acts) {
    for (const scene of (act.scenes || [])) {
      allScenes.push({ scene, act })
    }
  }

  if (allScenes.length === 0) {
    return { ok: false, error: 'YAML 中没有找到任何场景（scenes），请检查格式' }
  }

  const total = allScenes.length
  let fullScript = ''

  // 标题行
  const title = meta.title || '未命名剧本'
  fullScript += `# ${title}\n`
  if (meta.format) fullScript += `格式：${meta.format}\n`
  fullScript += '\n---\n\n'

  // 3. 逐 scene 调用 AI
  for (let i = 0; i < allScenes.length; i++) {
    const { scene, act } = allScenes[i]

    const sceneName = `第${act.act_id}幕 / 场景${scene.scene_id}`
    onProgress?.(i, total, `正在创作：${sceneName}`)
    onSceneStart?.(sceneName)

    // 新一幕标题
    if (scene.scene_id === 1 || allScenes[i - 1]?.act.act_id !== act.act_id) {
      const actTitle = `第 ${act.act_id} 幕${act.act_title ? ' · ' + act.act_title : ''}`
      fullScript += `\n\n## ${actTitle}\n\n`
    }

    // 场景标题
    fullScript += `### 场景 ${act.act_id}-${scene.scene_id}`
    if (scene.location) fullScript += `｜${scene.location}`
    if (scene.time) fullScript += `·${scene.time}`
    fullScript += '\n\n'

    // 无对白场景（纯旁白）
    if (!scene.dialogues || scene.dialogues.length === 0) {
      const sceneContent = scene.scene_note || `【${scene.location || '场景'}·${scene.time || ''}】\n（场景过渡）`
      fullScript += sceneContent + '\n\n'
      onChunk?.(sceneContent + '\n\n')
      onProgress?.(i + 1, total, `完成：${sceneName}`)
      continue
    }

    // 检查 AI 配置
    if (!aiConfig?.apiKey) {
      const fallback = fallbackExpandScene(scene, act, style)
      fullScript += fallback
      onChunk?.(fallback)
      onProgress?.(i + 1, total, `完成：${sceneName}（规则模式）`)
      continue
    }

    // 调用 AI
    const userPrompt = buildScenePrompt(scene, act, meta, style)
    let sceneText = ''

    try {
      const response = await fetch(aiConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.apiModel || 'glm-4.7-flash',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: MAX_SCENE_TOKENS,
          stream: true,
          temperature: 0.85
        }),
        signal
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        throw new Error(`API 错误 ${response.status}：${errText.slice(0, 100)}`)
      }

      // 读取流式响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue

          try {
            const json = JSON.parse(trimmed.slice(6))
            const delta = json.choices?.[0]?.delta?.content || ''
            if (delta) {
              sceneText += delta
              onChunk?.(delta)
            }
          } catch {}
        }
      }

      fullScript += sceneText.trim() + '\n\n'

    } catch (e) {
      if (e.name === 'AbortError') {
        return { ok: false, error: '已取消', cancelled: true }
      }
      console.warn(`场景 ${sceneName} AI 失败，降级到规则模式：`, e.message)
      const fallback = fallbackExpandScene(scene, act, style)
      fullScript += fallback
      onChunk?.(`\n[规则模式] ${fallback}`)
    }

    onProgress?.(i + 1, total, `完成：${sceneName}`)
  }

  fullScript += '\n\n---\n_由 幕启 MuQi · AI 创作引擎生成_\n'

  return { ok: true, text: fullScript }
}

// ===== 规则模式兜底 =====
function fallbackExpandScene(scene, act, style) {
  const location = scene.location || '场景'
  const time = scene.time || ''
  let text = `【${location}${time ? '·' + time : ''}】\n\n`

  if (scene.scene_note) {
    text += `${scene.scene_note}\n\n`
  }

  for (const d of (scene.dialogues || [])) {
    if (d.type === 'inner') {
      text += `${d.speaker}心里想：${d.line}\n\n`
    } else {
      const action = d.action ? `（${d.action}）` : ''
      text += `${d.speaker}${action}：「${d.line}」\n\n`
    }
  }

  return text
}

// ===== 统计信息 =====
export function getScriptStats(scriptData) {
  const acts = scriptData.acts || []
  let sceneCount = 0
  let dialogueCount = 0
  const charSet = new Set()

  for (const act of acts) {
    for (const scene of (act.scenes || [])) {
      sceneCount++
      for (const c of (scene.characters || [])) {
        if (c.name) charSet.add(c.name)
      }
      dialogueCount += (scene.dialogues || []).length
    }
  }

  return {
    actCount: acts.length,
    sceneCount,
    dialogueCount,
    characterCount: charSet.size,
    characters: [...charSet]
  }
}
