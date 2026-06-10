/**
 * 幕启 MuQi 转换引擎 v2.0
 *
 * 核心优化：
 * 1. 智能分段 — 按段落边界切分，不硬截断句子
 * 2. 并行+重试 — 2路并发 + 指数退避（最多3次）
 * 3. 失败降级 — 单段AI失败时自动走正则兜底，不阻塞整体
 * 4. 动态 max_tokens — 根据输入大小自适应，避免对白密集段截断
 * 5. YAML 校验修复 — 自动修复常见格式问题
 * 6. 输入预处理 — 过滤纯描写段、检测章节标题
 * 7. 预估提示 — 返回字数/分段数/预计耗时
 */

import { readFile } from '@/utils/file'

// ============================================================
// 常量配置
// ============================================================

/** 每段最大字符数（中文），会在最近段落边界切分（v3.1 提高以支持更完整章节） */
const AI_CHUNK_SIZE = 3000

/** 最大并发 AI 请求数 */
const MAX_CONCURRENT = 2

/** 最大重试次数 */
const MAX_RETRIES = 3

/** 重试基础延迟（毫秒），指数退避：delay * 2^retry */
const RETRY_BASE_DELAY = 1000

/** 输入字数"建议"阈值：超过提醒用户（v3.1 提高至5万字，因多章节分段优化） */
const WARN_INPUT_LENGTH = 50000

/** 输入字数"强制"阈值：超过拒绝处理（v3.1 提高至20万字，覆盖大多数网络小说章节） */
const CRITICAL_INPUT_LENGTH = 200000

/** 单段输入超过此值增大 max_tokens */
const DENSE_CHUNK_THRESHOLD = 1200

/** 默认输出 token 数 */
const DEFAULT_MAX_TOKENS = 2048

/** 对白密集段输出 token 数 */
const DENSE_MAX_TOKENS = 4096

/** AI 请求超时（毫秒） */
const AI_TIMEOUT = 60000

// ============================================================
// 【v2.1 新增】内容质量规则配置
// ============================================================

/**
 * 旁白/叙述碎片黑名单关键词库（v3.0 大幅扩充）
 * 命中即禁止作为 speaker 或 character
 */
const NARRATIVE_KEYWORDS = [
  // ===== 【截图中出现的BUG词】=====
  // 代词+动词/助词碎片（他曾/我却/她被/我被/却被）
  '他曾', '他曾说', '他曾想', '他曾被', '他曾见过',
  '她却', '她却说', '她却想', '她却笑',
  '他被', '他被困', '他被锁', '他被关', '他被抓', '他被杀',
  '她被困', '她被困在', '她被锁', '她被关',
  '我被', '我被困', '我被困在', '我被锁', '我被他', '我被她',
  '却被', '却被困', '却被锁', '却被他', '却被她', '却被一',
  '就被', '就被困', '就被锁', '就被他', '就被她',
  '也被', '也被困', '也被锁', '也被他', '也被她',
  '不被', '不被困', '不被理解',
  '将被', '将被困', '将被锁', '将被他',
  '就会被', '就会被困', '就不会', '也不能',
  '你很', '你很美', '你很漂亮',
  '你不', '你不会', '你不懂', '你不知道',
  '我就不', '你就不', '他就不', '她就不',
  '跟他', '跟他一起', '跟她', '跟她一起',
  '和他', '和她', '与他和', '与她的',
  '被他', '被她', '被他杀', '被她打',
  '让他', '让她', '让他们', '让她走',
  '让我', '让我看看', '让我来',
  '给你', '给你钱', '给他', '给她',
  '没人', '没人知道', '没人能',

  // ===== 感知类旁白 =====
  '只听', '只听人', '只听身后', '只听门外', '只听远处',
  '只听一声', '只听一阵', '只听有人', '只听那',
  '只看见', '只看到', '只听得', '只感到',

  // ===== 方位类旁白 =====
  '门外', '门外人', '门外传来', '门内', '门外响起',
  '深处', '深处传来', '深处响起', '深处走出',
  '入口', '入口处', '出口', '拐角', '转角',
  '身后', '身后传来', '身后响起', '身后人',
  '远处', '远处传来', '远处望去',

  // ===== 动作残留 =====
  '人口头', '人口头一', '人口头一笑', '处跟', '处跟同学',
  '过吴辰', '过吴辰所', '过吴辰知', '过吴辰的',
  '殊人', '殊人口', '殊人口中', '殊人眼中',

  // ===== 状态类碎片 =====
  '不知', '就不', '就没', '就不知', '就不由',
  '也不再', '也不能', '也不知', '也不知是', '也不知该', '也不知从',
  '忽然', '猛然', '突然', '骤然', '陡然',
  '渐渐', '顿时', '立刻', '马上',

  // ===== 语气词残留 =====
  '深处的呐', '深处的', '心底的', '心底',
  '摇了摇头', '摆了摆手', '叹了口气', '笑了笑',

  // ===== 通用虚词 =====
  '已经', '曾经', '正在', '将要', '终于',
  '所以', '但是', '然后', '于是', '不过', '虽然', '因为',
  '可是', '然而', '只是', '当然', '果然', '竟然', '居然',
  '一直', '不再', '还会', '也会', '不会', '会是',
]

/**
 * 旁白黑名单正则（v3.0 大幅扩充 — 互补关键词黑名单）
 */
const NARRATIVE_PATTERNS = [
  // ===== 代词+单字组合（"他X"、"我X"、"你X"等2-3字）=====
  /^[他她我你它]曾是?$/,
  /^[他她我你它]说过?$/,
  /^[他她我你它]问过?$/,
  /^[他她我你它]走了?$/,
  /^[他她我你它]来到?$/,
  /^[他她我你它]看到?$/,
  /^[他她我你它]听到?$/,
  /^[他她我你它]感到?$/,
  /^[他她我你它]觉得?$/,
  /^[他她我你它]想到?$/,
  /^[他她我你它]知道?$/,
  /^[他她我你它]就会?$/,
  /^[他她我你它]就去?$/,
  /^[他她我你它]就要?$/,
  /^[他她我你它]就被?$/,
  /^[他她我你它]就被?$/,
  /^[他她我你它]想要?$/,
  /^[他她我你它]就会?$/,
  /^[他她我你它]不会?$/,
  /^[他她我你它]还是?$/,
  /^[他她我你它]还没?$/,
  /^[他她我你它]已被?$/,
  /^[他她我你它]将.色?$/,
  /^[他她我你它]在.$/,

  // ===== "被/将/就/却/也/还" + 动词组合（缺少主语的碎片）=====
  /^被困(?:在|于|住|了)?$/,
  /^被锁(?:在|于|住|了)?$/,
  /^被关(?:在|于|住|了)?$/,
  /^被杀(?:在|于)?$/,
  /^被打(?:在|于)?$/,
  /^被绑(?:在|于|住)?$/,
  /^将被(?:困|锁|关|杀|打|绑)?$/,
  /^就被(?:困|锁|关|杀|打|绑)?$/,
  /^却被(?:困|锁|关|杀|打|绑)?$/,
  /^也被(?:困|锁|关|杀|打|绑)?$/,
  /^不被(?:困|锁|关|杀|打|绑)?$/,

  // ===== 已有模式 =====
  /^只听.{0,3}$/,
  /^门外.{0,3}$/,
  /^深处.{0,3}$/,
  /^人口头.*/,
  /^处跟.*/,
  /^过吴辰.*/,
  /^殊人.*/,
  /^不知$/, /^就不$/, /^就没$/,
  /^.{0,2}的呐$/,
  /^.{0,2}口中$/,
  /^.{0,2}眼中$/,
]

/**
 * 角色别名映射字典
 * 同一人物的所有变体统一归为标准名
 */
const CHARACTER_ALIASES = {
  // 吴辰 —— 主角（来自截图样例）
  '吴辰所': '吴辰',
  '吴辰知': '吴辰',
  '过吴辰所': '吴辰',
  '过吴辰知': '吴辰',
  '过吴辰': '吴辰',
  '吴辰的': '吴辰',
  '吴辰道': '吴辰',
  '吴辰说': '吴辰',
  '吴辰问': '吴辰',
  '吴辰答': '吴辰',
  // 吴辰心理活动变体
  '吴辰心里': '吴辰',
  '吴辰内心': '吴辰',
  '吴辰心底': '吴辰',
  '吴辰脑海中': '吴辰',
  '吴辰的脑海': '吴辰',
  '吴辰心念': '吴辰',
}

/**
 * 心理独白识别模式
 * 匹配 (角色名)(心里|内心|心底|脑海) 等
 */
const INNER_MONOLOGUE_PATTERNS = [
  /^(.{2,4})(?:心里|内心|心底|脑海|脑中|心念)$/,
  /^(.{2,4})的(?:心里|内心|心底|脑海)$/,
]

/**
 * 脏话/乱码过滤正则
 */
const PROFANITY_PATTERNS = [
  /[@#$%&*]{2,}/g,                    // 连续乱码符号
  /他妈的|你他妈|他妈|操你|傻逼|煞笔|草泥马|CNM|NM|卧槽|我操|日你|鸡巴|屁眼|他妈的/g,
  /tmd|nmd|wqnmlgb|sb|mdzz/gi,        // 拼音脏话
  /[\x00-\x08\x0B\x0C\x0E-\x1F]/g,   // 控制字符
]

// ============================================================
// 【v2.1 新增】内容质量处理函数
// ============================================================

/**
 * 检查是否为旁白关键词（精确匹配）
 */
function isNarrativeKeyword(name) {
  if (!name || typeof name !== 'string') return true
  const trimmed = name.trim()
  if (!trimmed || trimmed.length < 2) return true

  // 1. 精确黑名单
  if (NARRATIVE_KEYWORDS.includes(trimmed)) return true

  // 2. 正则黑名单
  for (const pattern of NARRATIVE_PATTERNS) {
    if (pattern.test(trimmed)) return true
  }

  // 3. 常见虚词结尾（单字动词/介词结尾且总长≤3）
  if (/^(?:这|那|是|他|她|它|我|你|您|谁|何|啥|怎|哪|有人|无人|不知|就不|就没)$/.test(trimmed)) return true

  return false
}

/**
 * 规范化角色名：别名映射 + 后缀去除
 * @returns {{standardName: string, isAlias: boolean, original: string}}
 */
function normalizeCharacterName(rawName) {
  if (!rawName) return { standardName: '', isAlias: false, original: rawName || '' }
  let name = rawName.trim()

  // 1. 精确别名映射
  if (CHARACTER_ALIASES[name]) {
    return { standardName: CHARACTER_ALIASES[name], isAlias: true, original: name }
  }

  // 2. 尝试去除常见动词/助词后缀，再映射
  const suffixes = ['所', '知', '道', '说', '问', '答', '的', '地', '得', '了', '着', '过']
  for (const suffix of suffixes) {
    if (name.endsWith(suffix) && name.length > 2) {
      const withoutSuffix = name.slice(0, -suffix.length)
      if (CHARACTER_ALIASES[withoutSuffix]) {
        return { standardName: CHARACTER_ALIASES[withoutSuffix], isAlias: true, original: name }
      }
      // 如果去除后缀后是有效人名，也接受
      if (isValidName(withoutSuffix)) {
        return { standardName: withoutSuffix, isAlias: true, original: name }
      }
    }
  }

  // 3. 尝试去除前缀（如"过吴辰" → "吴辰"）
  const prefixes = ['过', '在', '向', '对', '被', '让', '给', '跟', '和', '与']
  for (const prefix of prefixes) {
    if (name.startsWith(prefix) && name.length > 2) {
      const withoutPrefix = name.slice(prefix.length)
      if (CHARACTER_ALIASES[withoutPrefix]) {
        return { standardName: CHARACTER_ALIASES[withoutPrefix], isAlias: true, original: name }
      }
      if (isValidName(withoutPrefix)) {
        return { standardName: withoutPrefix, isAlias: true, original: name }
      }
    }
  }

  // 4. 子串匹配（如"吴辰心里" → "吴辰"）
  for (const [alias, standard] of Object.entries(CHARACTER_ALIASES)) {
    if (name.includes(alias) || alias.includes(name)) {
      return { standardName: standard, isAlias: true, original: name }
    }
  }

  return { standardName: name, isAlias: false, original: name }
}

/**
 * 识别心理独白
 * @returns {{isInner: boolean, standardName: string, innerAction: string} | null}
 */
function detectInnerMonologue(speaker, line) {
  if (!speaker) return null

  for (const pattern of INNER_MONOLOGUE_PATTERNS) {
    const match = speaker.match(pattern)
    if (match) {
      const baseName = match[1].trim()
      const normalized = normalizeCharacterName(baseName)
      return {
        isInner: true,
        standardName: normalized.standardName,
        innerAction: '内心独白',
        originalSpeaker: speaker
      }
    }
  }

  // 如果 speaker 本身就是别名映射中的心理活动变体
  if (CHARACTER_ALIASES[speaker]) {
    const isPsychoVariant = /(?:心里|内心|心底|脑海|脑中|心念)/.test(speaker)
    if (isPsychoVariant) {
      return {
        isInner: true,
        standardName: CHARACTER_ALIASES[speaker],
        innerAction: '内心独白',
        originalSpeaker: speaker
      }
    }
  }

  return null
}

/**
 * 脏话/乱码过滤
 */
function filterProfanity(text) {
  if (!text || typeof text !== 'string') return text || ''
  let cleaned = text
  for (const pattern of PROFANITY_PATTERNS) {
    cleaned = cleaned.replace(pattern, match => '█'.repeat(match.length))
  }
  return cleaned
}

/**
 * 角色列表后处理：黑名单过滤 + 别名合并
 * @returns {{names: string[], aliasMap: Map<string, Set<string>>}}
 */
function sanitizeCharacters(rawChars) {
  const result = []
  const aliasMap = new Map()  // 标准名 → Set(别名)

  for (const raw of rawChars) {
    if (!raw || typeof raw !== 'string') continue
    const trimmed = raw.trim()
    if (!trimmed) continue

    // 1. 旁白黑名单过滤
    if (isNarrativeKeyword(trimmed)) {
      continue
    }

    // 2. 别名映射 + 规范化
    const { standardName, isAlias, original } = normalizeCharacterName(trimmed)
    if (!standardName || isNarrativeKeyword(standardName)) {
      continue
    }

    // 3. 合并别名记录
    if (!aliasMap.has(standardName)) {
      aliasMap.set(standardName, new Set())
      result.push(standardName)
    }
    if (isAlias && original !== standardName) {
      aliasMap.get(standardName).add(original)
    }
  }

  return { names: result, aliasMap }
}

/**
 * 对话列表后处理：旁白过滤 + 心理独白识别 + 脏话过滤 + 别名映射
 * @returns {{dialogues: Array, narrations: string[]}}
 */
function sanitizeDialogues(rawDialogues) {
  const dialogues = []
  const narrations = []
  let dialogueId = 1

  for (const d of rawDialogues) {
    if (!d || !d.speaker) continue

    const speaker = d.speaker.trim()
    const line = (d.line || '').trim()
    if (!line) continue

    // 1. 旁白过滤：speaker 是旁白关键词
    if (isNarrativeKeyword(speaker)) {
      narrations.push(line)
      continue
    }

    // 2. 心理独白识别
    const innerDetect = detectInnerMonologue(speaker, line)
    if (innerDetect) {
      dialogues.push({
        dialogue_id: dialogueId++,
        type: 'inner',
        speaker: innerDetect.standardName,
        line: filterProfanity(line),
        action: innerDetect.innerAction,
        note: ''
      })
      continue
    }

    // 3. 普通对白：别名映射 + 脏话过滤
    const normalized = normalizeCharacterName(speaker)
    dialogues.push({
      dialogue_id: dialogueId++,
      type: d.type || 'spoken',
      speaker: normalized.standardName,
      line: filterProfanity(line),
      action: d.action || '',
      note: d.note || ''
    })
  }

  return { dialogues, narrations }
}

// ============================================================
// 公共入口
// ============================================================

/**
 * 预估转换成本
 * @param {string} text - 输入文本
 * @returns {{ length: number, chunks: number, estimatedSeconds: number, isLong: boolean, isTooLong: boolean }}
 */
export function estimateConversion(text) {
  const cleaned = preprocessText(text)
  const length = cleaned.length
  const chunks = Math.max(1, Math.ceil(length / AI_CHUNK_SIZE))
  // 每次 AI 调用约 3-5 秒，并发 2 路
  const estimatedSeconds = Math.ceil((chunks / MAX_CONCURRENT) * 4)

  return {
    length,
    chunks,
    estimatedSeconds,
    isLong: length > WARN_INPUT_LENGTH,
    isTooLong: length > CRITICAL_INPUT_LENGTH
  }
}

/**
 * 转换小说文本为结构化剧本（主入口）
 *
 * @param {Object} params
 * @param {string} [params.text] - 粘贴的文本内容
 * @param {File} [params.file] - 上传的文件
 * @param {Function} [params.onProgress] - 进度回调 (phase, detail)
 *   phase: 'init' | 'split' | 'processing' | 'merging' | 'done' | 'error'
 *   detail: { message, current, total, percent }
 * @param {AbortSignal} [params.signal] - 取消信号
 * @param {Object} [params.aiConfig] - AI 配置 { apiKey, apiUrl, model }
 * @returns {Promise<{yaml: string, stats: Object, warnings: string[]}>}
 */
export async function convertNovel({ text, file, onProgress, signal, aiConfig }) {
  // 1. 获取输入文本
  let inputText = text || ''
  if (file) {
    try {
      onProgress?.('init', { message: '正在读取文件…' })
      inputText = await readFile(file)
    } catch (err) {
      throw new Error(`文件读取失败：${err.message}`)
    }
  }

  if (!inputText?.trim()) {
    throw new Error('请输入小说文本或上传文件')
  }

  if (signal?.aborted) throw new DOMException('用户取消操作', 'AbortError')

  // 2. 输入长度校验
  const cleaned = preprocessText(inputText)
  if (cleaned.length > CRITICAL_INPUT_LENGTH) {
    throw new Error(
      `文本过长（${cleaned.length.toLocaleString()} 字），超过单次处理上限（${CRITICAL_INPUT_LENGTH.toLocaleString()} 字）。\n` +
      '建议：分批粘贴章节内容，每次处理 5-10 章。'
    )
  }

  const warnings = []
  if (cleaned.length > WARN_INPUT_LENGTH) {
    warnings.push(
      `文本较长（${cleaned.length.toLocaleString()} 字），预计需要 ${Math.ceil(cleaned.length / AI_CHUNK_SIZE)} 次 AI 调用，` +
      `约 ${Math.ceil((Math.ceil(cleaned.length / AI_CHUNK_SIZE) / MAX_CONCURRENT) * 5)} 秒。请耐心等待。`
    )
  }

  // 3. 分流：AI 模式 vs 正则模式
  const hasAI = aiConfig?.apiKey && aiConfig?.apiUrl && aiConfig?.model

  if (hasAI) {
    return aiConvert(cleaned, aiConfig, onProgress, signal, warnings)
  }

  return regexConvert(cleaned, onProgress, signal, warnings)
}

// ============================================================
// 文本预处理
// ============================================================

/**
 * 预处理输入文本
 * - 统一换行符
 * - 压缩连续空行
 * - 去除首尾空白
 * - 可选：标记章节边界
 */
function preprocessText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ============================================================
// AI 解析模式
// ============================================================

async function aiConvert(inputText, aiConfig, onProgress, signal, warnings) {
  onProgress?.('init', { message: '正在分析文本结构…' })

  // 1. 智能分段
  const chunks = smartSplitChunks(inputText, AI_CHUNK_SIZE)
  const totalChunks = chunks.length

  onProgress?.('split', {
    message: `文本已分为 ${totalChunks} 段，准备并行处理…`,
    total: totalChunks,
    percent: 5
  })

  if (totalChunks > 20) {
    warnings.push(`文本分为 ${totalChunks} 段，处理时间可能较长，建议分批处理。`)
  }

  // 2. 检测章节标题（用于 act 边界增强）
  const chapterTitles = detectChapterTitles(inputText)

  // 3. 并行处理所有分段（含重试+降级）
  const chunkResults = await processChunksParallel(
    chunks,
    aiConfig,
    totalChunks,
    onProgress,
    signal
  )

  if (signal?.aborted) throw new DOMException('用户取消操作', 'AbortError')

  // 4. 统计成功/失败/降级
  const successCount = chunkResults.filter(r => r.source === 'ai').length
  const fallbackCount = chunkResults.filter(r => r.source === 'regex').length
  const failCount = chunkResults.filter(r => r.source === 'failed').length

  if (failCount > 0) {
    warnings.push(`${failCount} 段处理失败，已跳过。`)
  }
  if (fallbackCount > 0) {
    warnings.push(`${fallbackCount} 段 AI 解析失败，已降级为规则解析。`)
  }

  // 5. 合并结果
  onProgress?.('merging', {
    message: '正在合并整理剧本结构…',
    percent: 90
  })

  const validResults = chunkResults.filter(r => r.source !== 'failed')
  if (validResults.length === 0) {
    throw new Error('所有分段处理均失败，请检查网络连接或 AI Key 后重试。')
  }

  const merged = mergeChunkResults(validResults, inputText, chapterTitles)

  onProgress?.('done', {
    message: `转换完成！${successCount} 段 AI 解析 + ${fallbackCount} 段规则兜底`,
    percent: 100
  })

  return { ...merged, warnings }
}

// ============================================================
// 智能分段
// ============================================================

/**
 * 按段落边界智能切分，优先在章节边界切分，避免在句子中间截断
 *
 * 【v3.1 多章节优化】：
 * - 先按章节标题切大块，再在每章内部按段落边界细切
 * - 确保每段开头的角色上下文完整
 */
function smartSplitChunks(text, maxSize) {
  // Step 0: 检测章节边界
  const chapterPattern = /(?:^|\n)(第[一二三四五六七八九十百千\d]+[章节回幕][^\n]*)/g
  let chapterSplits = [0]
  for (const m of text.matchAll(chapterPattern)) {
    chapterSplits.push(m.index)
  }
  chapterSplits.push(text.length)

  // 如果章节数 >= 3（多章节小说），优先在章节边界切分
  const chapterCount = chapterSplits.length - 1
  const useChapterBoundaries = chapterCount >= 3

  const chunks = []
  let currentChapterChunks = []

  for (let ci = 0; ci < chapterCount; ci++) {
    const start = chapterSplits[ci]
    const end = chapterSplits[ci + 1]
    let chapterText = text.slice(start, end).trim()
    if (!chapterText) continue

    // 在章节内按段落边界切分
    const paragraphs = chapterText.split(/\n\n+/)
    let current = ''
    let chapterStartLine = ''  // 章节标题行

    for (let pi = 0; pi < paragraphs.length; pi++) {
      const p = paragraphs[pi].trim()
      if (!p) continue

      // 如果当前段本身就很长（>maxSize），按句子边界再切
      if (p.length > maxSize) {
        // 先保存当前累积的内容
        if (current.trim()) {
          chunks.push(current.trim())
          current = ''
        }
        // 按句子边界切分长段落
        const subChunks = splitLongParagraph(p, maxSize)
        chunks.push(...subChunks)
        continue
      }

      // 检查是否是章节标题行（保留给 act_title 用）
      if (pi === 0 && chapterPattern && /^第[一二三四五六七八九十百千\d]+[章节回幕]/.test(p)) {
        chapterStartLine = p.slice(0, 40)
      }

      // 正常累积
      if (current.length + p.length > maxSize && current.length > 0) {
        chunks.push(current.trim())
        current = p
      } else {
        current += (current ? '\n\n' : '') + p
      }
    }

    if (current.trim()) {
      chunks.push(current.trim())
    }
  }

  // Fallback：如果没有章节边界或只有1-2章，回到原有逻辑
  if (!useChapterBoundaries || chunks.length === 0) {
    return legacySmartSplit(text, maxSize)
  }

  return chunks.length > 0 ? chunks : [text]
}

/**
 * 【保留】原有切分逻辑：按双换行（段落边界）切分（无章节检测）
 */
function legacySmartSplit(text, maxSize) {
  const paragraphs = text.split(/\n\n+/)
  const chunks = []
  let current = ''

  for (const p of paragraphs) {
    const trimmed = p.trim()
    if (!trimmed) continue

    if (trimmed.length > maxSize) {
      if (current.trim()) {
        chunks.push(current.trim())
        current = ''
      }
      const subChunks = splitLongParagraph(trimmed, maxSize)
      chunks.push(...subChunks)
      continue
    }

    if (current.length + trimmed.length > maxSize && current.length > 0) {
      chunks.push(current.trim())
      current = trimmed
    } else {
      current += (current ? '\n\n' : '') + trimmed
    }
  }

  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks.length > 0 ? chunks : [text]
}

/**
 * 将超长段落按句子边界切分
 */
function splitLongParagraph(text, maxSize) {
  // 按句号、问号、感叹号、省略号切分（中文标点）
  const sentences = text.split(/(?<=[。！？…\.!\?])/g)
  const chunks = []
  let current = ''

  for (const s of sentences) {
    if (current.length + s.length > maxSize && current.length > 0) {
      chunks.push(current.trim())
      current = s
    } else {
      current += s
    }
  }
  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks.length > 0 ? chunks : [text]
}

/**
 * 检测章节标题
 */
function detectChapterTitles(text) {
  const titles = []
  const patterns = [
    /^第[一二三四五六七八九十百千\d]+[章节回幕]\s*.+$/gm,
    /^[①②③④⑤⑥⑦⑧⑨⑩]\s*.+$/gm,
    /^Chapter\s+\d+.*$/gim
  ]
  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) titles.push(...matches)
  }
  return [...new Set(titles)].slice(0, 50)
}

// ============================================================
// 并行处理 + 重试 + 降级
// ============================================================

/**
 * 并发处理所有分段，每段支持重试和降级
 */
async function processChunksParallel(chunks, aiConfig, totalChunks, onProgress, signal) {
  const results = new Array(chunks.length)
  const completed = { count: 0 }

  // 构建任务队列
  const tasks = chunks.map((chunk, i) => ({
    index: i,
    chunk,
    previousCharacters: i === 0 ? null : []
  }))

  // 使用信号量控制并发
  const semaphore = new Array(MAX_CONCURRENT).fill(null)
  let taskIndex = 0

  async function worker() {
    while (taskIndex < tasks.length) {
      if (signal?.aborted) return

      const idx = taskIndex++
      const task = tasks[idx]

      // 更新已处理角色列表（动态）
      const prevResults = results.filter(r => r && r.source !== 'failed')
      const prevChars = prevResults.flatMap(r => r.characters || [])
      task.previousCharacters = [...new Set(prevChars)]

      // 处理单个分段（含重试和降级）
      results[idx] = await processSingleChunk(
        task.chunk,
        aiConfig,
        task.previousCharacters,
        idx,
        signal
      )

      completed.count++
      onProgress?.('processing', {
        message: `正在解析第 ${completed.count}/${totalChunks} 段…`,
        current: completed.count,
        total: totalChunks,
        percent: 10 + Math.round((completed.count / totalChunks) * 75)
      })
    }
  }

  // 启动并发 workers
  const workers = semaphore.map(() => worker())
  await Promise.all(workers)

  return results
}

/**
 * 处理单个分段：AI 解析 → 重试 → 降级
 */
async function processSingleChunk(chunk, aiConfig, previousCharacters, index, signal) {
  if (signal?.aborted) {
    return { source: 'failed', yaml: '', characters: [], stats: { characters: 0, scenes: 0, dialogues: 0 } }
  }

  // 尝试 AI 解析，带重试
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await aiParseChunk(chunk, aiConfig, previousCharacters, signal)

      // 校验结果质量
      const validation = validateChunkResult(result, chunk)
      if (validation.valid) {
        console.log(`✅ 分段 ${index + 1} AI 解析成功 (角色: ${result.characters.length}, 场景: ${result.stats.scenes}, 对话: ${result.stats.dialogues})`)
        return { ...result, source: 'ai' }
      }

      // 结果质量不合格，如果不是最后一次重试则重试
      console.warn(`❌ 分段 ${index + 1} AI 输出验证失败: ${validation.reason}`)
      console.log(`   输入长度: ${chunk.length} 字`)
      console.log(`   AI返回长度: ${result.yaml?.length || 0} 字`)
      if (result.yaml && result.yaml.length < 200) {
        console.log(`   AI返回内容预览: ${result.yaml.slice(0, 100)}...`)
      }

      if (attempt < MAX_RETRIES) {
        console.warn(`   第 ${attempt + 1} 次重试中...`)
        await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt), signal)
        continue
      }

      // 最后一次重试仍不合格，降级
      console.warn(`⚠️ 分段 ${index + 1} AI 解析失败，降级为规则解析`)
      return fallbackSingleChunk(chunk, index)
    } catch (err) {
      if (err.name === 'AbortError') throw err

      const isRetryable = isRetryableError(err)
      console.error(`❌ 分段 ${index + 1} AI 调用异常: ${err.message}`)
      console.log(`   可重试: ${isRetryable}, 当前重试次数: ${attempt + 1}`)

      if (isRetryable && attempt < MAX_RETRIES) {
        console.warn(`   等待 ${RETRY_BASE_DELAY * Math.pow(2, attempt)}ms 后重试...`)
        await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt), signal)
        continue
      }

      // 不可重试或重试次数耗尽，降级
      console.warn(`⚠️ 分段 ${index + 1} 网络/API错误，降级为规则解析`)
      return fallbackSingleChunk(chunk, index)
    }
  }

  // 所有重试耗尽
  return fallbackSingleChunk(chunk, index)
}

/**
 * 判断错误是否可重试
 */
function isRetryableError(err) {
  const message = (err.message || '').toLowerCase()
  // 可重试：网络错误、超时、服务端错误、频率限制
  if (message.includes('timeout') || message.includes('timed out')) return true
  if (message.includes('network') || message.includes('fetch')) return true
  if (message.includes('429') || message.includes('rate limit')) return true
  if (message.includes('500') || message.includes('502') || message.includes('503')) return true
  if (message.includes('econnrefused') || message.includes('enotfound')) return true
  // 不可重试：认证错误、参数错误、内容违规
  if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) return false
  if (message.includes('400') || message.includes('invalid')) return false
  if (message.includes('content') || message.includes('safety')) return false
  if (message.includes('exceeds max length')) return false
  // 默认可重试
  return true
}

// ============================================================
// AI 单段解析
// ============================================================

/**
 * 调用 AI 解析一段文本
 */
async function aiParseChunk(textChunk, aiConfig, previousCharacters, signal) {
  const systemPrompt = `你是专业剧本格式转换器，将小说片段转为竖屏短剧YAML。你的唯一任务是：从原文提取真实人物角色和引号内对话，输出规范YAML。禁止编造、禁止猜测、禁止把叙述文字当角色。

══════════════════════════════════════════
⚠️ 核心原则（违反任何一条 = 不合格输出）
══════════════════════════════════════════

【规则0：角色定义 — 什么人才能算"角色"】
✅ 合法的角色名：2-4字的中文人名，必须是小说中真实存在的、有姓名的人物
   - 例如：穆芊芊、吴辰、顾寒、苏晚、林晓雪、赵铁柱
   - 可以是全名(2-3字)、昵称(2字)、尊称(如"张总"、"李姐")
❌ 绝对禁止的"角色名"（出现即不合格）：
   ① 单字人名后缀：我曾、他被、你却、她会、我不、你就、被人、给他、让我、和你、跟他说（拆出来的碎片）
   ② 代词+动词碎片：被困、被困在、被困于、被困住、将被困、却被困、曾被、他曾、他曾说、她却、她却说、我就、我就不、你就不、他就不
   ③ 主语残缺碎片：人口头、处跟、殊人、不知、就不、就没、也不、也不再、也不知
   ④ 方位/感知词：只听、门外、深处、入口、拐角、远处、身后
   ⑤ 纯代词：他、她、你、我、它、他们、她们、我们、你们、自己、某人、有人、没人、谁
   ⑥ 语气词/虚词：忽然、猛然、突然、立刻、顿时、渐渐、一直、已经、曾经、正在

【规则1：角色抽取流程】
步骤A：通读原文，列出所有有姓名的真实人物（先写草稿）
步骤B：逐个检查草稿名单，用规则0过滤掉一切碎片词
步骤C：同一人物的别名统一 → characters[].aliases 记录所有别名
步骤D：心理活动变体（如"吴辰心里"）→ 不创建新角色，speaker仍写"吴辰"

【规则2：对话提取 — 精准匹配引号内容】
✅ 只有以下格式才是"对话"：
   A. 角色名+说："对话内容"  → 提取角色名和引号内内容
   B. "对话内容"角色名+说  → 同上
   C. 角色名+问道/答道/笑道/喝道/冷冷道："对话内容"
   D. "对话内容"  追问道/问道/笑道/冷冷道 角色名
   E. 连续两段引号对话没有明确说话人时，根据上下文推断（不能瞎编）

❌ 以下不是"对话"，不要提取：
   - 环境描写：酒吧灯光昏暗、空气中弥漫着...
   - 动作描写：她推开门、他站起身、他指着远处...
   - 心理描写：他想、她觉得、心里想、脑海中浮现...
   - 叙述性文字：小说叙述者的旁白
   - 作者备注

【规则3：旁白处理】
- 所有非引号内的叙述文字 → 提取关键氛围信息 → 放入scene_note（不超过80字）
- 不要为旁白文字创建角色
- 不要为旁白文字编造对话

【规则4：场景划分（多章节支持）】
- 一个连续的场景做一个scene
- 非连续场景（跳转地点/时间）→ 新scene
- 无对话场景 → 只保留scene框架，dialogues:[]
- 最少1个最多5个scene
- 【多章节对齐】如果原文包含章节标题（如"第一章""第二章"），每个章节独立作为一个act，act_title取章节标题（如"第一章 偶遇" → act_title: "偶遇"）
- 同一章内按场景切分：每章通常2-4个连续对话场景作为一个act
- 跨章必有act边界：两个连续章节绝对不在同一个act里

══════════════════════════════════════════
输出格式（严格YAML，以"script:"开头）：
══════════════════════════════════════════
script:
  meta:
    title: "原标题"
    source: "用户输入"
    format: "竖屏短剧"
    generated_at: "${new Date().toISOString()}"
    stats:
      characters: 0
      scenes: 0
      dialogues: 0
  acts:
    - act_id: 1
      act_title: "酒吧夜"
      scenes:
        - scene_id: 1
          location: "室内·酒吧"
          time: "夜"
          mood: "暧昧"
          scene_note: "灯光绚烂的酒吧角落，一男一女低声说笑"
          characters:
            - name: "穆芊芊"
              role: "女主"
              aliases: []
          dialogues:
            - dialogue_id: 1
              type: "spoken"
              speaker: "穆芊芊"
              line: "这是你追女孩子的手段？"
              action: "撇嘴醉笑"
              note: ""
            - dialogue_id: 2
              type: "spoken"
              speaker: "穆芊芊"
              line: "故事倒是蛮有趣的。"
              action: ""
              note: ""

══════════════════════════════════════════
字段说明：
- characters[].name: 必须是2-4字中国人名（全名/昵称）
- characters[].role: 主角/女主/男主/配角/龙套
- characters[].aliases: 原文中的其他叫法数组
- dialogues[].type: "spoken"(普通对白) | "inner"(内心独白)
- dialogues[].speaker: 必须等于characters中某个name
- dialogues[].line: 去掉引号的纯对话文本
- dialogues[].action: 说话时的动作描述
- scene_note: 场景氛围/旁白描述（可空）
- mood: 沉重/紧张/压抑/轻松/暧昧/激烈/平静

⚠️ 输出时只输出YAML，禁止任何解释文字！不要用\`\`\`yaml包裹！`

  // 构建用户 prompt
  let userPrompt
  if (previousCharacters && previousCharacters.length > 0) {
    // 去重过滤
    const knownChars = [...new Set(previousCharacters.filter(Boolean))]
    userPrompt = `【已知角色】${knownChars.slice(0, 10).join('、')}\n\n【原文】\n${textChunk}`
  } else {
    // 【v3.1】首次分段时检测章节边界，提示AI对齐act
    const chapterLines = [...textChunk.matchAll(/^(第[一二三四五六七八九十百千\d]+[章节回幕][^\n]*)/gm)]
    if (chapterLines.length > 0) {
      const chapters = chapterLines.map(m => m[1].trim()).slice(0, 5)
      userPrompt = `【章节结构】以下内容包含 ${chapters.length} 个章节：${chapters.join('、')}\n请每个章节作为独立 act，act_title 使用章节原标题（去除"第X章"编号前缀）。\n\n【原文】\n${textChunk}`
    } else {
      userPrompt = `【原文】\n${textChunk}`
    }
  }

  // 动态计算 max_tokens：对白密集段给更多输出空间
  const dialogueCount = (textChunk.match(/["\u201C\u300C].*?["\u201D\u300D]/g) || []).length
  const isDialogueDense = dialogueCount > 5 || textChunk.length > DENSE_CHUNK_THRESHOLD
  const maxTokens = isDialogueDense ? DENSE_MAX_TOKENS : DEFAULT_MAX_TOKENS

  // 发起请求
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT)

  // 合并外部取消信号
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  let response
  try {
    response = await fetch(aiConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      if (signal?.aborted) throw err
      throw new Error('AI 请求超时（60秒），请稍后重试')
    }
    throw new Error(`网络请求失败：${err.message}`)
  }
  clearTimeout(timeoutId)

  // 处理 HTTP 错误
  if (!response.ok) {
    const errText = await response.text().catch(() => '{}')
    let errMsg = `AI 调用失败 (HTTP ${response.status})`

    try {
      const errJson = JSON.parse(errText)
      errMsg = errJson.error?.message || errJson.message || errMsg
    } catch {}

    // 智谱特定错误映射
    if (response.status === 429) errMsg = 'AI 请求过于频繁，请稍等后重试'
    if (response.status === 401 || response.status === 403) errMsg = 'API Key 无效或已过期，请重新配置'
    if (response.status === 400 && errMsg.includes('length')) errMsg = '文本片段超长，已自动调整分段大小'
    if (response.status >= 500) errMsg = 'AI 服务暂时不可用，正在重试…'

    throw new Error(errMsg)
  }

  const data = await response.json()
  const aiContent = data.choices?.[0]?.message?.content || ''

  // 提取 YAML
  let yaml = extractYamlFromAIResponse(aiContent)

  // 修复常见 YAML 问题
  yaml = fixCommonYamlIssues(yaml)

  // 【v2.1】后处理：黑名单过滤 + 别名映射 + 心理独白识别 + 脏话过滤
  yaml = postProcessYamlString(yaml)

  // 提取统计信息
  const charNames = extractCharactersFromYaml(yaml)
  const sceneCount = (yaml.match(/^\s{8,}- scene:/gm) || []).length || (yaml.match(/\bscene\s*:/g) || []).length
  const outputDialogueCount = (yaml.match(/\bspeaker\s*:/g) || []).length

  return {
    yaml,
    characters: charNames,
    stats: {
      characters: charNames.length,
      scenes: sceneCount || 1,
      dialogues: outputDialogueCount
    }
  }
}

// ============================================================
// YAML 提取与修复 + 后处理
// ============================================================

/**
 * 【v2.1】YAML字符串后处理
 * 对AI输出的YAML进行：黑名单过滤、别名映射、心理独白识别、脏话过滤
 */
function postProcessYamlString(yaml) {
  if (!yaml || typeof yaml !== 'string') return yaml || ''

  let processed = yaml

  // 1. 提取所有对话块，逐条处理 speaker + line
  // 【v3.0】适配新格式：- dialogue_id: N\n  type: "xxx"\n  speaker: "xxx"\n  line: "xxx"
  // 匹配模式：从 "- dialogue_id:" 或 "- speaker:" 开始的整段对话
  const dialogueBlockPattern = /(?:- dialogue_id:\s*\d+\n)?(\s+)(?:type:\s*"([^"]+)"\n)?\1-?\s*speaker:\s*"([^"]*)"\n\1(?:-?\s*)?line:\s*"([^"]*)"(?:\n\1(?:-?\s*)?action:\s*"([^"]*)")?(?:\n\1(?:-?\s*)?note:\s*"([^"]*)")?/g

  processed = processed.replace(dialogueBlockPattern, (match, indent, rawType, rawSpeaker, rawLine, rawAction, rawNote) => {
    let type = (rawType || '').trim()
    let speaker = (rawSpeaker || '').trim()
    let line = (rawLine || '').trim()
    let action = (rawAction || '').trim()
    let note = (rawNote || '').trim()

    if (!speaker || !line) {
      // 无法解析，保留原样
      return match
    }

    // 1.1 旁白黑名单过滤
    if (isNarrativeKeyword(speaker)) {
      return `  # [旁白过滤] ${escapeYaml(speaker)}: ${escapeYaml(line.slice(0, 30))}\n`
    }

    // 1.2 心理独白识别
    const innerDetect = detectInnerMonologue(speaker, line)
    if (innerDetect) {
      type = 'inner'
      speaker = innerDetect.standardName
      action = action || innerDetect.innerAction
    } else {
      // 普通对白：别名映射 + 脏话过滤
      const normalized = normalizeCharacterName(speaker)
      speaker = normalized.standardName
      type = type || 'spoken'
    }
    line = filterProfanity(line)
    if (action) action = filterProfanity(action)

    // 重建对话块
    const idMatch = match.match(/dialogue_id:\s*(\d+)/)
    const dlgId = idMatch ? idMatch[1] : '1'
    const blockIndent = indent // 对话块内缩进级（12空格等）

    let rebuilt = `${blockIndent}- dialogue_id: ${dlgId}\n`
    rebuilt += `${blockIndent}  type: "${escapeYaml(type)}"\n`
    rebuilt += `${blockIndent}  speaker: "${escapeYaml(speaker)}"\n`
    rebuilt += `${blockIndent}  line: "${escapeYaml(line)}"\n`
    if (action) rebuilt += `${blockIndent}  action: "${escapeYaml(action)}"\n`
    rebuilt += `${blockIndent}  note: "${escapeYaml(note)}"\n`

    return rebuilt
  })

  // 2. 处理旧格式（无 type 字段、纯 "- speaker:/line:"）→ 补充 type: "spoken"
  processed = processed.replace(/^(\s+)(?!.*type:\s*")(-\s+speaker:\s*"([^"]+)")\n\1(\s+line:\s*"([^"]+)")/gm,
    (match, indent, speakerLine, speaker, lineIndent, line) => {
      if (isNarrativeKeyword(speaker)) {
        return `  # [旁白过滤] ${escapeYaml(speaker)}\n`
      }
      const normalized = normalizeCharacterName(speaker)
      return `${indent}- dialogue_id: 1\n${indent}  type: "spoken"\n${indent}  speaker: "${escapeYaml(normalized.standardName)}"\n${indent}  line: "${escapeYaml(filterProfanity(line))}"\n${indent}  note: ""\n`
    })

  // 3. 处理 characters 字段中的黑名单词汇
  // 匹配旧格式 characters: ["a", "b", "c"]
  processed = processed.replace(/characters:\s*\[([^\]]*)\]/g, (match, content) => {
    const names = content.split(/,\s*/).map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean)
    const sanitized = sanitizeCharacters(names)
    if (sanitized.names.length === 0) return 'characters:\n            - name: "角色"\n              role: "角色"\n'
    return `characters:\n${sanitized.names.map(n => {
      const aliases = sanitized.aliasMap.get(n)
      const aliasStr = aliases && aliases.size > 0 ? `\n              aliases: [${[...aliases].map(a => `"${escapeYaml(a)}"`).join(', ')}]` : ''
      return `            - name: "${escapeYaml(n)}"\n              role: "角色"${aliasStr}`
    }).join('\n')}`
  })

  // 4. 处理旧格式 characters: []
  processed = processed.replace(/(\s+)characters:\s*\[\s*\]/g, (match, indent) => {
    return `${indent}characters:\n${indent}            - name: "角色"\n${indent}              role: "角色"\n`
  })

  // 5. 清理多余的连续空行
  processed = processed.replace(/\n{4,}/g, '\n\n\n')

  return processed
}

/**
 * 从 AI 回复中提取 YAML 内容
 */
function extractYamlFromAIResponse(content) {
  if (!content) return ''

  // 1. 提取 ```yaml 或 ``` 代码块
  const codeBlock = content.match(/```(?:yaml)?\s*\n?([\s\S]*?)```/)
  if (codeBlock) {
    return codeBlock[1].trim()
  }

  // 2. 从 script: 开始提取
  const yamlStart = content.indexOf('script:')
  if (yamlStart >= 0) {
    let yaml = content.slice(yamlStart)
    // 截断到无缩进且非 YAML 关键字的行
    const lines = yaml.split('\n')
    const yamlKeys = ['script:', 'meta:', 'acts:', 'title:', 'stats:', 'characters:', 'scenes:', 'dialogues:',
      'source:', 'format:', 'generated_at:', 'location:', 'time:', 'dialogues:', 'speaker:', 'line:', 'action:']
    const endIdx = lines.findIndex((line, i) => {
      if (i === 0) return false
      const trimmed = line.trim()
      if (!trimmed) return false
      if (trimmed.startsWith('- ') || trimmed.startsWith('  ')) return false
      if (yamlKeys.some(k => trimmed.startsWith(k))) return false
      return true
    })
    if (endIdx > 0) {
      yaml = lines.slice(0, endIdx).join('\n').trim()
    }
    return yaml
  }

  // 3. 从 acts: 开始提取
  const actsStart = content.indexOf('acts:')
  if (actsStart >= 0) {
    const yamlBody = content.slice(actsStart).trim()
    return `script:
  meta:
    title: "剧本"
    source: "用户输入"
    format: "竖屏短剧"
    generated_at: "${new Date().toISOString()}"
    stats:
      characters: 0
      scenes: 0
      dialogues: 0

  ${yamlBody}`
  }

  // 4. 兜底：整个内容
  return content.trim()
}

/**
 * 修复常见 YAML 格式问题
 */
function fixCommonYamlIssues(yaml) {
  if (!yaml) return ''

  let fixed = yaml

  // 修复1：缺失顶层 script:
  if (!fixed.trim().startsWith('script:')) {
    if (fixed.trim().startsWith('meta:') || fixed.trim().startsWith('acts:')) {
      fixed = 'script:\n  ' + fixed.replace(/\n/g, '\n  ')
    }
  }

  // 修复2：缺失 acts: 但有 scene:
  if (!fixed.includes('acts:') && fixed.includes('scene:')) {
    // 在合适位置插入 acts 包装
    const sceneIdx = fixed.indexOf('\n    - scene:') > -1 ? fixed.indexOf('\n    - scene:') : fixed.indexOf('- scene:')
    if (sceneIdx > 0) {
      const before = fixed.slice(0, sceneIdx)
      const after = fixed.slice(sceneIdx)
      fixed = before + '  acts:\n    - act: 1\n      scenes:\n        ' + after.replace(/\n/g, '\n        ')
    }
  }

  // 修复3：缺失 dialogues: 但有 speaker:
  if (fixed.includes('speaker:') && !fixed.includes('dialogues:')) {
    // 在 speaker 前插入 dialogues:
    fixed = fixed.replace(/(\s{8,}characters:.*?\n)(\s{8,}- speaker:)/, '$1$2            dialogues:\n$2')
  }

  // 修复4：characters 不是数组格式
  fixed = fixed.replace(/characters:\s*([^\[]\S+)/g, (match, val) => {
    if (val.includes(',')) {
      const parts = val.split(/[,，]/).map(s => s.trim()).filter(Boolean)
      return `characters: [${parts.map(p => `"${p.replace(/"/g, '')}"`).join(', ')}]`
    }
    return `characters: ["${val.replace(/"/g, '')}"]`
  })

  // 修复5：缩进不一致（统一用2空格）
  // 已经由 AI prompt 约束，这里做兜底
  const lines = fixed.split('\n')
  const cleaned = []
  for (const line of lines) {
    if (line.trim() === '') {
      cleaned.push('')
      continue
    }
    // 计算当前应该的缩进级别
    const trimmed = line.trimStart()
    const indent = line.length - trimmed.length
    // 简单保持原样，不做过于激进的缩进修复
    cleaned.push(line)
  }

  return cleaned.join('\n')
}

// ============================================================
// 结果校验
// ============================================================

/**
 * 校验 AI 输出的分块结果质量
 */
function validateChunkResult(result, inputChunk) {
  const { yaml, stats } = result

  // 1. 必须有内容
  if (!yaml || yaml.trim().length < 20) {
    return { valid: false, reason: 'YAML 输出为空或过短' }
  }

  // 2. 必须包含 scene 或 speaker
  if (!yaml.includes('scene:') && !yaml.includes('speaker:')) {
    return { valid: false, reason: '缺少场景或对白结构' }
  }

  // 3. 不能是 AI 的错误回复（如道歉、解释等）
  const errorPhrases = ['抱歉', '对不起', '无法', '不能', 'I cannot', 'I apologize', 'unable to']
  const firstLine = yaml.trim().split('\n')[0].toLowerCase()
  for (const phrase of errorPhrases) {
    if (firstLine.includes(phrase)) {
      return { valid: false, reason: `AI 拒绝处理：${firstLine.slice(0, 50)}` }
    }
  }

  // 4. 输入有对白但输出没有
  const inputHasDialogue = /["\u201C\u300C].*?["\u201D\u300D]/.test(inputChunk)
  if (inputHasDialogue && stats.dialogues === 0) {
    return { valid: false, reason: '输入有对白但AI未提取' }
  }

  return { valid: true, reason: 'ok' }
}

// ============================================================
// 降级：单段正则解析
// ============================================================

/**
 * 单段的正则兜底解析
 */
function fallbackSingleChunk(chunk, index) {
  // 复用正则引擎的核心分析逻辑
  const allDialogues = extractAllDialogues(chunk)
  const rawCharacters = extractCharacters(chunk, allDialogues)

  // 【v2.1】角色后处理：黑名单过滤 + 别名映射
  const sanitized = sanitizeCharacters(rawCharacters)
  const characters = sanitized.names

  // 构建新模板 YAML
  const locations = ['室内·办公室', '室内·客厅', '室内·咖啡馆', '室外·街道', '室外·公园']
  const times = ['日', '夜', '傍晚', '清晨']
  const moods = ['沉重', '紧张', '压抑', '平静', '激烈']

  const location = locations[index % locations.length]
  const time = times[index % times.length]
  const mood = moods[index % moods.length]

  let yaml = `  acts:
    - act_id: ${index + 1}
      act_title: "${escapeYaml(location.replace('室内·', '').replace('室外·', ''))}${time}"
      scenes:
        - scene_id: 1
          location: "${escapeYaml(location)}"
          time: "${escapeYaml(time)}"
          mood: "${escapeYaml(mood)}"
          scene_note: ""
          characters:
`

  if (characters.length > 0) {
    for (const ch of characters.slice(0, 4)) {
      const aliases = sanitized.aliasMap.get(ch)
      const aliasStr = aliases && aliases.size > 0
        ? `\n              aliases: [${[...aliases].map(a => `"${escapeYaml(a)}"`).join(', ')}]`
        : ''
      yaml += `            - name: "${escapeYaml(ch)}"\n              role: "角色"${aliasStr}\n`
    }
  } else {
    yaml += `            - name: "角色"\n              role: "角色"\n`
  }

  yaml += `          dialogues:
`

  // 提取对白并后处理
  const sceneDialogues = extractSceneDialogues(chunk, characters, allDialogues, index)

  if (sceneDialogues.length > 0) {
    let dlgId = 1
    for (const d of sceneDialogues.slice(0, 4)) {
      const speaker = d.speaker.trim()
      const line = (d.line || '').trim()

      // 旁白过滤
      if (isNarrativeKeyword(speaker)) {
        yaml += `            # [旁白过滤] ${escapeYaml(speaker)}\n`
        continue
      }

      // 心理独白识别
      const innerDetect = detectInnerMonologue(speaker, line)
      if (innerDetect) {
        yaml += `            - dialogue_id: ${dlgId++}\n              type: "inner"\n              speaker: "${escapeYaml(innerDetect.standardName)}"\n              line: "${escapeYaml(filterProfanity(line))}"\n              action: "内心独白"\n              note: ""\n`
        continue
      }

      // 普通对白
      const normalized = normalizeCharacterName(speaker)
      yaml += `            - dialogue_id: ${dlgId++}\n              type: "spoken"\n              speaker: "${escapeYaml(normalized.standardName)}"\n              line: "${escapeYaml(filterProfanity(line))}"\n              action: "${escapeYaml(d.action || '')}"\n              note: ""\n`
    }
  } else {
    // 无对白时输出场景描述
    const desc = chunk.slice(0, 40).replace(/\n/g, ' ').trim()
    yaml += `            - dialogue_id: 1\n              type: "spoken"\n              speaker: "${escapeYaml(characters[0] || '角色')}"\n              line: "……"\n              action: "${escapeYaml(desc)}"\n              note: ""\n`
  }

  return {
    yaml,
    source: 'regex',
    characters,
    stats: {
      characters: characters.length,
      scenes: 1,
      dialogues: Math.min(sceneDialogues.length, 4)
    }
  }
}

 // ============================================================
// 分块结果合并
// ============================================================

/**
 * 合并所有分段结果 + 章节标题增强
 */
function mergeChunkResults(allResults, fullText, chapterTitles = []) {
  // 1. 收集所有角色（已过后处理的标准名）
  const allChars = new Map()
  const allAliases = new Map() // 标准名 → Set(别名)

  for (const r of allResults) {
    for (const ch of (r.characters || [])) {
      if (ch && typeof ch === 'string' && ch.length >= 2 && ch.length <= 5) {
        allChars.set(ch, (allChars.get(ch) || 0) + 1)
      }
    }
  }

  // 按出现次数排序
  const sortedChars = [...allChars.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)

  // 去重（短名是长名子串的合并）+ 收集别名
  const finalChars = []
  for (const name of sortedChars) {
    const isSubOrSuper = finalChars.some(existing =>
      existing.includes(name) || name.includes(existing)
    )
    if (!isSubOrSuper) {
      finalChars.push(name)
    }
  }
  const topChars = finalChars.slice(0, 12)

  // 2. 合并所有 acts
  const allActs = []
  let totalScenes = 0
  let totalDialogues = 0

  for (const r of allResults) {
    const yaml = r.yaml

    // 提取 acts 部分（适配新旧两种格式）
    const actsMatch = yaml.match(/acts:\s*\n([\s\S]*)$/)
    if (actsMatch) {
      const actsContent = actsMatch[1]
      // 兼容旧格式 "- act:" 和新格式 "- act_id:"
      const actBlocks = actsContent.split(/(?=\n\s+- act(?:_id)?:)/)
      for (const block of actBlocks) {
        if (block.trim()) {
          allActs.push(block.replace(/^\n\s+/, '').trimEnd())
        }
      }
    } else {
      // 没有 acts，尝试提取 scene
      const sceneMatch = yaml.match(/scenes:\s*\n([\s\S]*)$/)
      if (sceneMatch) {
        allActs.push(`- act_id: ${allActs.length + 1}\n      act_title: ""\n      scenes:\n        ${sceneMatch[1].trim()}`)
      }
    }

    totalScenes += r.stats?.scenes || 0
    totalDialogues += r.stats?.dialogues || 0
  }

  // 3. 利用章节标题增强 act 标题
  if (chapterTitles.length > 0) {
    const step = Math.max(1, Math.floor(chapterTitles.length / Math.max(1, allActs.length)))
    for (let i = 0; i < allActs.length; i++) {
      const titleIdx = i * step
      if (titleIdx < chapterTitles.length) {
        const title = chapterTitles[titleIdx].replace(/"/g, '')
        // 如果已有 act_title，替换；否则插入
        if (allActs[i].includes('act_title:')) {
          allActs[i] = allActs[i].replace(/act_title:\s*"[^"]*"/, `act_title: "${escapeYaml(title)}"`)
        } else {
          allActs[i] = allActs[i].replace(
            /(- act_id:\s*\d+)/,
            `$1\n      act_title: "${escapeYaml(title)}"`
          )
        }
      }
    }
  }

  // 4. 构建最终 YAML（新模板）
  const title = generateTitle(fullText)

  let mergedYaml = `script:\n  meta:\n    title: "${escapeYaml(title)}"\n    source: "用户输入"\n    format: "竖屏短剧"\n    generated_at: "${new Date().toISOString()}"\n    stats:\n      characters: ${topChars.length}\n      scenes: ${totalScenes}\n      dialogues: ${totalDialogues}\n\n  acts:\n`

  // 重新编号 allActs
  allActs.forEach((actBlock, idx) => {
    // 替换 act_id 编号
    let fixed = actBlock.replace(/act_id:\s*\d+/, `act_id: ${idx + 1}`)
    // 兼容旧格式 act: → act_id:
    fixed = fixed.replace(/^- act:\s*(\d+)/, `- act_id: $1`)
    // 如果没有 act_title，添加一个基于场景地点+时间的默认标题
    if (!fixed.includes('act_title:')) {
      const locMatch = fixed.match(/location:\s*"([^"]+)"/)
      const timeMatch = fixed.match(/time:\s*"([^"]+)"/)
      const loc = locMatch ? locMatch[1].replace(/室内·|室外·/, '') : '场景'
      const time = timeMatch ? timeMatch[1] : ''
      fixed = fixed.replace(/(- act_id:\s*\d+)/, `$1\n      act_title: "${escapeYaml(loc + time)}"`)
    }
    mergedYaml += `    ${fixed.trim()}\n`
  })

  // 5. 【v2.1】最终后处理：确保所有 speaker 已规范化，所有 line 已过滤脏话
  mergedYaml = postProcessYamlString(mergedYaml)

  return {
    yaml: mergedYaml.trimEnd(),
    stats: {
      characters: topChars.length,
      scenes: totalScenes,
      dialogues: totalDialogues
    }
  }
}

/**
 * 从文本生成标题
 */
function generateTitle(text) {
  // 查找章节标题
  const chapterMatch = text.match(/^第[一二三四五六七八九十百千\d]+[章节回幕]\s*(.+)$/m)
  if (chapterMatch) return chapterMatch[0].trim().slice(0, 30)

  // 取第一段前30字
  const firstLine = text.split('\n')[0].replace(/["""'']/g, '').trim()
  if (firstLine.length <= 30) return firstLine
  return firstLine.slice(0, 25) + '…'
}

// ============================================================
// 正则规则解析模式（完整文本，无 AI Key 时）
// ============================================================

async function regexConvert(inputText, onProgress, signal, warnings) {
  onProgress?.('init', { message: '正在解析文本结构…', percent: 10 })

  const analysis = analyzeText(inputText)

  await sleep(300, signal)
  onProgress?.('processing', {
    message: `已识别 ${analysis.characters.length} 个角色：${analysis.characters.slice(0, 5).join('、')}${analysis.characters.length > 5 ? '…' : ''}`,
    current: 1, total: 1, percent: 40
  })

  await sleep(400, signal)
  onProgress?.('processing', { message: '正在生成对白和场景结构…', current: 1, total: 1, percent: 70 })

  await sleep(300, signal)
  onProgress?.('merging', { message: '正在输出结构化剧本…', percent: 90 })

  const yaml = buildMockYaml(analysis)
  await sleep(200, signal)

  onProgress?.('done', { message: '转换完成（规则引擎）', percent: 100 })

  warnings.push('当前使用规则引擎解析，建议配置智谱 AI Key 获得更准确的剧本结构。')

  return {
    yaml,
    stats: {
      characters: analysis.characters.length,
      scenes: analysis.scenes,
      dialogues: Math.min(analysis.dialogues.length, 20)
    },
    warnings
  }
}

// ---- 文本分析（简易 NLP） ----

function analyzeText(text) {
  const allDialogues = extractAllDialogues(text)
  const characters = extractCharacters(text, allDialogues)

  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim())
  const scenes = Math.max(1, Math.min(paragraphs.length, 8))

  return {
    characters,
    dialogues: allDialogues.slice(0, 30),
    scenes,
    paragraphs
  }
}

function extractAllDialogues(text) {
  const allDialogues = []
  const patterns = [
    /\u201C([^\u201D]{1,200})\u201D/g,
    /\u300C([^\u300D]{1,200})\u300D/g,
    /"([^"]{1,200})"/g,
    /'([^']{1,200})'/g
  ]
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const m of matches) {
      const content = m[1].trim()
      if (content.length > 1) {
        allDialogues.push(content)
      }
    }
  }
  return allDialogues
}

// ---- 角色提取 ----

function extractCharacters(text, dialogues) {
  const characters = new Set()
  const charScore = new Map()

  function addChar(name, weight = 1) {
    if (!name || name.length < 2 || name.length > 5) return
    if (!isValidName(name)) return
    characters.add(name)
    charScore.set(name, (charScore.get(name) || 0) + weight)
  }

  // 优化后的正则表达式，避免灾难性回溯
  // 策略：减少交替选项，使用更简单的模式

  // 模式1：XX说/XX道/XX说道（最常见模式，优先级最高）
  // 使用简单模式：中文字符+说/道
  const simpleSpeakPattern = /(?<![他她我你它])([\u4e00-\u9fff]{2,4})(?:说道|道|说|笑道|问道|答道|喊道|叹道|怒道|冷道|淡道)/g
  for (const m of text.matchAll(simpleSpeakPattern)) {
    addChar(m[1].trim())
  }

  // 模式2：引号后紧跟名字+说（使用简单模式）
  const afterQuotePattern = /[“”"']\s*([\u4e00-\u9fff]{2,4})[，,。\s]*说/g
  for (const m of text.matchAll(afterQuotePattern)) {
    addChar(m[1].trim())
  }

  // 模式3：XX+动作（简化版，只保留最常见的动作）
  const actionVerbs = '(?:站起身|坐下来|推开门|走进来|抬起头|低下头|转过身)'
  const actionPattern = /(?<![他她我你它])([\u4e00-\u9fff]{2,4})(?:站起身|坐下来|推开门|走进来|抬起头|低下头|转过身)/g
  for (const m of text.matchAll(actionPattern)) {
    addChar(m[1].trim(), 0.5)
  }

  // 模式4：对话中的称呼
  {
    const allDialogueText = dialogues.join(' ')
    const honorifics = '(?:先生|小姐|老师|前辈|公子|少爷|姑娘|大师)'
    const nameInDialogue = new RegExp(`([\\u4e00-\\u9fff]{2,3})${honorifics}`, 'g')
    for (const m of allDialogueText.matchAll(nameInDialogue)) {
      addChar(m[1].trim(), 0.3)
    }
  }

  // 模式5：通用模式（简化版）
  {
    const commonAfter = '(?:站在|坐在|走在|来到|走到|看向|望着|盯着)'
    const generalPattern = new RegExp(`(?<![他她我你它])([\\u4e00-\\u9fff]{2,4})${commonAfter}`, 'g')
    for (const m of text.matchAll(generalPattern)) {
      addChar(m[1].trim(), 0.2)
    }
  }

  // 去重合并
  const charList = [...characters]
  const merged = new Map()
  for (const name of charList) {
    const score = charScore.get(name) || 0
    let found = false
    for (const [longName, longScore] of merged) {
      if (longName.includes(name) && longName !== name) {
        merged.set(longName, longScore + score)
        found = true
        break
      }
      if (name.includes(longName) && name !== longName) {
        merged.delete(longName)
        merged.set(name, longScore + score)
        found = true
        break
      }
    }
    if (!found) merged.set(name, score)
  }

  return [...merged.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 12)
}

function isValidName(name) {
  if (!name || name.length < 2 || name.length > 5) return false
  if (!/^[\u4e00-\u9fff]+$/.test(name)) return false
  if (/[\d\s\p{P}]/u.test(name)) return false

  // ===== 【v3.0 加强】代词组合 + 破碎动词 + 叙述碎片拦截 =====
  const blacklist = new RegExp(
    '^(?:' + [
      // 基础代词
      '这', '那', '是', '他', '她', '它', '我', '你', '您', '谁', '何', '啥', '怎', '哪',
      '他们', '她们', '它们', '我们', '你们', '自己', '别人', '某人', '有人', '无人', '所有人',
      // 代词+单字动词（他曾、我却、你被、我就…）
      '他将', '他在', '他想', '他说', '他问', '他走', '他看', '他听', '他笑', '他哭', '他叫', '他喊', '他跑', '他坐', '他站',
      '他会', '他是', '他有', '他就', '他才', '他已', '他还', '他又', '他也', '他却', '他刚', '他正', '他将', '他过去', '他向',
      '他曾经', '他曾说', '他怎么', '他什么', '他哪里', '他会被', '他会被困', '他能', '他可以', '他可能',
      '她将', '她在', '她想', '她说', '她问', '她走', '她看', '她听', '她笑', '她哭', '她叫', '她喊',
      '她会', '她是', '她就有', '她就', '她才', '她已', '她还', '她又', '她也', '她却',
      '你将', '你在', '你想', '你说', '你问', '你走', '你看', '你听', '你笑', '你叫', '你喊',
      '你会', '你是', '你就', '你才', '你已', '你还', '你又', '你也', '你却', '你的', '你能', '你不要', '你不能',
      '我将', '我在', '我想', '我说', '我问', '我走', '我看', '我听', '我笑', '我哭', '我叫', '我喊',
      '我会', '我是', '我就', '我才', '我已', '我还', '我又', '我也', '我却', '我能', '我不知道', '我没有',
      // "被/将/就/却/也/还/不" + 动词（碎片）
      '被困', '被锁', '被杀', '被关', '被打', '被绑', '被限制', '被囚禁',
      '将被', '就会被', '就要被', '都会被', '也要被', '也会被',
      '就不', '就不能', '就不会', '就不想', '就不要', '就不该', '就不去',
      '就不由', '就不受', '就不觉', '就不自觉', '就不再',
      '也不知', '也不再', '也不能', '也不会', '也不再', '也就不',
      '却不', '却不知', '却不能', '却不会', '却不想', '却不去',
      // 动作单字碎片
      '处跟', '殊人', '人口头', '人口中',
      // 场景碎片
      '一看', '一看就知道', '一看之下', '一看就是', '一看就',
      '一说', '一句话', '一句话就', '一看之', '一边', '一边说', '一次',
      // 连接词碎片
      '所以', '但是', '然后', '接着', '于是', '不过', '虽然', '因为', '如果', '既然', '尽管', '除非',
      '不仅', '而且', '或者', '还是', '要么', '宁可', '就算', '即使',
      '怎么', '什么', '为什么', '哪里', '哪儿', '哪个', '哪些', '多少',
      // 时间/状态碎片
      '突然', '忽然', '猛然', '竟然', '居然', '果然', '当然', '只是', '可是', '不过', '然而',
      '立刻', '马上', '顿时', '渐渐', '一直', '已经', '曾经', '正在', '将要', '终于', '总算', '最后',
      '之后', '以后', '里面', '外面', '上面', '下面', '前面', '后面', '旁边', '中间', '这边', '那边',
      '你可别', '你不要', '你不能', '你不会', '你不可', '你不敢', '你不想', '你不愿', '你不肯',
      // 说话状态词（不是人名）
      '低声', '轻声', '冷声', '淡淡', '缓缓', '轻轻', '微微', '悄悄', '默默', '慢慢', '急急', '快快', '愤愤', '怒怒', '冷冷',
      '摇了摇头', '摆了摆手', '叹了口气', '微微一笑', '眉头一皱', '眼神一凝',
      // 多字碎片
      '被困在', '被困于', '被锁在', '被关在', '被限制在', '被囚禁在',
      '就被人', '就让他', '就让她', '就不会有', '就不能被',
    ].join('|') +
    ')$'
  )
  if (blacklist.test(name)) return false

  // 2字组合额外检查：第一个字是代词/介词且第二个字是动词/虚词 → 拦截
  if (name.length === 2) {
    const firstChar = name[0]
    const secondChar = name[1]
    const pronouns = new Set(['他', '她', '我', '你', '它', '这', '那', '谁', '何'])
    const prepositions = new Set(['被', '将', '就', '对', '向', '从', '在', '和', '跟', '让', '给', '与', '由', '比', '把'])
    const verbSuffixes = new Set(['说', '道', '问', '答', '喊', '叫', '吼', '笑', '哭', '看', '听', '想', '走', '跑', '坐', '站', '来', '去',
      '会', '能', '可', '要', '是', '有', '就', '才', '已', '还', '又', '也', '却', '刚', '不', '没', '很', '太', '最', '更', '只', '仅',
      '过', '曾', '被', '受', '遭', '遇', '见', '到', '知', '懂', '觉', '感', '发', '现', '出', '进', '入', '回', '起', '下', '上',
      '的', '地', '得', '了', '着', '过', '等'])

    if ((pronouns.has(firstChar) || prepositions.has(firstChar)) && verbSuffixes.has(secondChar)) {
      return false
    }
  }

  // 3字以代词开头+单字动词+单字 → 拦截（如"他被困"、"她曾说"）
  if (name.length === 3) {
    const pronouns = new Set(['他', '她', '我', '你', '它'])
    if (pronouns.has(name[0]) && /[会被曾就能却还又也]/g.test(name[1])) {
      return false
    }
  }

  // 身体部位后缀过滤
  if (/(?:头|脸|手|脚|眼|身|心|口|耳|鼻|舌|眉|发|指|掌|臂|腿|膝|肩|颈|背|腰|腹|臀|胸|不|也|还|又|就|才|都|很|太|最|更|只|仅|刚|将|正|在|已|着|了|过|的|地|得)$/.test(name) && name.length <= 3) return false
  if (/(?:也不|头也|脸也|身也|心也|手也|脚也)/.test(name)) return false
  if (/[说笑道喊叫问答吼站坐走看听想打拿给对向从开推拉关进出入]$/.test(name)) return false
  if (/[的地得了着过被把和与或而但虽]$/.test(name)) return false
  if (/[正将已就在也还又才便却]$/.test(name)) return false

  return true
}

// ---- YAML 生成（正则模式用） ----

function escapeYaml(str) {
  if (!str) return ''
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

function buildMockYaml(analysis) {
  const { characters, dialogues, paragraphs } = analysis
  const title = generateTitle(paragraphs)

  let yaml = `script:
  meta:
    title: "${escapeYaml(title)}"
    source: "用户输入"
    format: "竖屏短剧"
    generated_at: "${new Date().toISOString()}"
    stats:
      characters: ${characters.length}
      scenes: ${analysis.scenes}

  acts:
`

  yaml += buildScenesFromParagraphs(paragraphs, characters, dialogues)
  return yaml
}

function buildScenesFromParagraphs(paragraphs, characters, dialogues) {
  const sceneParagraphs = []
  const chapterTitles = []
  let currentScene = []

  for (const p of paragraphs) {
    if (/^(?:第[一二三四五六七八九十\d]+[章节回幕]|[①②③④⑤]|一[、.]|【|\[|（|\()/.test(p.trim())) {
      if (currentScene.length) sceneParagraphs.push(currentScene)
      currentScene = [p]
      // 提取章节标题
      const trimmed = p.trim()
      // 尝试从"第X章 标题"格式中提取标题
      const chapterMatch = trimmed.match(/^第[一二三四五六七八九十百千\d]+[章节回幕]\s*(.*)$/)
      if (chapterMatch) {
        chapterTitles.push(chapterMatch[1] || trimmed)
      } else {
        chapterTitles.push(trimmed)
      }
    } else {
      currentScene.push(p)
    }
  }
  if (currentScene.length) sceneParagraphs.push(currentScene)
  // 如果章节标题数量少于场景，补充默认标题
  while (chapterTitles.length < sceneParagraphs.length) {
    chapterTitles.push('')
  }

  const locations = ['室内·办公室', '室内·客厅', '室内·咖啡馆', '室外·街道', '室外·公园']
  const times = ['日', '夜', '傍晚', '清晨']
  const moods = ['沉重', '紧张', '压抑', '平静', '激烈', '安静', '热闹']

  let yaml = ''
  const maxScenes = Math.min(sceneParagraphs.length, 8)

  for (let sceneIdx = 0; sceneIdx < maxScenes; sceneIdx++) {
    const sceneText = sceneParagraphs[sceneIdx].join('\n')
    const sceneChars = []
    for (const ch of characters) {
      if (sceneText.includes(ch)) sceneChars.push(ch)
    }
    if (sceneChars.length === 0 && characters.length > 0) {
      sceneChars.push(...characters.slice(0, 2))
    }

    const sceneDialogues = extractSceneDialogues(sceneText, characters, dialogues, sceneIdx)

    const location = locations[sceneIdx % locations.length]
    const time = times[sceneIdx % times.length]
    const mood = moods[sceneIdx % moods.length]
    // 使用章节标题作为 act_title，如果没有则使用默认的地点+时间
    let actTitle = chapterTitles[sceneIdx] || location.replace(/室内·|室外·/, '') + time
    // 如果章节标题太长，截取前20字
    if (actTitle.length > 30) {
      actTitle = actTitle.slice(0, 30) + '…'
    }

    yaml += `    - act_id: ${sceneIdx + 1}\n      act_title: "${escapeYaml(actTitle)}"\n      scenes:\n        - scene_id: 1\n          location: "${escapeYaml(location)}"\n          time: "${escapeYaml(time)}"\n          mood: "${escapeYaml(mood)}"\n          scene_note: ""\n          characters:\n`

    for (const ch of sceneChars) {
      yaml += `            - name: "${escapeYaml(ch)}"\n              role: "角色"\n`
    }

    yaml += `          dialogues:\n`

    // 后处理对话
    let dlgId = 1
    const narrations = []
    for (const d of sceneDialogues.slice(0, 4)) {
      const speaker = d.speaker.trim()
      const line = (d.line || '').trim()

      // 旁白过滤
      if (isNarrativeKeyword(speaker)) {
        narrations.push(line)
        continue
      }

      // 心理独白识别
      const innerDetect = detectInnerMonologue(speaker, line)
      if (innerDetect) {
        yaml += `            - dialogue_id: ${dlgId++}\n              type: "inner"\n              speaker: "${escapeYaml(innerDetect.standardName)}"\n              line: "${escapeYaml(filterProfanity(line))}"\n              action: "内心独白"\n              note: ""\n`
        continue
      }

      // 普通对白
      const normalized = normalizeCharacterName(speaker)
      const actions = ['推门进入', '看向对方', '坐在椅子上', '站起身', '转身', '走近', '停下脚步', '微微一笑']
      const action = d.action || actions[sceneIdx % actions.length]
      yaml += `            - dialogue_id: ${dlgId++}\n              type: "spoken"\n              speaker: "${escapeYaml(normalized.standardName)}"\n              line: "${escapeYaml(filterProfanity(line))}"\n              action: "${escapeYaml(action)}"\n              note: ""\n`
    }

    // 如果有旁白被过滤，填入 scene_note
    if (narrations.length > 0) {
      yaml = yaml.replace(
        `scene_note: ""`,
        `scene_note: "${escapeYaml(narrations.join('；').slice(0, 100))}"`
      )
    }
  }

  return yaml
}

function extractSceneDialogues(sceneText, characters, dialogues, sceneIdx) {
  const result = []

  const speakVerb = '(?:淡淡道|轻声说|低声说|冷冷道|缓缓道|轻笑一声|冷哼一声|微微笑道|轻轻叹道|嘿嘿笑道|哈哈笑道|淡淡笑道|轻声问道|低声问道|冷冷问道|缓缓问道|淡淡说道|低声说道|轻声说道|冷冷说道|缓缓说道|冷冷道|缓缓道|淡淡道|轻声道|沉声道|微微道|轻轻道|怒声道|冷声道|淡声道|叹声道|哭声道|说道|问道|答道|喊道|叫道|吼道|笑道|怒道|冷道|淡道|叹道|哭道|喝道|嚷道|骂道|喃喃道|嘀咕道|解释道|补充道|回应道|开口道|问|说|道|答|喊|叫|吼)'

  // 中文引号对话：角色名+说+"内容"  /  "内容"+角色名+说
  // 统一加 (?<![他她我你它]) 避免代词前缀
  const allPatterns = [
    // A. 角色名+说话动词+"对话内容"（名前模式）
    // 左中文引号\u201C搭配右\u201D，左\u300C搭配右\u300D
    { p: new RegExp(`(?<![他她我你它])([\\u4e00-\\u9fff]{2,5})${speakVerb}[\\s\\u3000]*[\u201C]([^\u201D]{1,200})[\u201D]`, 'g'), s: 1, l: 2 },
    { p: new RegExp(`(?<![他她我你它])([\\u4e00-\\u9fff]{2,5})${speakVerb}[\\s\\u3000]*[\u300C]([^\u300D]{1,200})[\u300D]`, 'g'), s: 1, l: 2 },
    // ASCII双引号
    { p: new RegExp(`(?<![他她我你它])([\\u4e00-\\u9fff]{2,5})${speakVerb}[\\s\\u3000]*["]([^"]{1,200})["]`, 'g'), s: 1, l: 2 },
    // ASCII单引号
    { p: new RegExp(`(?<![他她我你它])([\\u4e00-\\u9fff]{2,5})${speakVerb}[\\s\\u3000]*[']{1}([^']{1,200})[']{1}`, 'g'), s: 1, l: 2 },

    // B. "对话内容"+角色名+说话动词（名后模式）
    { p: new RegExp(`[\u201C]([^\u201D]{1,200})[\u201D][\\s\\u3000]*([\\u4e00-\\u9fff]{2,5})${speakVerb}`, 'g'), s: 2, l: 1 },
    { p: new RegExp(`[\u300C]([^\u300D]{1,200})[\u300D][\\s\\u3000]*([\\u4e00-\\u9fff]{2,5})${speakVerb}`, 'g'), s: 2, l: 1 },
    { p: new RegExp(`["]([^"]{1,200})["][\\s\\u3000]*([\\u4e00-\\u9fff]{2,5})${speakVerb}`, 'g'), s: 2, l: 1 },
    { p: new RegExp(`[']{1}([^']{1,200})[']{1}[\\s\\u3000]*([\\u4e00-\\u9fff]{2,5})${speakVerb}`, 'g'), s: 2, l: 1 },

    // C. 无明确说话动词的连续引号对话（上下文推断）
    // 这种情况保留引号内容，说话人在后面用characters推断
  ]

  for (const { p, s, l } of allPatterns) {
    for (const m of sceneText.matchAll(p)) {
      let speaker = m[s].trim()
      const line = m[l].trim()

      // 去除结尾的说话动词残留
      speaker = speaker.replace(new RegExp(`${speakVerb}$`), '').trim()

      // 只接受有效人名
      if (speaker.length >= 2 && line.length > 0 && isValidName(speaker)) {
        // 检查是否已经存在相同对话（去重）
        const isDuplicate = result.some(r => r.speaker === speaker && r.line === line)
        if (!isDuplicate) {
          result.push({ speaker, line })
        }
      }
    }
  }

  // D. 兜底：找不到对话时用characters+引号内容
  if (result.length === 0) {
    // 只提取引号内容，用场景中出现的角色做说话人
    const allQuotes = []
    const quotePatterns = [
      /[\u201C]([^\u201D]{1,200})[\u201D]/g,
      /[\u300C]([^\u300D]{1,200})[\u300D]/g,
      /["]([^"]{1,200})["]/g,
    ]
    for (const qp of quotePatterns) {
      for (const qm of sceneText.matchAll(qp)) {
        const content = qm[1].trim()
        if (content.length > 1 && !/^[0-9\s\u3000]+$/.test(content)) {
          allQuotes.push(content)
        }
      }
    }

    if (allQuotes.length > 0) {
      const charsInScene = characters.filter(ch => sceneText.includes(ch))
      for (let i = 0; i < Math.min(allQuotes.length, 4); i++) {
        const speaker = charsInScene[i % Math.max(charsInScene.length, 1)] || characters[i % Math.max(characters.length, 1)] || '角色'
        result.push({ speaker, line: allQuotes[i] })
      }
    }
  }

  // E. 最后兜底
  if (result.length === 0 && dialogues.length > 0) {
    const start = sceneIdx * 2
    for (let i = 0; i < Math.min(2, dialogues.length - start); i++) {
      const charsInScene = characters.filter(ch => sceneText.includes(ch))
      const speaker = charsInScene[i % Math.max(charsInScene.length, 1)] || characters[i % Math.max(characters.length, 1)] || '角色'
      result.push({ speaker, line: dialogues[start + i] || '……' })
    }
  }

  return result
}

// ---- 工具函数 ----

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('用户取消操作', 'AbortError'))
      }, { once: true })
    }
  })
}
