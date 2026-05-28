# 📡 AI热点雷达 — 每日热点智能追踪平台

> 自动追踪AI领域热点新闻 → 多视角深度分析 → 智能内容创作 → 多平台分发

## 🌟 项目简介

AI热点雷达是一个面向AI领域内容创作者的智能平台，每日自动追踪科技、商业、AI领域热点新闻，通过多视角圆桌分析挖掘核心痛点，辅助深度内容创作。

## 📁 项目结构

```
daily-hotspot-app/
├── app/                          # H5移动端应用
│   └── index.html                # AI热点雷达主应用（移动端优先）
├── reports/                      # 分析报告
│   └── daily_analysis_20250528.md # 每日热点圆桌分析报告
├── templates/                    # 提示词模板
│   └── seo_prompt_template.md    # SEO深度文章生成模板（CoT推理链）
├── docs/                         # 技术文档
│   └── rag_solution.md           # RAG系统落地方案
└── README.md
```

## 🚀 快速开始

### 预览H5应用

```bash
# 方式1：直接打开
open app/index.html

# 方式2：本地服务器
cd app && python3 -m http.server 8080
# 访问 http://localhost:8080
```

## ✨ 功能特性

### 📡 热点追踪
- 全网AI领域热点自动采集
- 热力指数实时计算
- 多维度标签分类（AI大模型、Agent、安全、商业化、开发者）

### 🧠 深度分析
- 模拟行业领袖视角（马斯克、雷军、张一鸣、王兴）
- 痛点优先级矩阵
- 雷达图可视化分析

### 🛠️ 效率工具
- 热点追踪、内容生成、竞品分析
- 知识沉淀、SEO优化、代码助手

### 📱 移动端优先
- 响应式设计，完美适配手机
- 流畅动画与交互体验
- 暗色科技风主题

## 📊 今日热点概览（2025.05.28）

| 排名 | 热点事件 | 热度 |
|------|---------|------|
| 1 | OpenAI o3模型"失控"事件 | 🔥98 |
| 2 | 微软Build 2025：Azure AI Foundry创新 | 🔥95 |
| 3 | DeepSeek R1 0528版本更新 | 🔥93 |
| 4 | 阿里云百炼MCP广场上线 | 🔥91 |
| 5 | 快手可灵AI单季营收破1.5亿 | 🔥88 |

## 🛠️ 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JS（移动端优先）
- **设计**：暗色科技风 + CSS动画 + Canvas雷达图
- **SEO模板**：Chain-of-Thought推理链
- **RAG方案**：Milvus + Elasticsearch + FastAPI + BGE-M3

## 📄 License

MIT License

---

*📅 每日自动更新 | 🤖 AI驱动的内容创作工作流*
