# 每日热点应用自动化项目

> 日期：2026-08-02
> 自动化生成：热点检索 → 圆桌分析 → H5应用 → SEO模板 → RAG方案

## 项目结构

```
daily-hotspot-app/
├── app/                    # 移动端H5应用
│   ├── index.html          # 主页面
│   ├── styles/main.css     # 主样式
│   ├── js/app.js           # 核心逻辑
│   ├── js/data.js          # 模拟数据
│   ├── js/test.js          # 测试用例
│   ├── test.html           # 测试页面
│   └── README.md           # 应用说明
├── reports/                # 分析报告
│   └── daily_analysis_20260802.md  # 圆桌研讨报告
├── templates/              # 提示词模板
│   └── seo_prompt_template.md      # SEO深度文章模板
├── docs/                   # 技术文档
│   └── rag_solution.md     # RAG系统落地方案
└── README.md               # 本文件
```

## 快速开始

1. 用浏览器打开 `app/index.html` 即可体验H5应用
2. 打开 `app/test.html` 可运行测试用例
3. 查看各目录下的Markdown文档了解完整方案

## 技术栈

- H5应用：HTML5 + CSS3 + 原生JavaScript（零依赖）
- RAG系统：Python + Milvus + LangChain + BGE
- 提示词：Chain-of-Thought推理链
