# 标准化 YAML 下层模板 + 正确示例

> 修改范围：只改 `acts → scenes → scene` 内部字段格式，顶层 `script/meta` 保留不动

---

## 一、标准化 YAML 模板（v3.0 最终版本）

```yaml
script:
  meta:
    title: "xxx"
    source: "用户输入"
    format: "竖屏短剧"
    generated_at: "2026-06-06T08:00:00.000Z"
    stats:
      characters: 3
      scenes: 2
      dialogues: 5
  acts:
    - act_id: 1                          # 幕编号（数字）
      act_title: "酒吧夜"                # 场景地点+时间
      scenes:
        - scene_id: 1                    # 场景内编号
          location: "室内·酒吧"          # 地点（室内/室外·具体场所）
          time: "夜"                     # 时间（日/夜/傍晚/清晨）
          mood: "暧昧"                   # 氛围（沉重/紧张/压抑/轻松/暧昧/激烈/平静）
          scene_note: "灯光绚烂的酒吧角落，一男一女低声说笑"   # ← 所有旁白/叙述文字放这里
          characters:                    # ← 只包含真实有姓名的角色
            - name: "穆芊芊"             #   标准角色名（2-4字中国人名）
              role: "女主"               #   主角/女主/男主/配角/龙套
              aliases: ["烟熏头发女人"]  #   原文中的别名/描述性称呼
            - name: "吴辰"
              role: "男主"
              aliases: []
          dialogues:                     # ← 只包含引号内真实对白
            - dialogue_id: 1             #   对话内编号
              type: "spoken"             #   spoken(对白) | inner(内心独白)
              speaker: "穆芊芊"          #   必须等于 characters 中某个 name
              line: "这是你追女孩子的手段？"  # 去掉引号的纯对话文本
              action: "撇嘴醉笑"         #   说话时的动作提示
              note: ""                   #   备注（剧情伏笔/特殊说明）
            - dialogue_id: 2
              type: "spoken"
              speaker: "穆芊芊"
              line: "故事倒是蛮有趣的。"
              action: ""
              note: ""

    - act_id: 2
      act_title: "未知地点回想"
      scenes:
        - scene_id: 1
          location: "室内·未知"
          time: "夜"
          mood: "平静"
          scene_note: "吴辰开始讲述自己的离奇经历，语气平淡却透着千年沧桑"
          characters:
            - name: "吴辰"
              role: "男主"
              aliases: []
          dialogues:
            - dialogue_id: 1
              type: "spoken"
              speaker: "吴辰"
              line: "对！准确的说是一千年，今天刚好一千年整。"
              action: "平静地"
              note: "揭示男主不老不死的真相"
            - dialogue_id: 2
              type: "inner"
              speaker: "吴辰"
              line: "她大概以为我在编故事吧。"
              action: "内心独白"
              note: ""
```

---

## 二、用用户截图原文生成的正确 YAML 示例

**原文：**
> "所以你说你，已经过了三十多万天？"  
> "对！准确的说是一千年，今天刚好一千年整。"  
> 灯光绚烂的酒吧，昏暗的角落里，一男一女正在低声说笑。  
> "啧啧。"画着烟熏头发五颜六色的穆芊芊撇撇嘴，醉笑道："这是你追女孩子的手段？编一个离奇的故事，手段真是老套，故事倒是蛮有趣的。"

**正确输出：**

```yaml
script:
  meta:
    title: "酒吧对话"
    source: "用户输入"
    format: "竖屏短剧"
    generated_at: "2026-06-06T08:42:00.000Z"
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
              aliases: ["烟熏头发五颜六色的穆芊芊"]
            - name: "吴辰"
              role: "男主"
              aliases: []
          dialogues:
            - dialogue_id: 1
              type: "spoken"
              speaker: "穆芊芊"
              line: "所以你说你，已经过了三十多万天？"
              action: ""
              note: ""
            - dialogue_id: 2
              type: "spoken"
              speaker: "吴辰"
              line: "对！准确的说是一千年，今天刚好一千年整。"
              action: ""
              note: ""
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

**关键点：**
- `characters` 只有 2 个真实角色，**没有 "他曾"、"我被困"、"却被困" 等碎片**
- `scene_note` 存放旁白描述"灯光绚烂的酒吧角落…"
- 所有对话 `line` 来自原文引号内的真实对白，没有编造
- `action` 精确匹配说话动作（"撇嘴"、"醉笑"）

---

## 三、字段规范速查

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| `act_id` | number | 幕编号，从1开始 | ✅ |
| `act_title` | string | 地点+时间，如"酒吧夜" | ✅ |
| `scene_id` | number | 场景编号 | ✅ |
| `location` | string | `室内/室外·场所名` | ✅ |
| `time` | string | 日/夜/傍晚/清晨 | ✅ |
| `mood` | string | 沉重/紧张/压抑/轻松/暧昧/激烈/平静 | ✅ |
| `scene_note` | string | 旁白/叙述/环境描写 | 可空 |
| `characters[].name` | string | **2-4字纯中文人名** | ✅ |
| `characters[].role` | string | 主角/女主/男主/配角/龙套 | ✅ |
| `characters[].aliases` | string[] | 别名/称呼数组 | 可空 |
| `dialogues[].dialogue_id` | number | 对话编号 | ✅ |
| `dialogues[].type` | string | spoken / inner | ✅ |
| `dialogues[].speaker` | string | **必须等于 characters 中某 name** | ✅ |
| `dialogues[].line` | string | 去掉引号的纯对话文本 | ✅ |
| `dialogues[].action` | string | 表演动作提示 | 可空 |
| `dialogues[].note` | string | 备注（伏笔等） | 可空 |
