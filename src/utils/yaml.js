/**
 * YAML 解析与生成工具函数
 * 处理小说转剧本的结构化数据
 */

/**
 * 将 YAML 文本解析为场景预览数组
 * @param {string} yamlText
 * @returns {Array<{location:string, time:string, characters:string[], dialogues:Array<{speaker:string, line:string, action?:string}>}>}
 */
export function parseYamlToScenes(yamlText) {
  if (!yamlText) return []

  try {
    const scenes = []
    // 匹配每个 scene 块
    const sceneRegex = /scene\s*:\s*\n([\s\S]*?)(?=\n\s*scene\s*:|$)/g
    let match

    while ((match = sceneRegex.exec(yamlText)) !== null) {
      const block = match[1]

      const location = extractYamlValue(block, 'location')
      const time = extractYamlValue(block, 'time')
      const characters = extractYamlArray(block, 'characters')

      // 提取 dialogues
      const dialogues = []
      const dlRegex = /-\s*speaker\s*:\s*"([^"]*)"[\s\S]*?line\s*:\s*"([^"]*)"/g
      const actionRegex = /action\s*:\s*"([^"]*)"/g

      let dlMatch
      let actionMatch
      const actions = [...block.matchAll(actionRegex)].map(m => m[1])

      let actionIdx = 0
      while ((dlMatch = dlRegex.exec(block)) !== null) {
        dialogues.push({
          speaker: dlMatch[1],
          line: dlMatch[2],
          action: actions[actionIdx] || undefined
        })
        actionIdx++
      }

      if (location || dialogues.length) {
        scenes.push({
          location: location || '未命名场景',
          time: time || '',
          characters: characters || [],
          dialogues
        })
      }
    }

    return scenes
  } catch {
    return []
  }
}

function extractYamlValue(text, key) {
  const regex = new RegExp(`${key}\\s*:\\s*"([^"]*)"`, 'm')
  const match = text.match(regex)
  return match ? match[1] : ''
}

function extractYamlArray(text, key) {
  const regex = new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`, 'm')
  const match = text.match(regex)
  if (match) {
    return match[1].split(',').map(s => s.trim().replace(/"/g, ''))
  }
  return []
}

/**
 * YAML 语法高亮（将 YAML 文本转为带 class 的 HTML）
 * @param {string} yamlText
 * @returns {string}
 */
export function highlightYaml(yamlText) {
  if (!yamlText) return ''

  // 先 HTML 转义，避免 XSS
  let html = yamlText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 用占位符保护已高亮的标签，避免后续正则误匹配
  const placeholders = []
  function save(tag) {
    placeholders.push(tag)
    return `\x00${placeholders.length - 1}\x00`
  }

  // 1. 先高亮字符串值（必须在 key 之前，避免 key 的正则干扰）
  html = html.replace(/"([^"]*)"/g, (match) => save(`<span class="yv">${match}</span>`))

  // 2. 高亮 YAML keys（含中文）
  html = html.replace(
    /^(\s*)([\w\u4e00-\u9fff][\w\u4e00-\u9fff\-]*\s*)(:)/gm,
    (match, p1, p2, p3) => `${p1}${save(`<span class="yk">${p2}</span>`)}${save(`<span class="yc">${p3}</span>`)}`
  )

  // 3. 高亮列表项
  html = html.replace(/^(\s*)(-)(\s)/gm, (match, p1, p2, p3) => `${p1}${save(`<span class="yd">${p2}</span>`)}${p3}`)

  // 4. 高亮注释
  html = html.replace(/#.*$/gm, (match) => save(`<span class="yc">${match}</span>`))

  // 5. 恢复占位符
  placeholders.forEach((tag, i) => {
    html = html.replace(new RegExp(`\\x00${i}\\x00`, 'g'), tag)
  })

  return html
}

/**
 * 从文件路径获取扩展名
 * @param {string} filename
 * @returns {string}
 */
export function getFileExtension(filename) {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * 验证文件是否可接受
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file) {
  const ext = getFileExtension(file.name)
  const allowedExts = ['txt', 'docx', 'doc']

  if (!allowedExts.includes(ext)) {
    return { valid: false, error: `不支持 .${ext} 格式，请上传 .txt 或 .docx 文件` }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: '文件大小不能超过 10MB' }
  }

  return { valid: true }
}
