# 落地修改步骤

> 修改完成日期：2026-06-06  
> 修改文件：`src/api/convert.js`（单文件修改）  
> 配合文档：`yaml-template-v3-2026-06-06.md`、`parsing-rules-v3-2026-06-06.md`

---

## 修改优先级与文件清单

| 优先级 | 文件 | 修改内容 | 影响范围 |
|--------|------|---------|---------|
| 🔴 P0 | `src/api/convert.js` | AI System Prompt 重写 | AI解析质量 |
| 🔴 P0 | `src/api/convert.js` | `NARRATIVE_KEYWORDS` 扩充 3x | 角色过滤 |
| 🔴 P0 | `src/api/convert.js` | `NARRATIVE_PATTERNS` 扩充 5x | 角色过滤 |
| 🔴 P0 | `src/api/convert.js` | `isValidName()` 重写 | 角色校验 |
| 🟡 P1 | `src/api/convert.js` | `extractCharacters()` 加负向断言 | 角色提取 |
| 🟡 P1 | `src/api/convert.js` | `extractSceneDialogues()` 优化 | 对话提取 |
| 🟡 P1 | `src/api/convert.js` | `postProcessYamlString()` 适配新格式 | YAML输出 |

---

## 步骤1：固定 YAML 模板（已完成）

**做了什么：**
- 确定 `script/meta` 顶层不动
- 确定下层格式：`acts → scenes → scene { location, time, mood, scene_note, characters: [{name,role,aliases}], dialogues: [{dialogue_id,type,speaker,line,action,note}] }`
- 在 AI System Prompt 中嵌入完整模板示例
- 在 `fallbackSingleChunk` 和 `buildScenesFromParagraphs` 中统一使用新模板

**产出文件：** `deliverables/yaml-template-v3-2026-06-06.md`

---

## 步骤2：替换抽取规则（已完成）

### 2.1 角色抽取规则

**修改前：**
```javascript
// extractCharacters 模式1
/([\u4e00-\u9fff]{2,4}?)(说话动词)/g  // 太贪婪，匹配"他曾"+"说过"
```

**修改后：**
```javascript
// extractCharacters 模式1（加负向断言）
/(?<![他她我你它])([\u4e00-\u9fff]{2,4})(说话动词)/g  // 阻止代词前缀
```

**追加：** 模式3和模式5同步加 `(?<![他她我你它])`

### 2.2 对话提取规则

**修改前：**
```javascript
// extractSceneDialogues — 8个正则，无负向断言
{ p: /([\u4e00-\u9fff]{2,5})(speakVerb)["].../g, ... }
```

**修改后：**
```javascript
// 名前模式全部加负向断言
{ p: /(?<![他她我你它])([\u4e00-\u9fff]{2,5})(speakVerb)[\u201C].../g, ... }
// 名后模式不需要（对话已经在引号内了）
// 追加兜底逻辑：无对话时用 characters 推断 + 引号内容
// 追加去重逻辑
```

### 2.3 YAML 后处理规则

**修改前：**
```javascript
// postProcessYamlString 只匹配旧格式 "- speaker: / line:"
const dialoguePattern = /(-\s+speaker:\s*"...)(\s+line:\s*"...)/g
```

**修改后：**
```javascript
// 适配新格式 "- dialogue_id: N / type: "spoken" / speaker: "X" / line: "Y""
const dialogueBlockPattern = /(?:- dialogue_id:\s*\d+\n)?...speaker:\s*"...\n...line:\s*".../g
// 重建时自动补全 type/action/note 字段
```

---

## 步骤3：添加黑名单过滤（已完成）

### 3.1 关键词黑名单 3x 扩充

从 **40 条** 扩充到 **120+ 条**，新增：
- 代词碎片（他曾、她却、我被、却被…）
- 被动态碎片（被困、被锁、被关…）
- 介词碎片（跟他、和她、让他、给你…）
- 多字组合（被困在、就不能、也不会…）

### 3.2 正则黑名单 5x 扩充

从 **9 个** 模式扩充到 **45+ 个**，新增：
- 代词+单字 20+ 模式
- 被动态 10+ 模式
- 保留原有方位/感知模式

### 3.3 isValidName 黑名单 10x 扩充

从 **40 个** 黑名单词扩充到 **200+ 个**，新增：
- 全部代词+单字动词组合
- 全部破碎动词组合
- 2字代词前缀结构检查
- 3字代词+结构词检查

---

## 步骤4：编译验证

```bash
cd D:\ai小说工具\novel2script-frontend
npm run build
```

---

## 验证清单

测试原文：
```
"所以你说你，已经过了三十多万天？"
"对！准确的说是一千年，今天刚好一千年整。"
灯光绚烂的酒吧，昏暗的角落里，一男一女正在低声说笑。
"啧啧。"画着烟熏头发五颜六色的穆芊芊撇撇嘴，醉笑道："这是你追女孩子的手段？编一个离奇的故事，手段真是老套，故事倒是蛮有趣的。"
```

期望输出检查：

- [ ] `characters` 只包含 2 个角色（穆芊芊 + 吴辰/男主），不包含 "他曾"、"却被困" 等碎片
- [ ] `scene_note` 包含 "灯光绚烂的酒吧角落"
- [ ] `dialogues` 包含 4 条对白，全部来自原文引号内容
- [ ] 第4条对话 `line: "这是你追女孩子的手段？..."` 完整保留
- [ ] `action` 字段有 "撇嘴" / "醉笑"
- [ ] `type` 字段正确（spoken/inner）
- [ ] YAML 缩进正确，无格式错误

---

## 修改摘要

| 修改点 | 修改前行数 | 修改后行数 | 变化 |
|--------|-----------|-----------|------|
| `NARRATIVE_KEYWORDS` | 27 行 | 80 行 | +53 |
| `NARRATIVE_PATTERNS` | 20 行 | 60 行 | +40 |
| `isValidName` | 15 行 | 60 行 | +45 |
| `extractCharacters` | 80 行 | 80 行 | 加负向断言 |
| `extractSceneDialogues` | 50 行 | 90 行 | 加断言+去重+兜底 |
| `postProcessYamlString` | 65 行 | 90 行 | 适配新YAML格式 |
| AI System Prompt | 75 行 | 95 行 | 重写 |
| **总计** | **~332 行** | **~555 行** | **+223 行** |
