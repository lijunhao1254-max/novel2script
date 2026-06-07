# Novel2Script YAML Schema 定义文档

> **版本**: v3.0 | **日期**: 2026-06-06 | **作者**: AI 小说转剧本工具团队  
> **适用范围**: 中文网络小说 → 竖屏短剧结构化剧本转换

---

## 一、总体设计理念

### 1.1 为什么用 YAML？

YAML 是人机双读的结构化格式。与传统影视剧本软件（Final Draft / Celtx / .fountain）相比，YAML 有三个核心优势：

| 特性 | 传统剧本格式 (.fdx) | YAML Schema |
|------|---------------------|-------------|
| **可读性** | XML 冗长，作者难直接编辑 | 缩进即结构，作者可直接修改 |
| **可编程性** | 需要专用 SDK 解析 | 任何语言都可秒解析 |
| **版本控制** | diff 混乱（XML 无换行逻辑） | Git diff 清晰友好 |
| **跨工具流转** | 锁定在特定软件 | 可导入 TTS 配音/分镜/预算系统 |

**Schema 设计的核心目标**：让作者「粘贴小说 → 获得可编辑剧本初稿 → 在 YAML 中直接打磨 → 最快进入拍摄/制作」。不追求格式完美，追求流程最简。

### 1.2 设计原则

1. **作者优先**（Author-first）：所有字段名使用中文友好英文（act / scene / dialogue），对编剧直觉友好
2. **小说改编专用**（Novel-adaptation）：专门针对「从叙述文字中提取剧本」这一场景，而非从零写剧本
3. **可增量编辑**（Incrementally-editable）：每个字段独立可改，修改台词不影响角色列表
4. **制作流水线就绪**（Production-ready）：字段设计可直接对接配音 TTS、分镜工具、预算系统

---

## 二、完整 Schema 定义

### 2.1 顶层结构

```yaml
script:           # 根节点 — 一部完整剧本
  meta:           # 元数据层 — 身份信息
  acts:           # 幕层 — 剧本主体
```

**设计原因**：`script` 作为根节点，明确这是一个完整的剧本实体（而非片段）。与影视行业「剧本 = script」的术语一致。`meta` 与 `acts` 平级分离，区分「关于剧本的信息」和「剧本本身」，方便后续引入「只读 meta + 编辑 acts」的权限模型。

### 2.2 meta — 元数据

```yaml
meta:
  title: string          # 必填 | 剧本标题
  source: string         # 必填 | 数据来源（"用户输入" / "文件上传"）
  format: string         # 必填 | 目标格式（当前固定 "竖屏短剧"）
  generated_at: string   # 必填 | ISO 8601 时间戳
  stats:                 # 必填 | 快速统计
    characters: integer  # 角色总数
    scenes: integer      # 场景总数
    dialogues: integer   # 对白总数
```

**字段设计原因**：

- **title**：从小说原文自动提取（优先章节标题，兜底首段首句），作者可手动修改
- **source**：记录输入方式，用于后续「增量转换」（同一小说分批次输入时做角色去重）
- **format**：当前固定「竖屏短剧」，但预留扩展性（未来可能支持「横屏长剧」「动画分镜」「广播剧」等）
- **generated_at**：ISO 8601 时间戳保障跨时区一致，用于版本追踪（"这个版本是什么时候生成的？"）
- **stats**：扁平统计三要素，作者打开剧本一眼看到规模（"8个角色 15个场景 42句对白"），决定是否需要继续拆分或合并

### 2.3 acts — 幕（Act）

```yaml
acts:
  - act_id: integer       # 必填 | 幕编号（1-based）
    act_title: string     # 必填 | 幕标题（地点+时间，如"酒吧夜"）
    scenes:               # 必填 | 场景数组
      - scene_id: integer
        ...
```

**设计原因**：

- **act 作为中间抽象层**：一个 act 对应叙事意义上的「一幕」，通常是一个连续的时间/空间段落。在竖屏短剧中，一个 act 约 2-5 分钟播出内容。
- **act_id 1-based**：与剧本写作惯例一致（"第一幕"而非"第零幕"）
- **act_title**：给作者快速定位的锚点。格式「地点+时间」（如"办公室日""酒吧夜"），一眼可知故事节奏
- **scenes 数组**：一个 act 可以包含多个场景（如「办公室」跳转到「会议室」），保持叙事连贯性但更换空间

### 2.4 scenes → scene — 场景（Scene）

```yaml
scenes:
  - scene_id: integer       # 必填 | 场景在 act 内的编号（1-based）
    location: string        # 必填 | 场景地点（"内/外·具体地点"格式）
    time: string            # 必填 | 时间（日/夜/傍晚/清晨）
    mood: string            # 必填 | 场景氛围（沉重/紧张/压抑/轻松/暧昧/激烈/平静）
    scene_note: string      # 可选 | 场景备注 — 从小说旁白提取的环境/氛围描述
    characters:             # 必填 | 本场景出场角色
      - name: string
        role: string
        aliases: [string]
    dialogues:              # 必填 | 本场景对白
      - dialogue_id: integer
        ...
```

**字段设计原因**：

| 字段 | 设计原因 |
|------|---------|
| **scene_id** | act 内独立编号（不从全局编号），因为 re-order 场景时只影响 act 内顺序 |
| **location** | 采用「内/外·具体地点」格式（如"室内·酒吧""室外·街道"），这是影视剧本的标准标注法，方便制片勘景 |
| **time** | 日/夜 是电影拍摄的最基本信息（影响灯光、滤镜），精确到「傍晚」「清晨」即可，不需要具体钟点（那是后期分镜的任务） |
| **mood** | 从小说中 AI 推断的氛围标签。不是为了替代剧本的详细情感说明，而是给作者一个快速判断：「这段是不是我想表达的情绪？」可一键修改 |
| **scene_note** | **小说转剧本的核心创新字段**。小说中有大量环境描写（"灯光绚烂的酒吧，昏暗的角落里"），这些文字不适合做对白，但对导演/演员理解场景至关重要。直接从原文提取放入 scene_note，不浪费任何文字 |
| **characters** | 放 scene 级而非 act 级，因为影视拍摄按场景调度演员——场务只需要知道「这一场谁在」。aliases 记录原文中角色的所有变体写法 |

### 2.5 characters — 角色

```yaml
characters:
  - name: string     # 必填 | 标准角色名（2-4字中国人名/昵称/尊称）
    role: string     # 必填 | 角色定位（主角/女主/男主/配角/龙套）
    aliases:         # 可选 | 别名列表（原文中的其他叫法）
      - string
```

**字段设计原因**：

- **name 仅限 2-4 字真人名**：这是 Schema 层的关键约束。小说中大量叙述碎片（"他曾""我被困""门外人"）会被误识别，Schema 强制约束角色名必须是真实人名格式。AI Prompt 和正则规则双重保障
- **role**：精简分类（主角/女主/男主/配角/龙套），不对标影视行业的完整角色分类（主角/对立角色/导师/信使/催化剂等），因为那是深度剧本分析的任务，不在当前 Scope 内
- **aliases**：**小说转剧本的必需品**。小说作者会使用大量别名（"烟熏头发五颜六色的穆芊芊"→简称"穆芊芊"；"过吴辰所"→"吴辰"），aliases 统一记录，方便 TTS/配音系统在不同上下文中识别同一角色
- **per-scene 出场**：characters 放在 scene 层级而非 act 层级，因为不同场景出场角色不同

### 2.6 dialogues — 对白

```yaml
dialogues:
  - dialogue_id: integer   # 必填 | 对白在 scene 内的编号（1-based）
    type: string           # 必填 | 对白类型（"spoken" | "inner" | "offscreen"）
    speaker: string        # 必填 | 说话人（必须等于 characters 中某个 name）
    line: string           # 必填 | 台词内容（纯文本，已去除引号）
    action: string         # 可选 | 表演动作提示
    note: string           # 可选 | 备注（剧情伏笔/后期提示）
```

**字段设计原因**：

| 字段 | 设计原因 |
|------|---------|
| **dialogue_id** | scene 内独立编号，方便"在第 5 句前插入一句"的编辑场景 |
| **type** | 三种类型覆盖小说转剧本的对话提取需求：<br>• `spoken`：正常角色对白（引号内提取）<br>• `inner`：心理独白（小说特有，"他心里想…"→ type=inner）<br>• `offscreen`：画外音（旁白/电话/广播，预留） |
| **speaker** | **强制约束**：必须等于同一 scene 中 characters 的某个 name。这保证了对白与角色的一致性，防止「幽灵角色」（存在于对白中但未在角色列表定义） |
| **line** | 纯文本、无引号、无脏话（已过滤为 █ 遮罩）。脏话过滤是竖屏短剧的平台合规要求 |
| **action** | 说话时的动作/表情提示。从原文提取（如"撇嘴醉笑""推开门"），留给导演/后期做表演参考，不是给配音用的 |
| **note** | 自由文本备注。可记录语气提示、剧情伏笔、修改标记等。不为每个 note 设独立 schema 字段，保持灵活性 |

### 2.7 全字段类型约束汇总

| 字段路径 | 类型 | 约束 |
|---------|------|------|
| `meta.title` | string | 1-100 字符，含中文 |
| `meta.source` | string | 枚举: "用户输入" \| "文件上传" |
| `meta.format` | string | 枚举: "竖屏短剧" |
| `meta.generated_at` | string | ISO 8601 格式 |
| `meta.stats.characters` | integer | ≥0 |
| `meta.stats.scenes` | integer | ≥1 |
| `meta.stats.dialogues` | integer | ≥0 |
| `acts[].act_id` | integer | ≥1，全局唯一 |
| `acts[].act_title` | string | 1-50 字符 |
| `acts[].scenes[].scene_id` | integer | ≥1，act 内唯一 |
| `acts[].scenes[].location` | string | "内外·地点" 格式（如"室内·办公室"） |
| `acts[].scenes[].time` | string | 枚举: "日" \| "夜" \| "傍晚" \| "清晨" |
| `acts[].scenes[].mood` | string | 枚举: "沉重" \| "紧张" \| "压抑" \| "轻松" \| "暧昧" \| "激烈" \| "平静" |
| `acts[].scenes[].scene_note` | string | 0-200 字符 |
| `acts[].scenes[].characters[].name` | string | 2-4 字纯中文（必须通过黑名单过滤） |
| `acts[].scenes[].characters[].role` | string | 枚举: "主角" \| "女主" \| "男主" \| "配角" \| "龙套" |
| `acts[].scenes[].characters[].aliases[]` | string[] | 可为空数组 |
| `acts[].scenes[].dialogues[].dialogue_id` | integer | ≥1，scene 内唯一 |
| `acts[].scenes[].dialogues[].type` | string | 枚举: "spoken" \| "inner" \| "offscreen" |
| `acts[].scenes[].dialogues[].speaker` | string | 必须等于同 scene 中 characters[].name |
| `acts[].scenes[].dialogues[].line` | string | 1-500 字符（已去引号、已过滤脏话） |
| `acts[].scenes[].dialogues[].action` | string | 0-100 字符 |
| `acts[].scenes[].dialogues[].note` | string | 0-200 字符 |

---

## 三、完整示例（基于真实小说）

以下是用本 Schema 将一段小说原文正确转换后的 YAML 输出：

### 输入原文

```
"所以你说你，已经过了三十多万天？"
"对！准确的说是一千年，今天刚好一千年整。"
灯光绚烂的酒吧，昏暗的角落里，一男一女正在低声说笑。
"啧啧。"画着烟熏头发五颜六色的穆芊芊撇撇嘴，醉笑道："这是你追女孩子的手段？编一个离奇的故事，手段真是老套，故事倒是蛮有趣的。"
```

### YAML 输出

```yaml
script:
  meta:
    title: "酒吧夜"
    source: "用户输入"
    format: "竖屏短剧"
    generated_at: "2026-06-06T09:00:00.000Z"
    stats:
      characters: 2
      scenes: 1
      dialogues: 4
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
              aliases:
                - "烟熏头发五颜六色的穆芊芊"
            - name: "角色"
              role: "男主"
              aliases: []
          dialogues:
            - dialogue_id: 1
              type: "spoken"
              speaker: "角色"
              line: "所以你说你，已经过了三十多万天？"
              action: ""
              note: "待确认说话人姓名"
            - dialogue_id: 2
              type: "spoken"
              speaker: "角色"
              line: "对！准确的说是一千年，今天刚好一千年整。"
              action: ""
              note: "待确认说话人姓名"
            - dialogue_id: 3
              type: "spoken"
              speaker: "穆芊芊"
              line: "啧啧。"
              action: "撇嘴"
              note: ""
            - dialogue_id: 4
              type: "spoken"
              speaker: "穆芊芊"
              line: "这是你追女孩子的手段？编一个离奇的故事，手段真是老套，故事倒是蛮有趣的。"
              action: "醉笑"
              note: ""
```

### 示例解读

1. **旁白归位**：「灯光绚烂的酒吧…」→ `scene_note`，不进入 dialogues
2. **角色精准**：只提取穆芊芊（有姓名），无名男主标记为「角色」（不编造名字）
3. **别名记录**：「烟熏头发五颜六色的穆芊芊」→ aliases，标准名统一为「穆芊芊」
4. **对白正确**：所有引号内对话被提取，说话人对应正确
5. **动作分离**：「撇嘴」「醉笑」→ action，不影响台词

---

## 四、Schema 对作者工作流的影响

### 4.1 从「写剧本」到「改剧本」

传统流程：作者手打剧本 → 重复劳动大量格式工作  
本工具流程：粘贴小说 → AI 生成结构化初稿 → 作者直接编辑 YAML 打磨

Schema 设计让「改」比「写」简单 10 倍：
- **改台词**：找到 `line: "…"` → 直接修改，不改其他字段
- **加角色**：在 characters 数组加一行，自动跟 dialogues.speaker 对应
- **调场景顺序**：剪切粘贴整个 scene 块即可
- **改情绪**：修改 `mood` 值，所有下游工具（配音/灯光）跟着变

### 4.2 下游工具对接

Schema 为下游工具提供标准化数据：

| 下游系统 | 需要的字段 | 说明 |
|---------|-----------|------|
| **TTS 配音** | speaker + line + type | type="inner" 用特殊音效，off-screen 用混响 |
| **分镜工具** | location + time + mood + scene_note | 每场景自动生成氛围参考 |
| **预算/排期** | meta.stats.scenes + characters[] + locations | 场景数 × 角色数 = 拍摄天数估算 |
| **字幕机** | line（纯文本）+ dialogue_id | 按时序排列 |
| **版本对比** | generated_at + meta.stats | 快速判断两个版本的差异量 |

### 4.3 未来扩展方向

当前 Schema v3.0 预留扩展接口：

- **多格式**：`meta.format` 从 "竖屏短剧" 扩展为 "横屏长剧" / "动画分镜" / "广播剧"
- **角色关系**：在 characters[] 中增加 `relations` 字段（如 "吴辰 ←妹妹→ 穆芊芊"）
- **章节归因**：在 scene 中增加 `source_chapter` 字段，反向追踪「这段剧本来自小说第几章」
- **BGM 标记**：在 scene 中增加 `bgm` 字段，标注建议配乐风格

---

## 五、对比：本 Schema vs 其他剧本格式

| 特性 | 本 Schema (YAML) | Fountain | Final Draft (.fdx) | Celtx JSON |
|------|-----------------|----------|---------------------|------------|
| 人工可编辑 | ✅ 极简缩进 | ✅ 纯文本 | ❌ 需专用软件 | ⚠️ 嵌套深 |
| 角色别名 | ✅ 原生支持 | ❌ 不在标准内 | ❌ | ❌ |
| 心理独白 | ✅ type:"inner" | ❌ | ❌ | ❌ |
| 旁白归位 | ✅ scene_note | ⚠️ 依赖约定 | ⚠️ | ⚠️ |
| 统计信息 | ✅ meta.stats | ❌ | ⚠️ | ⚠️ |
| 程序化处理 | ✅ 任意 YAML parser | ⚠️ 需专用 parser | ⚠️ XML parser | ✅ JSON parser |
| 小说→剧本转换 | ✅ 原生设计 | ❌ | ❌ | ❌ |

**结论**：本 Schema 填补了「小说→结构化剧本」这一垂直场景的空白。它不是对现有剧本格式的替代，而是专为 AI 辅助写作打造的中间层格式。

---

## 六、版本演进历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-05 | 初始版本：script/meta/acts 三层结构 |
| v2.0 | 2026-06-06 | 新增 characters[].aliases, 规范化 dialogue 格式, 引入智能分段并行处理 |
| v2.1 | 2026-06-06 | 新增内容质量规则：角色黑名单、别名映射、心理独白识别、脏话过滤 |
| v3.0 | 2026-06-06 | **当前版本**：完全重写 AI Prompt + 200+ 黑名单 + 正则负向断言 + 标准化字段类型约束 |

---

*本文档随 convert.js 引擎同步更新，任何 Schema 变更必须先更新此文档。*
