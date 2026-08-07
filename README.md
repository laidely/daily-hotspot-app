# Daily Hotspot App · 每日热点应用

> 自动化生成 · 2026-08-07
> 聚焦 AI 应用、办公自动化、效率工具、开发者趋势的每日热点分析与应用交付

## 项目简介

本项目通过自动化流程完成：全网热点检索 → 圆桌研讨痛点分析 → 移动端 H5 应用开发 → SEO 提示词模板 → RAG 系统方案设计 → 代码托管推送。一站式解决"AI 信息过载 + 工具选择困难"痛点。

## 目录结构

```
.
├── app/                          # 移动端 H5 应用「AI热点效率站」
│   ├── index.html                # 主页面（5大模块）
│   ├── css/style.css             # 样式（响应式 + 深色模式）
│   ├── js/app.js                 # 应用逻辑
│   ├── js/data.js                # Mock 数据
│   └── README.md                 # 应用说明与测试用例
├── reports/                      # 分析报告
│   ├── daily_analysis_20260807.md  # 圆桌研讨痛点分析报告
│   └── execution_report_20260807.md # 执行报告
├── templates/                    # 提示词模板
│   └── seo_prompt_template.md    # Chain-of-Thought SEO 提示词模板 v3.0
├── docs/                         # 技术方案
│   └── rag_solution.md           # RAG 系统落地方案
└── daily_output/                 # 每日汇总输出
    └── 每日热点应用_2026-08-07.md
```

## H5 应用快速体验

```bash
cd app
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080
```

## 技术栈

- **H5 应用**：原生 HTML5 / CSS3 / ES6+，零构建依赖，移动端适配
- **RAG 方案**：FastAPI + Qdrant + bge-m3 + DeepSeek
- **提示词**：Chain-of-Thought 推理链 + 多平台适配

## 功能模块

1. 首页热点流 — 每日 AI 科技热点，下拉刷新/上拉加载
2. 痛点分析 — 马斯克/雷军/张一鸣/王兴圆桌视角
3. 效率工具推荐 — 评分/场景/一键收藏
4. AI 助手对话 — 本地数据驱动智能问答
5. 个人中心 — 收藏/历史/深色模式

## License

MIT
