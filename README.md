# 🎬 幕启 MuQi · AI 小说转剧本工具

> 一键将小说文本转化为结构化 YAML 剧本，支持 AI 反向创作完整剧本文稿，专为影视编剧、独立创作者打造。

[![Vue3](https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-2.1-FFD859?logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.9-409EFF?logo=element&logoColor=white)](https://element-plus.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**在线体验：** [https://11bw89hz11789.vicp.fun](https://11bw89hz11789.vicp.fun)

---

## 🎥 功能演示

<video src="demo/demo.mp4" controls width="100%"></video>

> 完整演示：[demo/demo.mp4](./demo/demo.mp4)

---

## ✨ 核心功能

### 📖 小说 → YAML 结构化剧本
- 智能解析小说文本，自动识别场景、人物、对白
- 输出标准 YAML 格式剧本结构（幕 → 场景 → 对白）
- 支持 2.8MB+ 大文件，分块处理防止 token 超限
- 基于 **智谱 GLM-4** 大模型驱动

### 🤖 AI 创作（YAML → 剧本文稿）
- 上传或粘贴 YAML 结构，AI 反向扩写为完整剧本文稿
- **流式实时输出**，逐字显示创作过程
- 4 种创作风格可选：
  - 🌆 现代都市
  - 📜 文艺叙事
  - 🏯 古风古典
  - 🔍 悬疑惊悚
- 无 AI 配置时自动切换规则模式兜底

### 💳 会员订阅体系
- 免费版 / 专业版 / 旗舰版三档套餐
- 完整支付弹窗流程（微信 / 支付宝）
- 倒计时支付超时保护

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Composition API |
| 构建工具 | Vite 5 |
| 状态管理 | Pinia |
| UI 组件库 | Element Plus |
| 路由 | Vue Router 4（Hash 模式） |
| AI 模型 | 智谱 GLM-4.7-Flash |
| 打包方式 | 多文件构建 + gzip 压缩 |

---

## 📁 项目结构

```
novel2script-frontend/
├── src/
│   ├── views/
│   │   ├── Home.vue          # 首页（功能介绍 + 定价）
│   │   ├── Convert.vue       # 小说转 YAML 主转换页
│   │   ├── ScriptCreate.vue  # AI 创作页（YAML → 剧本文稿）
│   │   └── Login.vue         # 登录页
│   ├── components/
│   │   ├── NavBar.vue        # 顶部导航栏
│   │   ├── FooterBar.vue     # 底部栏
│   │   ├── PaymentModal.vue  # 支付弹窗组件
│   │   ├── AiConfigModal.vue # AI 配置弹窗
│   │   └── DemoModal.vue     # 演示弹窗
│   ├── api/
│   │   └── scriptCreate.js   # AI 创作核心引擎
│   ├── stores/               # Pinia 状态管理
│   └── router/               # 路由配置
├── demo/                    # 功能演示视频
│   └── demo.mp4
├── dist/                     # 构建产物
├── vite.config.js
└── package.json
```

---

## 🚀 快速开始

### 开发环境

```bash
# 克隆项目
git clone https://github.com/lijunhao1254-max/novel2script.git
cd novel2script-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 生产构建

```bash
npm run build
# 产物：dist/ 目录（多文件构建，按需并行加载）
```

### 配置 AI 密钥

登录后在「AI 设置」中填入你的**智谱 API Key**：
- 获取地址：[https://open.bigmodel.cn](https://open.bigmodel.cn)
- 推荐模型：`glm-4-flash`（免费额度充足）

---

## 📋 使用流程

```
① 注册/登录
      ↓
② 上传小说文本（.txt）
      ↓
③ AI 解析 → 生成 YAML 剧本结构
      ↓
④ 下载 YAML / 进入 AI 创作页
      ↓
⑤ 粘贴 YAML → 选择风格 → 一键创作
      ↓
⑥ 流式输出完整剧本文稿 → 复制/下载
```

---

## 🎯 路线图

| 阶段 | 功能 | 状态 |
|------|------|------|
| P1 | 小说→YAML 核心转换 | ✅ 完成 |
| P2 | 支付系统 + AI 创作页 | ✅ 完成 |
| P3 | 云端存储 + 历史记录 | 🔄 规划中 |
| P4 | 多模型支持（GPT / Claude） | 📋 待定 |
| P5 | 协作编辑 + 导出 FDX | 📋 待定 |

---

## 📄 License

MIT © 2024 黎君豪

---

<p align="center">
  <b>幕启 MuQi</b> · 让 AI 成为你的专属编剧助手
</p>
