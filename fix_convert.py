import re

with open('src/api/convert.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = """    // 从此场景文本中提取对白（支持多种引号类型）
    const sceneDialogues = []
    // 引号字符集："" '' 「」 " '
    const quotes = '"""'\'「」"\''
    const dlPatterns = [
      // 模式1：XX说："..." 或 XX说：「...」
      new RegExp(`([\\u4e00-\\u9fff]{2,4})(?:说道|说|道|问|答|喊|叫)[${quotes}]([^${quotes}]+)[${quotes}]`, 'g'),
      // 模式2："..." XX说 或 「...」XX说
      new RegExp(`[${quotes}]([^${quotes}]+)[${quotes}]\\s*([\\u4e00-\\u9fff]{2,4})(?:说道|说|道)`, 'g')
    ]"""

new = """    // 从此场景文本中提取对白（支持多种引号类型）
    const sceneDialogues = []
    // 引号字符集（用 Unicode 编码避免字符串语法冲突）
    const qLeft  = '\\u201c\\u2018\\u300c"\''   // " ' 「 " '
    const qRight = '\\u201d\\u2019\\u300d"\''   // " ' 」 " '
    const dlPatterns = [
      // 模式1：XX说："..." 或 XX说：「...」
      new RegExp(`([\\u4e00-\\u9fff]{2,4})(?:说道|说|道|问|答|喊|叫)[${qLeft}]([^${qRight}]+)[${qRight}]`, 'g'),
      // 模式2："..." XX说 或 「...」XX说
      new RegExp(`[${qLeft}]([^${qRight}]+)[${qRight}]\\s*([\\u4e00-\\u9fff]{2,4})(?:说道|说|道)`, 'g')
    ]"""

if old in content:
    content = content.replace(old, new)
    with open('src/api/convert.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed!')
else:
    print('Pattern not found')
