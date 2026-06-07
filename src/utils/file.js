/**
 * 文件读取工具
 */

/**
 * 检测文本是否为有效的 UTF-8（无乱码）
 * 通过检查是否有常见的 UTF-8 解码失败产生的替换字符
 */
function isValidUTF8(text) {
  // 替换字符 U+FFFD 表示解码失败
  if (text.includes('\uFFFD')) return false
  // 检查是否有大量连续问号（GBK 解码为 UTF-8 时的常见现象）
  const questionRatio = (text.match(/\?/g) || []).length / text.length
  if (questionRatio > 0.05) return false
  return true
}

/**
 * 使用指定编码读取文本文件
 * @param {File} file
 * @param {string} encoding
 * @returns {Promise<string>}
 */
export function readTextFileWithEncoding(file, encoding = 'UTF-8') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, encoding)
  })
}

/**
 * 读取文本文件（自动检测编码：优先 UTF-8，失败则尝试 GBK）
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function readTextFile(file) {
  // 先尝试 UTF-8
  const utf8Text = await readTextFileWithEncoding(file, 'UTF-8')
  if (isValidUTF8(utf8Text)) {
    return utf8Text
  }

  // UTF-8 解码失败，尝试 GBK
  try {
    const gbkText = await readTextFileWithEncoding(file, 'GBK')
    if (isValidUTF8(gbkText)) {
      return gbkText
    }
  } catch {
    // GBK 也不成功，回退到 UTF-8 原始结果
  }

  // 如果都失败了，返回 UTF-8 结果并附带警告
  return utf8Text
}

/**
 * 读取 DOCX 文件
 * DOCX 是 ZIP 压缩格式，前端直接用 FileReader 无法正确解析。
 * 此处拒绝并给出明确的用户指引。
 * 后续可集成 mammoth.js 实现真正的 DOCX 解析。
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function readDocxFile(file) {
  throw new Error(
    'DOCX 文件暂时无法直接解析。\n' +
    '请使用以下方式之一：\n' +
    '1. 将 DOCX 另存为 .txt 纯文本格式后重新上传\n' +
    '2. 复制小说内容，切换到"粘贴文本"标签页粘贴'
  )
}

/**
 * 根据文件类型智能读取
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function readFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'docx' || ext === 'doc') {
    return readDocxFile(file)
  }
  return readTextFile(file)
}
