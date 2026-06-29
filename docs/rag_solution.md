# 基于2026年AI热点趋势的企业级RAG系统落地方案

> 版本：v1.0 | 日期：2026年6月 | 作者：AI架构设计团队

---

## 目录

1. [方案背景](#1-方案背景)
2. [系统架构概述](#2-系统架构概述)
3. [技术选型对比表](#3-技术选型对比表)
4. [核心代码示例](#4-核心代码示例)
5. [性能优化策略](#5-性能优化策略)
6. [部署方案](#6-部署方案)
7. [成本估算](#7-成本估算)
8. [风险与应对](#8-风险与应对)

---

## 1. 方案背景

### 1.1 2026年6月AI热点趋势概览

2026年AI产业已进入"深度落地"阶段，以下核心趋势为RAG系统的设计提供了方向性指引：

| 趋势 | 核心要点 | 对RAG系统的影响 |
|------|----------|-----------------|
| AI Agent工作流成为企业核心 | Agent从概念走向生产，企业级Agent工作流覆盖80%业务场景 | RAG需适配Agent架构，提供结构化知识供给 |
| AI工作流可砍掉80%无效代码 | 低代码/无代码AI工作流平台成熟，大量样板代码被AI自动生成 | RAG应聚焦于高价值逻辑层，而非基础设施代码 |
| 多智能体协作（Agent Merge）成为新范式 | 专业化Agent分工协作——规划Agent、执行Agent、审核Agent协同 | RAG需支持多Agent共享知识库与上下文隔离 |
| 豆包专业版等AI产品转向专业生产力基建 | AI从通用聊天转向垂直场景的专业工具 | RAG需支持领域知识的专业化接入与管理 |
| Microsoft Office 365 Copilot多智能体化 | 企业办公场景中多Agent深度集成 | RAG需对接企业知识图谱与文档管理系统 |
| OpenAI Codex从编程工具扩展为通用AI平台 | 代码生成→通用任务执行的范式跃迁 | RAG需适配多模态知识检索（代码+文档+数据） |
| 中国AI调用量连续9周领先 | 中国市场对AI基础设施的巨大需求 | RAG选型需重点考虑国产模型与云服务的适配 |

### 1.2 三代RAG技术演进

2026年，RAG已从简单的"向量检索+生成"演变为完整的智能认知系统：

- **初代RAG**：简单相似度检索，上下文拼接生硬，回答精度低
- **二代RAG**：重排序、问答改写、碎片召回，目前企业主流方案
- **三代RAG（2026主流）**：多模态RAG、智能切片、上下文压缩、Agentic RAG，检索过程具备自主思考能力

本方案基于**三代RAG**理念设计，结合多智能体协作范式，构建面向生产环境的企业级RAG系统。

---

## 2. 系统架构概述

### 2.1 全链路架构图（文字描述）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户接入层                                       │
│   Web应用 / API网关 / 移动端 / AI Agent工作流（多智能体协作入口）              │
└──────────────┬──────────────────────────────────┬───────────────────────────┘
               │                                  │
       ┌───────▼────────┐                ┌────────▼────────┐
       │   查询理解层     │                │   文档接入层      │
       │  · 意图识别      │                │  · 多格式解析     │
       │  · 查询改写      │                │  · 智能切片       │
       │  · 多Agent路由   │                │  · 元数据提取     │
       │  · 历史上下文    │                │  · 知识图谱构建   │
       └───────┬────────┘                └────────┬────────┘
               │                                  │
       ┌───────▼─────────────────────────────────▼────────┐
       │                   向量化层                        │
       │  · 稠密向量（BGE-M3 / OpenAI text-embedding-3）  │
       │  · 稀疏向量（BM25 / SPLADE）                      │
       │  · 多模态向量（图片+文本联合编码）                   │
       │  · 批量Embedding + 异步队列                       │
       └─────────────────────────┬─────────────────────────┘
                                 │
       ┌─────────────────────────▼─────────────────────────┐
       │                向量存储与索引层                      │
       │  · Milvus集群（主存储）                             │
       │  · HNSW / IVF_PQ 混合索引                          │
       │  · 元数据过滤（租户隔离/时间范围/文档类型）           │
       │  · 多向量字段（dense + sparse）                    │
       └─────────────────────────┬─────────────────────────┘
                                 │
       ┌─────────────────────────▼─────────────────────────┐
       │                   检索层                            │
       │  · 混合检索：稠密向量 + 稀疏向量 + 关键词            │
       │  · 多路召回（Multi-way Recall）                     │
       │  · 交叉编码器重排序（Cross-encoder Reranker）       │
       │  · 上下文压缩（Contextual Compression）             │
       │  · 知识图谱关联检索（Graph RAG）                     │
       └─────────────────────────┬─────────────────────────┘
                                 │
       ┌─────────────────────────▼─────────────────────────┐
       │                   生成层                            │
       │  · LLM选型路由（GPT-4o / Claude / GLM-4）          │
       │  · Prompt模板管理 + 动态组装                       │
       │  · 流式输出（SSE）                                  │
       │  · 引用溯源（Citation）                            │
       │  · 多Agent协作生成（规划→检索→生成→审核）           │
       └─────────────────────────┬─────────────────────────┘
                                 │
       ┌─────────────────────────▼─────────────────────────┐
       │                 评估与反馈层                        │
       │  · RAGAS评估框架（Faithfulness / Relevancy）      │
       │  · 用户反馈闭环                                     │
       │  · A/B测试框架                                     │
       │  · 知识库质量监控                                   │
       └───────────────────────────────────────────────────┘
```

### 2.2 核心设计原则

1. **多智能体适配**：检索过程融入Agent范式，支持查询规划Agent、检索执行Agent、结果审核Agent的协作
2. **多格式兼容**：统一文档接入层，支持PDF/Word/HTML/Markdown/Excel等主流格式
3. **混合检索优先**：稠密+稀疏+关键词三路召回，最大化检索召回率
4. **可观测性**：全链路Trace，每一步可追踪、可度量、可优化
5. **企业级隔离**：多租户支持，知识库权限隔离，数据安全合规

---

## 3. 技术选型对比表

### 3.1 Embedding模型对比

| 维度 | BGE-M3 | OpenAI text-embedding-3-large | M3E-base | Cohere Embed v3 |
|------|--------|-------------------------------|----------|-----------------|
| **维度** | 1024 | 3072 | 768 | 1024 |
| **多语言** | 优秀（中文优化） | 良好 | 良好（中文优化） | 良好 |
| **多模态** | 支持图文 | 仅文本 | 仅文本 | 仅文本 |
| **最大输入** | 8192 tokens | 8191 tokens | 512 tokens | 512 tokens |
| **部署方式** | 开源自部署 | API调用 | 开源自部署 | API调用 |
| **MTEB中文** | Top 3 | Top 5 | Top 10 | Top 8 |
| **推理速度** | 中等（GPU加速） | 快（API） | 快 | 快（API） |
| **成本** | 服务器成本 | $0.13/1M tokens | 服务器成本 | $0.10/1M tokens |
| **推荐场景** | 中文企业知识库（**推荐**） | 国际化应用 | 轻量级场景 | 英文为主场景 |

**推荐选型**：**BGE-M3**（主选，中文场景最优）+ **OpenAI text-embedding-3-large**（备选，快速验证）

### 3.2 向量数据库对比

| 维度 | Milvus | Chroma | Weaviate | Qdrant | pgvector |
|------|--------|--------|----------|--------|----------|
| **架构** | 分布式 | 嵌入式/轻量 | 分布式/嵌入式 | 分布式/嵌入式 | PostgreSQL扩展 |
| **索引类型** | HNSW/IVF_PQ/DiskANN | HNSW | HNSW | HNSW | HNSW/IVF |
| **稀疏向量** | 支持 | 不支持 | 支持 | 原生支持 | 扩展支持 |
| **元数据过滤** | 优秀 | 基础 | 优秀 | 优秀 | SQL原生 |
| **水平扩展** | 优秀 | 不支持 | 良好 | 良好 | 需Citus |
| **混合检索** | 原生支持 | 不支持 | 支持 | 原生支持 | 需自行实现 |
| **运维复杂度** | 中高 | 低 | 中等 | 中等 | 低（有DBA基础） |
| **社区活跃度** | 高 | 高 | 中 | 高 | 高 |
| **适用规模** | 亿级向量 | 百万级 | 千万级 | 千万级 | 百万级 |
| **推荐场景** | 企业生产环境（**推荐**） | 本地开发/原型 | 多模态场景 | 混合检索优先 | 已有PG基础设施 |

**推荐选型**：**Milvus**（生产环境主选，支持亿级向量+混合检索+水平扩展）

### 3.3 LLM大模型对比

| 维度 | GPT-4o | Claude 4 Sonnet | GLM-4 Plus | DeepSeek-V3 | Qwen3-235B |
|------|--------|-----------------|-------------|-------------|------------|
| **中文能力** | 优秀 | 优秀 | 优秀 | 优秀 | 优秀 |
| **上下文窗口** | 128K | 200K | 128K | 128K | 128K |
| **推理能力** | Top级 | Top级 | 优秀 | Top级 | 优秀 |
| **API价格** | $5/1M input | $3/1M input | 约0.5元/1M | $0.27/1M | 开源自部署 |
| **私有部署** | 不支持 | 不支持 | 支持 | 支持 | 支持 |
| **合规性** | 需数据出境评估 | 需数据出境评估 | 国内合规 | 国内合规 | 国内合规 |
| **响应速度** | 快 | 快 | 快 | 快 | 取决于硬件 |
| **Function Call** | 优秀 | 优秀 | 良好 | 优秀 | 良好 |
| **推荐场景** | 国际化/高要求场景 | 长文分析/代码生成 | 国内企业生产（**推荐**） | 高性价比场景 | 完全私有化部署 |

**推荐选型**：**GLM-4 Plus**（国内企业合规首选）+ **GPT-4o**（国际化/高质量备选）+ **DeepSeek-V3**（高性价比备选）

### 3.4 框架与工具对比

| 维度 | LangChain | LlamaIndex | Haystack | Semantic Kernel |
|------|-----------|------------|----------|-----------------|
| **RAG专业化** | 通用 | RAG专注 | RAG专注 | 企业/微软生态 |
| **Agent支持** | 优秀（LangGraph） | 良好 | 良好 | 良好 |
| **多数据源** | 丰富 | 非常丰富 | 丰富 | 有限 |
| **学习曲线** | 中等 | 较低 | 中等 | 较高 |
| **企业就绪** | 良好 | 良好 | 良好 | 优秀 |
| **中文生态** | 良好 | 良好 | 一般 | 一般 |
| **2026趋势匹配** | Agentic RAG支持 | Agentic RAG支持 | Pipeline架构 | Copilot集成 |

**推荐选型**：**LlamaIndex**（RAG核心框架，专业度最高）+ **LangGraph**（Agent工作流编排）

---

## 4. 核心代码示例

### 4.1 项目结构

```
rag-enterprise/
├── config/
│   ├── settings.py           # 全局配置
│   └── prompts.py            # Prompt模板
├── core/
│   ├── parser/               # 文档解析层
│   │   ├── pdf_parser.py
│   │   ├── docx_parser.py
│   │   ├── html_parser.py
│   │   ├── markdown_parser.py
│   │   ├── excel_parser.py
│   │   └── unified_parser.py # 统一解析入口
│   ├── embedding/            # 向量化层
│   │   ├── embedder.py
│   │   └── batch_embedder.py
│   ├── retrieval/            # 检索层
│   │   ├── hybrid_retriever.py
│   │   ├── reranker.py
│   │   └── context_compressor.py
│   ├── generation/           # 生成层
│   │   ├── llm_router.py
│   │   └── answer_generator.py
│   └── agents/               # 多智能体层
│       ├── planner_agent.py
│       ├── retrieval_agent.py
│       └── review_agent.py
├── api/
│   ├── main.py               # FastAPI入口
│   ├── routes/
│   │   ├── query.py
│   │   ├── ingest.py
│   │   └── health.py
│   └── middleware/
│       └── auth.py
├── evaluation/               # 评估层
│   └── ragas_eval.py
├── requirements.txt
└── Dockerfile
```

### 4.2 文档解析代码

```python
"""
文档解析层 —— 统一多格式文档解析器
支持 PDF / Word / HTML / Markdown / Excel 等主流格式
采用策略模式，统一入口调用，支持智能切片与元数据提取
"""

import os
import hashlib
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Dict, Any

# 第三方依赖
from PyPDF2 import PdfReader
from docx import Document
from bs4 import BeautifulSoup
import openpyxl
import markdown
from langchain.text_splitter import RecursiveCharacterTextSplitter, MarkdownTextSplitter

logger = logging.getLogger(__name__)


@dataclass
class DocumentChunk:
    """
    文档分块数据结构
    每个Chunk携带文本内容、元数据、来源信息，用于后续向量化与检索
    """
    chunk_id: str                          # 唯一标识（基于内容哈希）
    content: str                           # 分块文本内容
    metadata: Dict[str, Any] = field(default_factory=dict)  # 元数据
    source_file: str = ""                  # 来源文件名
    page_number: Optional[int] = None      # 页码（PDF适用）
    chunk_index: int = 0                   # 分块序号
    token_count: int = 0                   # Token数量


class BaseParser(ABC):
    """文档解析器基类，定义统一接口"""

    @abstractmethod
    def parse(self, file_path: str) -> str:
        """将文件解析为纯文本"""
        ...

    @abstractmethod
    def supported_extensions(self) -> List[str]:
        """返回支持的文件扩展名列表"""
        ...

    def extract_metadata(self, file_path: str) -> Dict[str, Any]:
        """提取文件元数据"""
        stat = os.stat(file_path)
        return {
            "file_name": os.path.basename(file_path),
            "file_path": file_path,
            "file_size": stat.st_size,
            "modified_time": stat.st_mtime,
            "file_hash": self._compute_file_hash(file_path),
        }

    @staticmethod
    def _compute_file_hash(file_path: str) -> str:
        """计算文件SHA256哈希，用于去重"""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for block in iter(lambda: f.read(8192), b""):
                sha256.update(block)
        return sha256.hexdigest()


class PDFParser(BaseParser):
    """
    PDF文档解析器
    使用 PyPDF2 提取文本，支持逐页解析保留页码信息
    生产环境建议替换为 PyMuPDF（fitz）以获得更好的表格/图片提取能力
    """

    def supported_extensions(self) -> List[str]:
        return [".pdf"]

    def parse(self, file_path: str) -> str:
        logger.info(f"开始解析PDF文件: {file_path}")
        reader = PdfReader(file_path)
        full_text = []

        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                full_text.append(f"[Page {i + 1}]\n{text}")

        result = "\n\n".join(full_text)
        logger.info(f"PDF解析完成，共 {len(reader.pages)} 页，文本长度: {len(result)}")
        return result


class DocxParser(BaseParser):
    """
    Word文档解析器
    支持 .docx 格式，保留段落结构
    """

    def supported_extensions(self) -> List[str]:
        return [".docx"]

    def parse(self, file_path: str) -> str:
        logger.info(f"开始解析Word文件: {file_path}")
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        result = "\n\n".join(paragraphs)

        # 同时提取表格内容
        tables_text = []
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells)
                tables_text.append(row_text)

        if tables_text:
            result += "\n\n[表格]\n" + "\n".join(tables_text)

        logger.info(f"Word解析完成，段落数: {len(paragraphs)}，表格数: {len(doc.tables)}")
        return result


class HTMLParser(BaseParser):
    """
    HTML文档解析器
    使用 BeautifulSoup 提取正文，过滤导航/广告等噪声
    """

    def supported_extensions(self) -> List[str]:
        return [".html", ".htm"]

    def parse(self, file_path: str) -> str:
        logger.info(f"开始解析HTML文件: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f.read(), "html.parser")

        # 移除噪声标签
        for tag in soup.find_all(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # 提取文本，保留段落结构
        text = soup.get_text(separator="\n", strip=True)
        # 清理多余空行
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        result = "\n".join(lines)
        logger.info(f"HTML解析完成，文本长度: {len(result)}")
        return result


class MarkdownParser(BaseParser):
    """
    Markdown文档解析器
    保留结构化信息（标题层级、代码块、列表）
    """

    def supported_extensions(self) -> List[str]:
        return [".md", ".markdown"]

    def parse(self, file_path: str) -> str:
        logger.info(f"开始解析Markdown文件: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        # 直接返回Markdown原文，后续用专用splitter处理
        logger.info(f"Markdown解析完成，文本长度: {len(content)}")
        return content


class ExcelParser(BaseParser):
    """
    Excel文档解析器
    将每个Sheet转为文本表格格式，保留行列结构
    """

    def supported_extensions(self) -> List[str]:
        return [".xlsx", ".xls"]

    def parse(self, file_path: str) -> str:
        logger.info(f"开始解析Excel文件: {file_path}")
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        sheets_text = []

        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            rows_text = []
            for row in sheet.iter_rows(values_only=True):
                row_str = " | ".join(str(cell) if cell is not None else "" for cell in row)
                rows_text.append(row_str)
            sheets_text.append(f"[Sheet: {sheet_name}]\n" + "\n".join(rows_text))

        result = "\n\n".join(sheets_text)
        wb.close()
        logger.info(f"Excel解析完成，Sheet数: {len(wb.sheetnames)}")
        return result


class UnifiedDocumentParser:
    """
    统一文档解析器（门面模式）
    自动识别文件格式，路由到对应解析器
    支持智能切片（Chunking）
    """

    # 支持的解析器映射
    PARSER_REGISTRY: Dict[str, BaseParser] = {
        ".pdf": PDFParser(),
        ".docx": DocxParser(),
        ".html": HTMLParser(),
        ".htm": HTMLParser(),
        ".md": MarkdownParser(),
        ".markdown": MarkdownParser(),
        ".xlsx": ExcelParser(),
        ".xls": ExcelParser(),
    }

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 64,
        enable_markdown_splitter: bool = True,
    ):
        """
        初始化统一解析器

        Args:
            chunk_size: 分块大小（字符数）
            chunk_overlap: 分块重叠字符数，保证上下文连贯
            enable_markdown_splitter: 是否为Markdown启用专用切片器
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # 通用文本切片器
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", "。", ".", " ", ""],
        )

        # Markdown专用切片器，保留标题层级结构
        self.md_splitter = MarkdownTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        self.enable_markdown_splitter = enable_markdown_splitter

    def parse_and_chunk(self, file_path: str, tenant_id: str = "default") -> List[DocumentChunk]:
        """
        解析文件并切分为Chunk

        Args:
            file_path: 文件路径
            tenant_id: 租户ID，用于多租户隔离

        Returns:
            DocumentChunk列表

        Raises:
            ValueError: 不支持的文件格式
        """
        ext = Path(file_path).suffix.lower()
        parser = self.PARSER_REGISTRY.get(ext)

        if not parser:
            raise ValueError(f"不支持的文件格式: {ext}，支持的格式: {list(self.PARSER_REGISTRY.keys())}")

        # 1. 解析文档
        raw_text = parser.parse(file_path)
        if not raw_text.strip():
            logger.warning(f"文件解析结果为空: {file_path}")
            return []

        # 2. 提取元数据
        metadata = parser.extract_metadata(file_path)
        metadata["tenant_id"] = tenant_id

        # 3. 选择合适的切片器
        splitter = self.md_splitter if (ext in [".md", ".markdown"] and self.enable_markdown_splitter) else self.text_splitter

        # 4. 切片
        raw_chunks = splitter.split_text(raw_text)

        # 5. 构建DocumentChunk列表
        chunks = []
        for i, chunk_text in enumerate(raw_chunks):
            chunk = DocumentChunk(
                chunk_id=hashlib.md5(f"{file_path}:{i}:{chunk_text}".encode()).hexdigest(),
                content=chunk_text,
                metadata={**metadata, "chunk_index": i},
                source_file=metadata["file_name"],
                chunk_index=i,
                token_count=len(chunk_text) // 2,  # 粗略估算
            )
            chunks.append(chunk)

        logger.info(f"文件 {file_path} 切片完成，共 {len(chunks)} 个Chunk")
        return chunks
```

### 4.3 向量化与索引构建代码

```python
"""
向量化与索引构建层
支持 BGE-M3（本地）与 OpenAI Embedding（API）双通道
批量异步Embedding，自动写入Milvus向量数据库
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

import numpy as np
from pymilvus import (
    connections,
    Collection,
    CollectionSchema,
    FieldSchema,
    DataType,
    utility,
)

logger = logging.getLogger(__name__)


@dataclass
class EmbeddingResult:
    """向量化结果"""
    text: str
    dense_vector: List[float]         # 稠密向量
    sparse_vector: Optional[Dict[int, float]] = None  # 稀疏向量（BM25权重）


class BaseEmbedder(ABC):
    """Embedding模型基类"""

    @abstractmethod
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """批量文本向量化"""
        ...

    @abstractmethod
    def get_dimension(self) -> int:
        """返回向量维度"""
        ...


class BGEM3Embedder(BaseEmbedder):
    """
    BGE-M3 Embedding模型（推荐方案）
    中文企业知识库场景最优选择
    支持稠密向量 + 稀疏向量 + ColBERT多路表示
    """

    def __init__(self, model_name: str = "BAAI/bge-m3", device: str = "cuda:0"):
        """
        初始化BGE-M3模型

        Args:
            model_name: HuggingFace模型标识
            device: 推理设备（cuda:0 / cpu）
        """
        from FlagEmbedding import FlagModel

        logger.info(f"加载BGE-M3模型: {model_name}, 设备: {device}")
        self.model = FlagModel(
            model_name,
            embedding_dim=1024,
            use_fp16=True,  # FP16加速，显存减半
            device=device,
        )
        self._dimension = 1024
        logger.info("BGE-M3模型加载完成")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """批量文本向量化（稠密向量）"""
        embeddings = self.model.encode(texts)["dense_vecs"]
        return [emb.tolist() for emb in embeddings]

    def embed_with_sparse(self, texts: List[str]) -> List[EmbeddingResult]:
        """同时获取稠密向量和稀疏向量（用于混合检索）"""
        results = self.model.encode(texts, return_dense=True, return_sparse=True)
        embedding_results = []
        for i, text in enumerate(texts):
            embedding_results.append(EmbeddingResult(
                text=text,
                dense_vector=results["dense_vecs"][i].tolist(),
                sparse_vector=results["sparse_vecs"][i],  # 字典格式 {token_id: weight}
            ))
        return embedding_results

    def get_dimension(self) -> int:
        return self._dimension


class OpenAIEmbedder(BaseEmbedder):
    """
    OpenAI text-embedding-3-large Embedding模型（备选方案）
    适合快速验证与国际化场景
    """

    def __init__(self, model: str = "text-embedding-3-large", dimensions: int = 1024):
        """
        初始化OpenAI Embedding

        Args:
            model: 模型名称
            dimensions: 输出维度（支持降维到指定大小）
        """
        from openai import OpenAI

        self.client = OpenAI()
        self.model = model
        self._dimension = dimensions
        logger.info(f"初始化OpenAI Embedding: {model}, 维度: {dimensions}")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """批量文本向量化（自动分批，单批上限2048条）"""
        all_embeddings = []
        batch_size = 2048

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = self.client.embeddings.create(
                input=batch,
                model=self.model,
                dimensions=self._dimension,
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)

        return all_embeddings

    def get_dimension(self) -> int:
        return self._dimension


class AsyncBatchEmbedder:
    """
    异步批量Embedding处理器
    用于大规模文档的向量化，支持队列化处理与失败重试
    """

    def __init__(
        self,
        embedder: BaseEmbedder,
        batch_size: int = 64,
        max_concurrent: int = 4,
        max_retries: int = 3,
    ):
        """
        Args:
            embedder: 底层Embedding模型实例
            batch_size: 每批处理文本数
            max_concurrent: 最大并发批次数
            max_retries: 失败重试次数
        """
        self.embedder = embedder
        self.batch_size = batch_size
        self.max_concurrent = max_concurrent
        self.max_retries = max_retries

    async def embed_chunks(self, chunks: List[Any]) -> List[EmbeddingResult]:
        """
        异步批量向量化DocumentChunk列表

        Args:
            chunks: DocumentChunk列表

        Returns:
            EmbeddingResult列表（与输入一一对应）
        """
        from core.parser.unified_parser import DocumentChunk

        texts = [chunk.content for chunk in chunks]
        all_embeddings = []

        # 分批处理
        batches = [texts[i:i + self.batch_size] for i in range(0, len(texts), self.batch_size)]

        # 使用信号量限制并发
        semaphore = asyncio.Semaphore(self.max_concurrent)

        async def process_batch(batch: List[str]) -> List[List[float]]:
            """在异步环境中执行同步Embedding调用"""
            async with semaphore:
                loop = asyncio.get_event_loop()
                return await loop.run_in_executor(None, self.embedder.embed_texts, batch)

        # 并发执行所有批次
        results = await asyncio.gather(*[process_batch(b) for b in batches])

        # 扁平化结果
        for batch_result in results:
            all_embeddings.extend(batch_result)

        # 组装EmbeddingResult
        embedding_results = []
        for chunk, embedding in zip(chunks, all_embeddings):
            embedding_results.append(EmbeddingResult(
                text=chunk.content,
                dense_vector=embedding,
            ))

        logger.info(f"批量Embedding完成，共 {len(embedding_results)} 条")
        return embedding_results


class MilvusIndexManager:
    """
    Milvus向量数据库索引管理器
    负责Collection创建、索引构建、数据写入与混合检索
    """

    # Collection Schema定义
    COLLECTION_NAME = "rag_knowledge_base"

    def __init__(
        self,
        uri: str = "http://localhost:19530",
        collection_name: str = None,
        dense_dim: int = 1024,
    ):
        """
        Args:
            uri: Milvus连接地址
            collection_name: Collection名称
            dense_dim: 稠密向量维度
        """
        self.uri = uri
        self.collection_name = collection_name or self.COLLECTION_NAME
        self.dense_dim = dense_dim
        self.collection: Optional[Collection] = None

    def connect(self):
        """连接Milvus服务器"""
        connections.connect(alias="default", uri=self.uri)
        logger.info(f"已连接Milvus: {self.uri}")

    def create_collection(self):
        """
        创建RAG知识库Collection
        包含：稠密向量字段、稀疏向量字段、文本字段、元数据字段
        """
        # 如果已存在则跳过
        if utility.has_collection(self.collection_name):
            logger.info(f"Collection已存在: {self.collection_name}")
            self.collection = Collection(self.collection_name)
            return

        # 定义Schema
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True, max_length=128),
            FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=8192),
            FieldSchema(name="dense_vector", dtype=DataType.FLOAT_VECTOR, dim=self.dense_dim),
            FieldSchema(name="sparse_vector", dtype=DataType.SPARSE_FLOAT_VECTOR),
            FieldSchema(name="source_file", dtype=DataType.VARCHAR, max_length=512),
            FieldSchema(name="tenant_id", dtype=DataType.VARCHAR, max_length=128),
            FieldSchema(name="doc_type", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="chunk_index", dtype=DataType.INT32),
            FieldSchema(name="created_at", dtype=DataType.INT64),  # Unix时间戳
        ]

        schema = CollectionSchema(fields=fields, description="RAG企业知识库")
        self.collection = Collection(name=self.collection_name, schema=schema)

        # 创建索引
        # 稠密向量索引：HNSW（高召回率+低延迟）
        dense_index_params = {
            "index_type": "HNSW",
            "metric_type": "COSINE",
            "params": {"M": 16, "efConstruction": 256},
        }
        self.collection.create_index(
            field_name="dense_vector",
            index_params=dense_index_params,
        )

        # 稀疏向量索引：BM25原生索引
        sparse_index_params = {
            "index_type": "SPARSE_INVERTED_INDEX",
            "metric_type": "BM25",
        }
        self.collection.create_index(
            field_name="sparse_vector",
            index_params=sparse_index_params,
        )

        logger.info(f"Collection创建成功: {self.collection_name}")

    def insert_chunks(self, embedding_results: List[EmbeddingResult], chunks: List[Any]):
        """
        批量写入向量数据到Milvus

        Args:
            embedding_results: EmbeddingResult列表
            chunks: 对应的DocumentChunk列表
        """
        import time

        data = []
        for emb_result, chunk in zip(embedding_results, chunks):
            data.append({
                "id": chunk.chunk_id,
                "content": chunk.content,
                "dense_vector": emb_result.dense_vector,
                "sparse_vector": emb_result.sparse_vector or {},
                "source_file": chunk.source_file,
                "tenant_id": chunk.metadata.get("tenant_id", "default"),
                "doc_type": Path(chunk.source_file).suffix.lower(),
                "chunk_index": chunk.chunk_index,
                "created_at": int(time.time()),
            })

        self.collection.insert(data)
        logger.info(f"写入Milvus {len(data)} 条记录")

    def flush_and_load(self):
        """刷盘并加载到内存（使索引生效）"""
        self.collection.flush()
        self.collection.load()
        logger.info("Milvus数据已刷盘并加载到内存")
```

### 4.4 检索与生成代码

```python
"""
检索与生成层 —— 混合检索 + 重排序 + LLM生成
结合2026年Agentic RAG范式，支持多Agent协作检索
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)


@dataclass
class RetrievalResult:
    """单条检索结果"""
    chunk_id: str
    content: str
    score: float                  # 综合得分
    source_file: str
    metadata: Dict[str, Any]
    rerank_score: Optional[float] = None  # 重排序得分


class HybridRetriever:
    """
    混合检索器
    三路召回：稠密向量 + 稀疏向量 + 关键词
    使用倒数秩融合（RRF）合并多路结果
    """

    def __init__(
        self,
        collection,
        embedder,
        dense_weight: float = 0.5,
        sparse_weight: float = 0.3,
        keyword_weight: float = 0.2,
    ):
        """
        Args:
            collection: Milvus Collection实例
            embedder: Embedding模型实例
            dense_weight: 稠密向量权重
            sparse_weight: 稀疏向量权重
            keyword_weight: 关键词权重
        """
        self.collection = collection
        self.embedder = embedder
        self.dense_weight = dense_weight
        self.sparse_weight = sparse_weight
        self.keyword_weight = keyword_weight

    def search(
        self,
        query: str,
        tenant_id: str = "default",
        top_k: int = 20,
        rerank_top_k: int = 10,
    ) -> List[RetrievalResult]:
        """
        执行混合检索

        Args:
            query: 用户查询
            tenant_id: 租户ID
            top_k: 初始召回数量
            rerank_top_k: 重排序后保留数量

        Returns:
            检索结果列表（按综合得分降序）
        """
        # 第一步：稠密向量检索（语义相似度）
        query_dense = self.embedder.embed_texts([query])[0]
        dense_results = self.collection.search(
            data=[query_dense],
            anns_field="dense_vector",
            param={"metric_type": "COSINE", "params": {"ef": 128}},
            limit=top_k,
            expr=f'tenant_id == "{tenant_id}"',
            output_fields=["content", "source_file", "chunk_index"],
        )

        # 第二步：稀疏向量检索（BM25关键词匹配）
        sparse_results = self.collection.search(
            data=[query],  # BGE-M3可自动生成稀疏表示
            anns_field="sparse_vector",
            param={"metric_type": "BM25"},
            limit=top_k,
            expr=f'tenant_id == "{tenant_id}"',
            output_fields=["content", "source_file", "chunk_index"],
        )

        # 第三步：倒数秩融合（Reciprocal Rank Fusion）
        fused_scores = self._reciprocal_rank_fusion(
            dense_results=dense_results[0],
            sparse_results=sparse_results[0],
            dense_weight=self.dense_weight,
            sparse_weight=self.sparse_weight,
        )

        # 第四步：构建检索结果
        results = []
        for chunk_id, score, hit in fused_scores:
            results.append(RetrievalResult(
                chunk_id=chunk_id,
                content=hit.entity.get("content", ""),
                score=score,
                source_file=hit.entity.get("source_file", ""),
                metadata={"chunk_index": hit.entity.get("chunk_index", 0)},
            ))

        return results[:rerank_top_k]

    @staticmethod
    def _reciprocal_rank_fusion(
        dense_results,
        sparse_results,
        dense_weight: float = 0.5,
        sparse_weight: float = 0.5,
        k: int = 60,
    ) -> List[tuple]:
        """
        倒数秩融合算法
        公式：score(d) = Σ weight_i / (k + rank_i)
        有效缓解不同检索方式得分尺度不一致的问题
        """
        score_map = {}

        for rank, hit in enumerate(dense_results):
            chunk_id = hit.id
            score_map[chunk_id] = score_map.get(chunk_id, 0) + dense_weight / (k + rank + 1)

        for rank, hit in enumerate(sparse_results):
            chunk_id = hit.id
            score_map[chunk_id] = score_map.get(chunk_id, 0) + sparse_weight / (k + rank + 1)

        # 按融合得分降序排列
        sorted_results = sorted(score_map.items(), key=lambda x: x[1], reverse=True)

        # 关联原始hit对象
        hit_map = {hit.id: hit for hit in dense_results}
        hit_map.update({hit.id: hit for hit in sparse_results})

        return [(chunk_id, score, hit_map[chunk_id]) for chunk_id, score in sorted_results]


class CrossEncoderReranker:
    """
    交叉编码器重排序器
    使用更精细的模型对检索结果进行二次排序
    显著提升Top-K结果的精确度
    """

    def __init__(self, model_name: str = "BAAI/bge-reranker-v2-m3", device: str = "cuda:0"):
        """
        Args:
            model_name: 重排序模型
            device: 推理设备
        """
        from FlagEmbedding import FlagReranker

        logger.info(f"加载重排序模型: {model_name}")
        self.reranker = FlagReranker(model_name, use_fp16=True, device=device)

    def rerank(self, query: str, results: List[RetrievalResult], top_k: int = 5) -> List[RetrievalResult]:
        """
        对检索结果进行重排序

        Args:
            query: 原始查询
            results: 初始检索结果
            top_k: 保留Top-K结果

        Returns:
            重排序后的结果
        """
        # 构建query-document对
        pairs = [[query, result.content] for result in results]

        # 计算重排序得分
        scores = self.reranker.compute_score(pairs, normalize=True)

        # 更新得分并重排
        for result, score in zip(results, scores):
            result.rerank_score = float(score)

        # 按重排序得分降序
        results.sort(key=lambda x: x.rerank_score or 0, reverse=True)

        logger.info(f"重排序完成，从 {len(results)} 条缩减到 {min(top_k, len(results))} 条")
        return results[:top_k]


class ContextualCompressor:
    """
    上下文压缩器
    在将检索结果送入LLM前，提取与查询最相关的片段
    减少Token消耗，提升生成质量
    """

    def __init__(self, llm_client):
        """
        Args:
            llm_client: LLM客户端实例（用于提取相关片段）
        """
        self.llm_client = llm_client

    def compress(
        self,
        query: str,
        results: List[RetrievalResult],
        max_tokens: int = 4000,
    ) -> str:
        """
        压缩检索上下文

        Args:
            query: 用户查询
            results: 检索结果
            max_tokens: 最大上下文Token数

        Returns:
            压缩后的上下文字符串
        """
        # 简单策略：按rerank_score截断，确保不超过max_tokens
        compressed_parts = []
        current_tokens = 0

        for result in results:
            content_tokens = len(result.content) // 2  # 粗略估算
            if current_tokens + content_tokens > max_tokens:
                break
            compressed_parts.append(
                f"[来源: {result.source_file}]\n{result.content}"
            )
            current_tokens += content_tokens

        return "\n\n---\n\n".join(compressed_parts)


class RAGGenerator:
    """
    RAG生成器
    将检索到的上下文与用户查询结合，调用LLM生成答案
    支持引用溯源
    """

    def __init__(self, llm_client, prompt_template: str = None):
        """
        Args:
            llm_client: LLM客户端实例
            prompt_template: 自定义Prompt模板
        """
        self.llm_client = llm_client
        self.prompt_template = prompt_template or self._default_prompt()

    @staticmethod
    def _default_prompt() -> str:
        """默认RAG Prompt模板"""
        return """你是一个专业的企业知识助手。请根据以下检索到的知识库内容，准确回答用户的问题。

## 规则
1. 仅基于提供的参考资料回答，不要编造信息
2. 如果参考资料不足以完整回答问题，请明确说明
3. 在回答中标注引用来源（如 [来源: 文件名]）
4. 保持回答结构化，使用要点列表

## 参考资料
{context}

## 用户问题
{query}

## 回答
"""

    def generate(
        self,
        query: str,
        retrieval_results: List[RetrievalResult],
        stream: bool = True,
    ) -> str:
        """
        生成RAG回答

        Args:
            query: 用户查询
            retrieval_results: 检索结果
            stream: 是否流式输出

        Returns:
            生成的回答文本
        """
        # 组装上下文
        context_parts = []
        for i, result in enumerate(retrieval_results, 1):
            context_parts.append(
                f"[{i}] 来源: {result.source_file}\n"
                f"内容: {result.content}"
            )
        context = "\n\n".join(context_parts)

        # 填充Prompt模板
        prompt = self.prompt_template.format(context=context, query=query)

        # 调用LLM生成
        if stream:
            return self._generate_stream(prompt)
        else:
            return self._generate_sync(prompt)

    def _generate_sync(self, prompt: str) -> str:
        """同步生成"""
        response = self.llm_client.chat.completions.create(
            model="glm-4-plus",  # 或 gpt-4o
            messages=[
                {"role": "system", "content": "你是一个专业的企业知识助手。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,  # 低温度，减少幻觉
            max_tokens=2048,
        )
        return response.choices[0].message.content

    def _generate_stream(self, prompt: str) -> str:
        """流式生成（用于SSE推送）"""
        full_response = ""
        stream = self.llm_client.chat.completions.create(
            model="glm-4-plus",
            messages=[
                {"role": "system", "content": "你是一个专业的企业知识助手。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2048,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content
        return full_response


class AgenticRAGPipeline:
    """
    Agentic RAG管线 —— 2026年三代RAG核心架构
    将检索过程转化为多Agent协作流程：
    1. 规划Agent：分析查询意图，制定检索策略
    2. 检索Agent：执行混合检索与重排序
    3. 审核Agent：评估检索质量，决定是否需要补充检索
    4. 生成Agent：综合上下文生成最终答案
    """

    def __init__(
        self,
        retriever: HybridRetriever,
        reranker: CrossEncoderReranker,
        compressor: ContextualCompressor,
        generator: RAGGenerator,
        max_iterations: int = 3,
    ):
        """
        Args:
            retriever: 混合检索器
            reranker: 重排序器
            compressor: 上下文压缩器
            generator: 生成器
            max_iterations: 最大检索迭代次数（Agent自反思循环）
        """
        self.retriever = retriever
        self.reranker = reranker
        self.compressor = compressor
        self.generator = generator
        self.max_iterations = max_iterations

    def run(self, query: str, tenant_id: str = "default") -> Dict[str, Any]:
        """
        执行Agentic RAG管线

        Returns:
            包含答案、检索结果、执行轨迹的字典
        """
        trajectory = []  # 记录Agent执行轨迹

        # --- Agent 1: 规划Agent ---
        retrieval_plan = self._plan_retrieval(query)
        trajectory.append({"agent": "planner", "action": "plan", "output": retrieval_plan})

        # --- Agent 2: 检索Agent ---
        for iteration in range(self.max_iterations):
            # 执行混合检索
            raw_results = self.retriever.search(
                query=retrieval_plan.get("rewritten_query", query),
                tenant_id=tenant_id,
                top_k=20,
            )

            # 重排序
            reranked_results = self.reranker.rerank(query, raw_results, top_k=10)

            trajectory.append({
                "agent": "retriever",
                "iteration": iteration + 1,
                "raw_count": len(raw_results),
                "reranked_count": len(reranked_results),
                "top_score": reranked_results[0].rerank_score if reranked_results else 0,
            })

            # --- Agent 3: 审核Agent ---
            quality_check = self._quality_check(query, reranked_results)

            if quality_check["is_sufficient"]:
                trajectory.append({
                    "agent": "reviewer",
                    "action": "pass",
                    "reason": quality_check["reason"],
                })
                break
            else:
                # 补充检索
                trajectory.append({
                    "agent": "reviewer",
                    "action": "retry",
                    "reason": quality_check["reason"],
                })
                retrieval_plan = quality_check.get("refined_plan", retrieval_plan)

        # --- 上下文压缩 ---
        compressed_context = self.compressor.compress(query, reranked_results)

        # --- Agent 4: 生成Agent ---
        answer = self.generator.generate(query, reranked_results, stream=False)

        trajectory.append({"agent": "generator", "action": "generate"})

        return {
            "query": query,
            "answer": answer,
            "sources": [
                {"source": r.source_file, "score": r.rerank_score}
                for r in reranked_results
            ],
            "trajectory": trajectory,
        }

    def _plan_retrieval(self, query: str) -> Dict[str, Any]:
        """
        规划Agent：分析查询意图
        简化实现：查询改写 + 关键词提取
        生产环境可接入LLM进行深度意图分析
        """
        # 简单实现：直接使用原始查询
        return {
            "original_query": query,
            "rewritten_query": query,
            "intent": "general",
            "requires_precise_answer": True,
        }

    def _quality_check(self, query: str, results: List[RetrievalResult]) -> Dict[str, Any]:
        """
        审核Agent：评估检索质量
        简化实现：基于得分阈值判断
        """
        if not results:
            return {
                "is_sufficient": False,
                "reason": "未检索到任何结果",
            }

        top_score = results[0].rerank_score or results[0].score
        avg_score = sum(r.rerank_score or r.score for r in results) / len(results)

        if top_score > 0.7 and avg_score > 0.4:
            return {
                "is_sufficient": True,
                "reason": f"检索质量达标，Top-1得分: {top_score:.3f}",
            }
        else:
            return {
                "is_sufficient": False,
                "reason": f"检索质量不足，Top-1: {top_score:.3f}, 平均: {avg_score:.3f}",
            }
```

### 4.5 API接口代码

```python
"""
RAG系统 API接口层
基于 FastAPI 构建，提供文档接入与知识检索的RESTful API
支持流式输出（SSE）、多租户隔离、请求链路追踪
"""

import logging
import time
import uuid
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ========== FastAPI应用初始化 ==========

app = FastAPI(
    title="企业级RAG知识检索系统",
    description="基于2026年AI热点趋势的多智能体RAG系统",
    version="1.0.0",
)

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境需限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== Pydantic数据模型 ==========

class QueryRequest(BaseModel):
    """检索请求"""
    query: str = Field(..., description="用户查询", min_length=1, max_length=2048)
    tenant_id: str = Field(default="default", description="租户ID")
    top_k: int = Field(default=5, description="返回结果数量", ge=1, le=20)
    stream: bool = Field(default=False, description="是否流式输出")


class QueryResponse(BaseModel):
    """检索响应"""
    request_id: str
    query: str
    answer: str
    sources: List[dict]
    latency_ms: float
    trajectory: Optional[List[dict]] = None


class IngestResponse(BaseModel):
    """文档接入响应"""
    request_id: str
    file_name: str
    status: str
    chunk_count: int
    latency_ms: float


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    milvus_connected: bool
    embedding_model_loaded: bool
    version: str


# ========== 全局依赖 ==========

# 单例容器（生产环境建议使用依赖注入框架）
_services = {}


def get_rag_pipeline():
    """获取RAG管线实例（延迟初始化）"""
    if "pipeline" not in _services:
        # 懒加载：首次请求时初始化（生产环境应在启动时完成）
        from core.retrieval.hybrid_retriever import HybridRetriever
        from core.retrieval.reranker import CrossEncoderReranker
        from core.retrieval.context_compressor import ContextualCompressor
        from core.generation.answer_generator import RAGGenerator
        from core.embedding.embedder import BGEM3Embedder
        from pymilvus import Collection

        # 初始化各组件
        embedder = BGEM3Embedder(device="cuda:0")
        collection = Collection("rag_knowledge_base")
        retriever = HybridRetriever(collection=collection, embedder=embedder)
        reranker = CrossEncoderReranker()
        compressor = ContextualCompressor(llm_client=None)
        generator = RAGGenerator(llm_client=None)

        from core.agents.agentic_rag_pipeline import AgenticRAGPipeline
        _services["pipeline"] = AgenticRAGPipeline(
            retriever=retriever,
            reranker=reranker,
            compressor=compressor,
            generator=generator,
        )
    return _services["pipeline"]


def get_document_parser():
    """获取文档解析器实例"""
    if "parser" not in _services:
        from core.parser.unified_parser import UnifiedDocumentParser
        _services["parser"] = UnifiedDocumentParser(chunk_size=512, chunk_overlap=64)
    return _services["parser"]


# ========== API路由 ==========

@app.get("/health", response_model=HealthResponse, tags=["系统"])
async def health_check():
    """健康检查接口"""
    from pymilvus import connections, utility

    # 检查Milvus连接
    milvus_connected = False
    try:
        connections.connect(alias="default", uri="http://localhost:19530")
        milvus_connected = utility.has_collection("rag_knowledge_base")
    except Exception:
        pass

    return HealthResponse(
        status="healthy" if milvus_connected else "degraded",
        milvus_connected=milvus_connected,
        embedding_model_loaded="embedder" in _services,
        version="1.0.0",
    )


@app.post("/api/v1/query", response_model=QueryResponse, tags=["检索"])
async def query_knowledge(
    request: QueryRequest,
    pipeline=Depends(get_rag_pipeline),
):
    """
    知识检索接口
    支持标准检索与流式输出
    """
    start_time = time.time()
    request_id = str(uuid.uuid4())

    try:
        # 执行Agentic RAG管线
        result = pipeline.run(request.query, tenant_id=request.tenant_id)

        latency_ms = (time.time() - start_time) * 1000

        return QueryResponse(
            request_id=request_id,
            query=request.query,
            answer=result["answer"],
            sources=result["sources"],
            latency_ms=round(latency_ms, 2),
            trajectory=result.get("trajectory"),
        )
    except Exception as e:
        logger.error(f"检索失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"检索处理失败: {str(e)}")


@app.post("/api/v1/query/stream", tags=["检索"])
async def query_knowledge_stream(request: QueryRequest):
    """
    流式检索接口（SSE）
    适用于前端实时显示生成内容
    """
    async def event_generator():
        request_id = str(uuid.uuid4())
        yield f"data: { {'type': 'start', 'request_id': request_id} }\n\n"

        try:
            # 简化流式输出演示
            pipeline = get_rag_pipeline()
            result = pipeline.run(request.query, tenant_id=request.tenant_id)

            # 逐字输出答案
            for char in result["answer"]:
                yield f"data: { {'type': 'token', 'content': char} }\n\n"

            # 发送来源信息
            yield f"data: { {'type': 'sources', 'data': result['sources']} }\n\n"
            yield f"data: { {'type': 'done', 'request_id': request_id} }\n\n"

        except Exception as e:
            yield f"data: { {'type': 'error', 'message': str(e)} }\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.post("/api/v1/ingest", response_model=IngestResponse, tags=["文档管理"])
async def ingest_document(
    file: UploadFile = File(..., description="上传文档"),
    tenant_id: str = Query(default="default", description="租户ID"),
    parser=Depends(get_document_parser),
):
    """
    文档接入接口
    支持上传PDF/Word/HTML/Markdown/Excel文件
    """
    start_time = time.time()
    request_id = str(uuid.uuid4())

    # 验证文件格式
    allowed_extensions = {".pdf", ".docx", ".html", ".htm", ".md", ".xlsx", ".xls"}
    file_ext = f".{file.filename.rsplit('.', 1)[-1].lower()}" if '.' in file.filename else ""
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式: {file_ext}，支持格式: {allowed_extensions}",
        )

    # 保存临时文件
    temp_path = f"/tmp/{request_id}{file_ext}"
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        # 解析并切片
        chunks = parser.parse_and_chunk(temp_path, tenant_id=tenant_id)

        # 异步向量化与索引（生产环境应使用消息队列）
        from core.embedding.batch_embedder import AsyncBatchEmbedder
        from core.embedding.embedder import BGEM3Embedder

        embedder = BGEM3Embedder(device="cuda:0")
        batch_embedder = AsyncBatchEmbedder(embedder=embedder)
        import asyncio
        embedding_results = asyncio.run(batch_embedder.embed_chunks(chunks))

        # 写入Milvus
        from core.embedding.milvus_index import MilvusIndexManager
        index_manager = MilvusIndexManager()
        index_manager.connect()
        index_manager.create_collection()
        index_manager.insert_chunks(embedding_results, chunks)

        latency_ms = (time.time() - start_time) * 1000

        return IngestResponse(
            request_id=request_id,
            file_name=file.filename,
            status="success",
            chunk_count=len(chunks),
            latency_ms=round(latency_ms, 2),
        )
    except Exception as e:
        logger.error(f"文档接入失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"文档处理失败: {str(e)}")
    finally:
        # 清理临时文件
        import os
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.delete("/api/v1/documents/{source_file}", tags=["文档管理"])
async def delete_document(source_file: str, tenant_id: str = "default"):
    """
    删除文档接口
    根据文件名删除所有关联的向量数据
    """
    try:
        from pymilvus import Collection
        collection = Collection("rag_knowledge_base")
        collection.load()

        # 通过元数据过滤删除
        collection.delete(expr=f'tenant_id == "{tenant_id}" and source_file == "{source_file}"')

        return {"status": "success", "message": f"已删除文档: {source_file}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")


# ========== 应用启动/关闭事件 ==========

@app.on_event("startup")
async def startup_event():
    """应用启动时预热模型与连接"""
    logger.info("RAG系统启动中...")

    # 预热Embedding模型
    try:
        from core.embedding.embedder import BGEM3Embedder
        embedder = BGEM3Embedder(device="cuda:0")
        embedder.embed_texts(["预热文本"])
        _services["embedder"] = embedder
        logger.info("Embedding模型预热完成")
    except Exception as e:
        logger.warning(f"Embedding模型预热失败（将在首次请求时重试）: {e}")

    # 预热Milvus连接
    try:
        from pymilvus import connections
        connections.connect(alias="default", uri="http://localhost:19530")
        logger.info("Milvus连接成功")
    except Exception as e:
        logger.warning(f"Milvus连接失败: {e}")

    logger.info("RAG系统启动完成")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理资源"""
    logger.info("RAG系统关闭中...")
    try:
        from pymilvus import connections
        connections.disconnect("default")
    except Exception:
        pass
    logger.info("RAG系统已关闭")


# ========== 启动命令 ==========
# uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4.6 依赖文件

```
# requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.9.0
pymilvus==2.4.9
PyPDF2==3.0.1
python-docx==1.1.2
beautifulsoup4==4.12.3
openpyxl==3.1.5
markdown==3.6
FlagEmbedding==1.3.0
numpy==1.26.4
openai==1.50.0
zhipuai==2.1.0
langchain==0.3.0
llama-index==0.11.0
langchain-community==0.3.0
httpx==0.27.0
python-multipart==0.0.12
aiofiles==24.1.0
ragas==0.2.0
```

---

## 5. 性能优化策略

### 5.1 文档解析层优化

| 优化项 | 策略 | 预期效果 |
|--------|------|----------|
| 大文件处理 | 流式读取 + 分页解析，避免一次性加载 | 内存占用降低60% |
| 并行解析 | 多文件并行解析（协程池） | 吞吐量提升3-5倍 |
| 缓存机制 | 基于文件Hash的解析缓存 | 重复文档处理时间→0 |
| OCR增强 | PDF扫描件集成Tesseract OCR | 扫描件识别率>95% |

### 5.2 向量化层优化

| 优化项 | 策略 | 预期效果 |
|--------|------|----------|
| 批量Embedding | 动态批大小调整（Batch Size=64~256） | GPU利用率提升40% |
| FP16推理 | BGE-M3开启半精度推理 | 显存减半，速度提升30% |
| 异步队列 | Redis消息队列 + 消费者模式 | 解耦解析与向量化，削峰填谷 |
| 缓存热点向量 | Redis缓存高频查询的Embedding结果 | 命中率>60%时延迟降低80% |

### 5.3 检索层优化

| 优化项 | 策略 | 预期效果 |
|--------|------|----------|
| HNSW参数调优 | M=16, efConstruction=256, ef=128 | 召回率>95%，P99延迟<50ms |
| 稀疏向量索引 | Milvus原生SPARSE_INVERTED_INDEX | 关键词匹配性能提升10倍 |
| 分区策略 | 按tenant_id分区 + 按时间分区 | 查询范围缩小，延迟降低50% |
| 缓存层 | Redis缓存热门查询结果（TTL=5min） | 热点查询响应<10ms |
| 预计算 | 离线预计算文档聚类，缩小在线检索范围 | 检索范围缩小70% |

### 5.4 生成层优化

| 优化项 | 策略 | 预期效果 |
|--------|------|----------|
| 上下文压缩 | 只保留与查询最相关的Chunk片段 | Token消耗减少40% |
| 流式输出 | SSE逐Token输出 | 首字延迟降低70% |
| Prompt缓存 | 结构化Prompt模板缓存 | 重复Prompt处理→0 |
| 模型路由 | 简单查询→小模型，复杂查询→大模型 | 成本降低30% |

### 5.5 全链路可观测性

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  请求接入  │──▶│  查询理解  │──▶│  检索执行  │──▶│  重排序   │──▶│  LLM生成  │
│  [网关]   │   │  [改写]   │   │  [混合]   │   │  [CE]    │   │  [流式]   │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │              │
     └──────────────┴──────────────┴──────────────┴──────────────┘
                                    │
                            ┌───────▼────────┐
                            │  OpenTelemetry  │
                            │  · Trace全链路   │
                            │  · Metrics指标   │
                            │  · Logging日志   │
                            └────────────────┘
```

关键监控指标：
- **检索延迟**：P50/P95/P99，目标P99 < 200ms
- **召回率**：通过标注数据集定期评估，目标 > 90%
- **回答质量**：RAGAS框架（Faithfulness > 0.85, Relevancy > 0.80）
- **系统吞吐量**：QPS，目标 > 50（单节点）

---

## 6. 部署方案

### 6.1 生产环境架构

```
                         ┌──────────────────┐
                         │    Nginx/ALB     │  （负载均衡 + SSL终止）
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼─────┐ ┌────▼─────┐ ┌─────▼─────┐
              │  RAG API  │ │ RAG API  │ │ RAG API   │   （FastAPI容器 × N）
              │  Pod #1   │ │ Pod #2   │ │ Pod #N    │
              └─────┬─────┘ └────┬─────┘ └─────┬─────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
      ┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
      │  Embedding    │  │   Milvus      │  │   Redis       │
      │  Service      │  │   Cluster     │  │   Cluster     │
      │  (GPU节点×2)  │  │  (3节点集群)   │  │  (哨兵模式)    │
      └───────────────┘  └───────────────┘  └───────────────┘
```

### 6.2 Docker部署

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源码
COPY . .

# 预下载Embedding模型
RUN python -c "from FlagEmbedding import FlagModel; FlagModel('BAAI/bge-m3', use_fp16=True)"

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 6.3 Kubernetes部署（关键配置）

```yaml
# k8s-deployment.yaml（核心配置）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rag-api
  template:
    spec:
      containers:
      - name: rag-api
        image: registry.example.com/rag-system:v1.0
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
        env:
        - name: MILVUS_URI
          valueFrom:
            configMapKeyRef:
              name: rag-config
              key: milvus-uri
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: rag-config
              key: redis-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
# Embedding服务（需要GPU）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: embedding-service
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: embedding
        image: registry.example.com/rag-embedding:v1.0
        resources:
          limits:
            nvidia.com/gpu: 1  # 每个Pod 1块GPU
          requests:
            memory: "8Gi"
            cpu: "4"
```

### 6.4 部署环境配置

| 环境 | RAG API节点 | GPU节点 | Milvus集群 | Redis | 用途 |
|------|------------|---------|-----------|-------|------|
| 开发环境 | 1 (4C8G) | 1 (T4) | 1 (单节点) | 1 | 功能开发与调试 |
| 预发环境 | 2 (4C8G) | 1 (A10) | 3节点 | 3节点哨兵 | 测试验证 |
| 生产环境 | 5 (8C16G) | 2 (A100) | 3节点 + Proxy | 6节点哨兵 | 正式服务 |

---

## 7. 成本估算

### 7.1 基础设施成本（月度）

| 资源 | 规格 | 数量 | 单价（估算） | 月成本 |
|------|------|------|-------------|--------|
| GPU服务器（Embedding） | A100 80G | 2台 | 12,000元/月 | 24,000元 |
| CPU服务器（RAG API） | 8C 16G | 5台 | 1,500元/月 | 7,500元 |
| Milvus集群 | 8C 32G 500G SSD | 3台 | 2,000元/月 | 6,000元 |
| Redis集群 | 4C 16G | 6台 | 800元/月 | 4,800元 |
| 负载均衡/网络 | ALB + 带宽 | - | - | 2,000元 |
| 对象存储 | 1TB | - | 200元/月 | 200元 |
| **基础设施合计** | | | | **44,500元/月** |

### 7.2 LLM API调用成本（月度）

| 模型 | 调用量估算 | 单价 | 月成本 |
|------|-----------|------|--------|
| GLM-4 Plus（主选） | 50万次/月，平均2K tokens | 约0.01元/1K tokens | 10,000元 |
| BGE-M3 Embedding（本地） | 本地部署，无API费用 | - | 0元 |
| 重排序模型（本地） | 本地部署，无API费用 | - | 0元 |
| **API调用合计** | | | **10,000元/月** |

### 7.3 总成本汇总

| 类别 | 月成本 | 年成本 |
|------|--------|--------|
| 基础设施 | 44,500元 | 534,000元 |
| API调用 | 10,000元 | 120,000元 |
| 人力运维（0.5人） | 15,000元 | 180,000元 |
| **总计** | **69,500元/月** | **834,000元/年** |

> **注**：以上为自建方案估算。若采用云服务托管（如Milvus Cloud、阿里云PAI），基础设施成本可降低约30%，但长期来看自建更经济。

### 7.4 成本优化建议

1. **Embedding本地部署**：BGE-M3本地运行，省去API调用费用（每月可节省数万元）
2. **GLM-4替代GPT-4**：国产模型合规且成本约为GPT-4的1/5
3. **智能模型路由**：简单查询使用GLM-4-Flash（更便宜），复杂查询使用GLM-4-Plus
4. **缓存策略**：Redis缓存热门查询结果，预计减少30%的LLM调用
5. **分时段弹性伸缩**：低峰期自动缩减RAG API节点数量

---

## 8. 风险与应对

### 8.1 技术风险

| 风险 | 影响 | 概率 | 应对策略 |
|------|------|------|---------|
| Embedding模型效果不佳 | 检索召回率低，回答质量差 | 中 | 持续评估MTEB排名，准备2-3个备选模型；建立领域评测数据集定期Benchmark |
| 大规模向量检索延迟高 | 用户体验差，系统吞吐量低 | 中 | Milvus分区策略+HNSW参数调优；预估亿级向量时引入DiskANN降低内存成本 |
| LLM幻觉问题 | 生成不准确的内容，影响可信度 | 高 | Reranker质量把关+引用溯源+置信度评分；低置信度时触发人工审核 |
| 多智能体协作复杂度 | 系统复杂度高，调试困难 | 中 | 逐步引入Agent范式，先从单Agent验证，再扩展为多Agent协作 |
| 文档解析质量 | 复杂格式（扫描件、表格）解析失败 | 中 | 集成OCR能力；建立解析质量监控，自动检测解析异常 |

### 8.2 业务风险

| 风险 | 影响 | 概率 | 应对策略 |
|------|------|------|---------|
| 数据安全与隐私泄露 | 合规风险，企业声誉受损 | 中 | 多租户严格隔离；数据加密存储与传输；访问审计日志；定期安全评估 |
| 知识库质量不可控 | 垃圾数据进入系统，影响回答质量 | 高 | 文档接入审核机制；知识库质量评分体系；定期清洗过期/无效内容 |
| 模型供应商风险 | API价格波动/服务中断 | 低 | 多模型备选方案（GLM-4 + GPT-4o + DeepSeek-V3）；关键场景支持本地模型兜底 |
| 中国AI调用量激增 | 系统负载突增，响应延迟 | 中 | 自动弹性伸缩；CDN边缘缓存；限流降级策略 |
| 用户反馈负面循环 | 使用频率下降，系统价值降低 | 低 | 建立用户反馈闭环；RAGAS自动化评估；持续迭代优化 |

### 8.3 运维风险

| 风险 | 影响 | 概率 | 应对策略 |
|------|------|------|---------|
| Milvus集群故障 | 检索服务不可用 | 低 | 多副本+自动故障转移；定期备份向量数据 |
| GPU资源不足 | Embedding延迟增高 | 中 | GPU池化管理；CPU Embedding降级方案；队列削峰 |
| 模型版本升级 | 兼容性问题，效果回退 | 中 | 灰度发布；A/B测试；版本回滚机制 |

---

## 附录

### A. 关键参考资源

- [RAG检索增强生成 2026 实战](https://blog.csdn.net/qq_31142761/article/details/161788018) —— 三代RAG技术演进
- [Hybrid Retrieval Architecture for Production RAG Systems 2026](https://markaicode.com/architecture/hybrid-retrieval-architecture-with-modal/) —— 混合检索最佳实践
- [RAG Explained: 10 Steps to Production-Ready RAG in 2026](https://decodethefuture.org/en/rag/) —— 生产级RAG指南
- [BGE-M3 模型](https://huggingface.co/BAAI/bge-m3) —— 多功能Embedding模型
- [Milvus官方文档](https://milvus.io/docs) —— 向量数据库

### B. 术语表

| 术语 | 说明 |
|------|------|
| RAG | Retrieval-Augmented Generation，检索增强生成 |
| Embedding | 将文本映射为高维向量的过程 |
| HNSW | Hierarchical Navigable Small World，高性能近似最近邻索引 |
| RRF | Reciprocal Rank Fusion，倒数秩融合算法 |
| SSE | Server-Sent Events，服务器推送事件（流式输出） |
| Agentic RAG | 融入Agent能力的RAG系统，检索过程具备自主规划能力 |
| Graph RAG | 结合知识图谱的RAG，利用实体关系增强检索 |

---

> 本方案基于2026年6月AI热点趋势设计，技术选型与架构决策会随着技术发展持续更新。建议每季度进行一次技术评审，确保方案的时效性与竞争力。
