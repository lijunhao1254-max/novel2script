# 三套解析规则（代码落地版）

> 配合 `src/api/convert.js` v3.0 使用。以下规则已全部落地到代码中。

---

## 规则1：角色过滤黑名单（Character Blacklist）

### 原理
在角色名通过正则提取后、写入 YAML 之前，经过 `isValidName()` + `isNarrativeKeyword()` + `NARRATIVE_PATTERNS` 三道防线逐词过滤。

### 拦截维度

#### 第一道：关键词精确黑名单（`NARRATIVE_KEYWORDS` 数组）
命中即拦截，禁止作为角色名/speaker。涵盖以下类别：

| 类别 | 示例 | 原因 |
|------|------|------|
| 代词+单字动词 | `他曾` `他却` `她被` `我被` `却被` `就被` `也被` `不被` | 完整代词+单字，"他曾说XX"切断后残片 |
| 代词+多字 | `他曾说` `她却想` `他被困` `我被困在` `你就不` `我就不` | 同上，多字切断残片 |
| 介词碎片 | `跟他` `和她` `和他` `让他` `给她` `向他` | "跟她说XX"切断后残片 |
| 被动态碎片 | `被困` `被锁` `被关` `被杀` `被绑` `将被` `就会被` | 缺少主语的被动态碎片 |
| 方位/感知 | `只听` `门外` `深处` `拐角` `身后` `远处` | 感知动词/方位词，不是人名 |
| 状态虚词 | `不知` `就不` `就没` `也不再` `也不知` | 状态描述词 |
| 时间副词 | `忽然` `猛然` `突然` `顿时` `渐渐` `已经` `正在` | 时间状语 |

#### 第二道：正则模式黑名单（`NARRATIVE_PATTERNS` 数组）
对关键词无法覆盖的模式做正则匹配：

```javascript
// 代词+单字组合（2-3字）
/^[他她我你它]曾是?$/
/^[他她我你它]说过?$/
/^[他她我你它]问过?$/
/^[他她我你它]走了?$/
/^[他她我你它]看到?$/
// … 共20+个模式

// 被动态碎片
/^被困(?:在|于|住|了)?$/
/^被锁(?:在|于|住|了)?$/
// ...

// 其他
/^只听.{0,3}$/
/^门外.{0,3}$/
/^人口头.*/
/^处跟.*/
```

#### 第三道：`isValidName()` 函数全面升级
正则提取后再过 `isValidName`，用超大正则黑名单（含 200+ 条）+ 结构规则：

```javascript
// 超大黑名单正则 (200+ 条目)
const blacklist = /^(这|那|...|他曾|他却|她被|...|被困|被锁|...)$/

// 2字代词检查：第一个字是代词/介词 + 第二个字是动词 → 拦截
if (name.length === 2) {
  if (pronouns.has(firstChar) && verbSuffixes.has(secondChar)) return false
}

// 3字代词+结构词检查
if (name.length === 3) {
  if (pronouns.has(name[0]) && /[会被曾就能却还又也]/g.test(name[1])) return false
}

// 身体部位后缀 / 语气词后缀 / 虚词后缀 → 全部拦截
```

---

## 规则2：对话正则（Dialogue Regex）

### 原理
在 `extractSceneDialogues()` 中，用 8 组正则覆盖所有对话格式。

### 正则组（统一加 `(?<![他她我你它])` 负向断言）

#### 组A：名前模式 — 角色名+说话动词+"对话"
```javascript
// 中文引号（左\u201C 右\u201D）
/(?<![他她我你它])([\u4e00-\u9fff]{2,5})(说话动词)[\s\u3000]*[\u201C]([^\u201D]{1,200})[\u201D]/g

// 中文方引号（左\u300C 右\u300D）
/(?<![他她我你它])([\u4e00-\u9fff]{2,5})(说话动词)[\s\u3000]*[\u300C]([^\u300D]{1,200})[\u300D]/g

// ASCII双引号
/(?<![他她我你它])([\u4e00-\u9fff]{2,5})(说话动词)[\s\u3000]*["]([^"]{1,200})["]/g
```

#### 组B：名后模式 — "对话"+角色名+说话动词
```javascript
// 中文引号
/[\u201C]([^\u201D]{1,200})[\u201D][\s\u3000]*([\u4e00-\u9fff]{2,5})(说话动词)/g
// 中文方引号
/[\u300C]([^\u300D]{1,200})[\u300D][\s\u3000]*([\u4e00-\u9fff]{2,5})(说话动词)/g
// ASCII双引号
/["]([^"]{1,200})["][\s\u3000]*([\u4e00-\u9fff]{2,5})(说话动词)/g
```

#### 组C：兜底 — 无说话动词时，提取所有引号内容+characters推断说话人
```javascript
// 只提取引号内容
/[\u201C]([^\u201D]{1,200})[\u201D]/g
/[\u300C]([^\u300D]{1,200})[\u300D]/g
/["]([^"]{1,200})["]/g

// 用场景中出现的角色推断说话人
const charsInScene = characters.filter(ch => sceneText.includes(ch))
```

### 去重机制
```javascript
const isDuplicate = result.some(r => r.speaker === speaker && r.line === line)
if (!isDuplicate) result.push({ speaker, line })
```

---

## 规则3：旁白判定规则（Narrative Detection）

### 原理
所有非引号内的段落 → 归入 `scene_note`，不提取为角色或对话。

### 判定流程

```
段落文本
  │
  ├─ 包含引号对话（"X" + 说话人明确） → 提取为 dialogue
  │
  ├─ 包含引号但说话人不明确 → 兜底：引号内容 + characters推断说话人
  │
  └─ 不包含引号 → 【旁白】
       ├─ 环境/场景描写 → scene_note
       ├─ 动作描写 → scene_note
       ├─ 心理描写 → scene_note
       └─ 叙述者评论 → scene_note
```

### AI Prompt 中的旁白指令
```
【规则3：旁白处理】
- 所有非引号内的叙述文字 → 提取关键氛围信息 → 放入scene_note（不超过80字）
- 不要为旁白文字创建角色
- 不要为旁白文字编造对话
```

### 代码中的旁白过滤点

```javascript
// 1. speaker 检查 — 在 extractSceneDialogues 中
if (isValidName(speaker)) { ... }  // 无效名直接跳过

// 2. 角色列表后处理 — 在 sanitizeCharacters 中
if (isNarrativeKeyword(trimmed)) continue  // 旁白词直接丢弃

// 3. 对话列表后处理 — 在 sanitizeDialogues 中
if (isNarrativeKeyword(speaker)) { narrations.push(line); continue }

// 4. YAML 后处理 — 在 postProcessYamlString 中
if (isNarrativeKeyword(speaker)) { return `# [旁白过滤] ...` }

// 5. 降级模式 — 在 fallbackSingleChunk 中
if (isNarrativeKeyword(speaker)) { /* 记入 narrations，最后填入 scene_note */ }

// 6. 场景构建 — 在 buildScenesFromParagraphs 中
if (narrations.length > 0) {
  yaml = yaml.replace(`scene_note: ""`, `scene_note: "${escapeYaml(narrations.join('；'))}"`)
}
```

---

## 快速对照表

| 输入 | 规则处理 | 输出位置 |
|------|---------|---------|
| `穆芊芊笑道："你真有趣"` | 名前模式匹配 | `dialogues[].line: "你真有趣"` |
| `"真有趣"穆芊芊笑道` | 名后模式匹配 | `dialogues[].line: "真有趣"` |
| `灯光绚烂的酒吧角落…` | 无引号→旁白 | `scene_note: "灯光绚烂的酒吧角落…"` |
| `他曾说过很多话` | 黑名单拦截 | 不提取为角色，归入旁白 |
| `他被困在地下室` | 黑名单拦截 | `scene_note` |
| `吴辰心里：我该怎么办` | 心理独白识别 | `type: "inner", speaker: "吴辰"` |
| `穆芊芊` (真实人名) | 有效角色 | `characters[].name: "穆芊芊"` |
