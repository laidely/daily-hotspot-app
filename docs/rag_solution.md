# AI热点新闻聚合 -- RAG系统落地方案

> 版本：v1.0 | 场景：基于RAG架构的AI热点新闻实时聚合与智能问答系统

---

## 一、方案概述

### 1.1 业务背景

AI领域技术迭代极快，每天都有大量新闻、论文、技术博客产生。用户需要一个系统能够：
- 自动采集和聚合多源AI热点新闻
- 基于聚合内容进行智能问答（"最近大模型领域有哪些重大进展？""OpenAI最新发布带来了哪些影响？"）
- 提供带来源引用的准确回答，避免幻觉

### 1.2 为什么选择RAG

| 对比维度 | 纯LLM | 纯搜索引擎 | RAG方案 |
|----------|--------|-----------|---------|
| 实时性 | 差（知识截止） | 好 | 好 |
| 回答质量 | 高但易幻觉 | 低（需人工筛选） | 高且可溯源 |
| 多源聚合 | 不支持 | 支持 | 支持 |
| 上下文理解 | 强 | 弱 | 强 |
| 成本 | 高（长上下文） | 低 | 中等 |

RAG将"信息检索"与"生成式回答"结合，既保证了信息的实时性和准确性，又具备自然语言的深度理解与总结能力。

---

## 二、系统架构设计

### 2.1 整体架构图（文字描述）

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户交互层                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Web 前端  │  │ API 网关  │  │ Bot/小程序 │  │  WebSocket 推送服务   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       └──────────────┴──────────────┴──────────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│                        应用服务层                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │  查询理解模块  │  │  RAG 编排引擎  │  │  回答生成模块  │                │
│  │  - 意图识别   │  │  - 检索策略    │  │  - 上下文组装   │                │
│  │  - 查询改写   │  │  - 重排序     │  │  - 流式生成     │                │
│  │  - 时间解析   │  │  - 上下文截断  │  │  - 来源引用标注  │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│                        数据处理层                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │  新闻采集模块  │  │  文档处理模块  │  │  向量化模块    │                │
│  │  - RSS/爬虫   │  │  - 解析清洗    │  │  - Embedding  │                │
│  │  - 增量采集    │  │  - 分块策略    │  │  - 索引管理    │                │
│  │  - 去重       │  │  - 元数据提取   │  │  - 增量更新    │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│                        存储层                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │  向量数据库    │  │  文档数据库    │  │  缓存(Redis)  │                │
│  │  (ChromaDB)  │  │  (PostgreSQL) │  │              │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
新闻源(RSS/API/爬虫)
    ↓
原始内容采集 → 去重检查 → 文档解析 → 文本分块 → 元数据提取
                                                    ↓
                                               Embedding向量化
                                                    ↓
                                               写入向量数据库 + PostgreSQL
                                                    ↓
用户提问 → 查询理解 → 向量化查询 → 混合检索(向量+关键词) → 重排序
                                                              ↓
                                                    上下文组装 → LLM生成回答 → 返回(含引用)
```

---

## 三、技术选型

### 3.1 核心技术栈

| 模块 | 技术选型 | 选型理由 |
|------|----------|----------|
| **RAG编排框架** | LlamaIndex | 原生RAG设计，文档索引和检索管道丰富，比LangChain更聚焦RAG场景 |
| **LLM** | Qwen2.5-72B (通过DashScope API) | 中文能力强，国内合规，支持长上下文(128K) |
| **Embedding模型** | bge-large-zh-v1.5 (BAAI) | 中文Embedding效果SOTA，1024维，支持批量化 |
| **向量数据库** | ChromaDB | 轻量部署，支持本地持久化，API简洁，适合中等规模数据 |
| **备选向量库** | FAISS (生产环境高并发) | Facebook开源，支持GPU加速，十亿级向量检索毫秒级 |
| **关系数据库** | PostgreSQL | 存储文档元数据、用户记录、采集状态 |
| **文档解析** | Unstructured + BeautifulSoup4 | 支持HTML/PDF/Markdown多格式，结构化提取能力强 |
| **缓存** | Redis | 热门查询结果缓存，降低LLM调用成本 |
| **任务调度** | Celery + Redis | 新闻定时采集、增量索引更新的异步任务 |
| **API框架** | FastAPI | 高性能异步框架，自动生成OpenAPI文档 |
| **前端** | Next.js + TailwindCSS | SSR支持，SEO友好，组件化开发效率高 |

### 3.2 Embedding模型选型对比

| 模型 | 维度 | 中文MTEB排名 | 速度 | 推荐场景 |
|------|------|-------------|------|----------|
| bge-large-zh-v1.5 | 1024 | Top 3 | 中等 | 本方案首选 |
| text2vec-large-chinese | 1024 | Top 10 | 快 | 轻量部署备选 |
| m3e-large | 1024 | Top 5 | 快 | 平衡选择 |
| OpenAI text-embedding-3 | 1536 | N/A (英文为主) | API调用 | 国际化场景 |

---

## 四、全链路实现

### 4.1 项目结构

```
ai-news-rag/
├── config/
│   └── settings.py              # 配置管理
├── src/
│   ├── ingest/                   # 数据采集与处理
│   │   ├── crawler.py            # 新闻爬虫
│   │   ├── parser.py             # 文档解析
│   │   ├── chunker.py           # 文本分块
│   │   └── indexer.py            # 向量索引构建
│   ├── retrieval/                # 检索模块
│   │   ├── retriever.py         # 混合检索器
│   │   ├── reranker.py          # 重排序
│   │   └── query_transform.py   # 查询改写
│   ├── generation/              # 生成模块
│   │   ├── rag_engine.py        # RAG编排引擎
│   │   ├── prompt_templates.py  # 提示词模板
│   │   └── citation.py          # 引用标注
│   ├── scheduler/               # 任务调度
│   │   └── tasks.py             # 定时采集任务
│   └── api/                     # API接口
│       ├── main.py              # FastAPI入口
│       └── routes/
│           ├── chat.py          # 问答接口
│           └── news.py          # 新闻接口
├── tests/
├── requirements.txt
└── docker-compose.yml
```

### 4.2 文档解析模块

```python
# src/ingest/parser.py
"""文档解析模块：支持HTML/Markdown/PDF多格式解析"""

import re
from dataclasses import dataclass, field
from typing import Optional
from bs4 import BeautifulSoup
import markdown


@dataclass
class ParsedDocument:
    """解析后的文档结构"""
    url: str
    title: str
    author: Optional[str] = None
    publish_date: Optional[str] = None
    content: str = ""
    content_type: str = ""  # html, markdown, text
    metadata: dict = field(default_factory=dict)


class DocumentParser:
    """多格式文档解析器"""

    def __init__(self):
        self.boilerplate_patterns = re.compile(
            r'(广告|推荐阅读|相关文章|扫码关注|分享到|责任编辑|版权声明)',
            re.IGNORECASE
        )

    def parse_html(self, html_content: str, url: str) -> ParsedDocument:
        """解析HTML文档，提取正文内容"""
        soup = BeautifulSoup(html_content, 'html.parser')

        # 移除脚本、样式、导航等无关元素
        for tag in soup(['script', 'style', 'nav', 'footer', 'header',
                         'aside', 'iframe', 'noscript']):
            tag.decompose()

        # 提取标题
        title = self._extract_title(soup)

        # 提取正文（基于常见文章结构的选择器）
        article_body = (
            soup.find('article')
            or soup.find(class_=re.compile(r'article|content|post|entry'))
            or soup.find('div', class_=re.compile(r'content-body|article-content'))
            or soup.find('main')
        )

        if article_body:
            text = article_body.get_text(separator='\n', strip=True)
        else:
            # 降级：提取所有段落文本
            paragraphs = soup.find_all('p')
            text = '\n'.join(p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 50)

        # 清洗噪音文本
        text = self._clean_text(text)

        return ParsedDocument(
            url=url,
            title=title,
            content=text,
            content_type="html",
            metadata={"parser": "html", "content_length": len(text)}
        )

    def parse_markdown(self, md_content: str, url: str) -> ParsedDocument:
        """解析Markdown文档"""
        # 提取YAML front matter中的元数据
        metadata = self._extract_frontmatter(md_content)
        title = metadata.pop('title', '')
        author = metadata.pop('author', None)
        publish_date = metadata.pop('date', None)

        # 将Markdown转为纯文本（保留段落结构）
        html = markdown.markdown(md_content)
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(separator='\n', strip=True)
        text = self._clean_text(text)

        return ParsedDocument(
            url=url,
            title=title,
            author=author,
            publish_date=publish_date,
            content=text,
            content_type="markdown",
            metadata=metadata
        )

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """从HTML中提取标题"""
        # 优先取og:title
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            return og_title['content'].strip()

        # 其次取title标签
        if soup.title and soup.title.string:
            return soup.title.string.strip()

        # 最后取第一个h1
        h1 = soup.find('h1')
        if h1:
            return h1.get_text(strip=True)

        return "未知标题"

    def _clean_text(self, text: str) -> str:
        """清洗文本噪音"""
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            # 跳过空行和噪音行
            if not line:
                continue
            if self.boilerplate_patterns.search(line):
                continue
            if len(line) < 10:  # 跳过过短的行
                continue
            cleaned_lines.append(line)
        return '\n'.join(cleaned_lines)

    def _extract_frontmatter(self, md_content: str) -> dict:
        """提取Markdown的YAML front matter"""
        if md_content.startswith('---'):
            parts = md_content.split('---', 2)
            if len(parts) >= 3:
                import yaml
                try:
                    return yaml.safe_load(parts[1]) or {}
                except:
                    pass
        return {}
```

### 4.3 智能文本分块模块

```python
# src/ingest/chunker.py
"""智能文本分块：基于语义边界的自适应分块策略"""

import re
from dataclasses import dataclass
from typing import List
import numpy as np


@dataclass
class TextChunk:
    """文本块"""
    text: str
    chunk_id: int
    start_index: int
    end_index: int
    token_count: int
    metadata: dict


class SemanticChunker:
    """
    语义感知的文本分块器

    分块策略：
    1. 优先按段落/标题等语义边界切分
    2. 合并过短的相邻块
    3. 对过长的块在句号处切分
    4. 保持重叠区域以避免信息丢失
    """

    def __init__(
        self,
        target_chunk_size: int = 500,       # 目标块大小（字符数）
        max_chunk_size: int = 800,          # 最大块大小
        min_chunk_size: int = 100,          # 最小块大小
        overlap_ratio: float = 0.15,        # 重叠比例
        separators: list = None
    ):
        self.target_chunk_size = target_chunk_size
        self.max_chunk_size = max_chunk_size
        self.min_chunk_size = min_chunk_size
        self.overlap_ratio = overlap_ratio

        # 分隔符优先级（从高到低）
        self.separators = separators or [
            re.compile(r'\n#{1,3}\s'),       # Markdown标题
            re.compile(r'\n\n'),              # 段落分隔
            re.compile(r'(?<=[。！？])\n'),  # 中文句号后换行
            re.compile(r'(?<=[。！？])'),     # 中文句号
            re.compile(r'(?<=[,.;])\s'),     # 英文标点后
            re.compile(r'\s'),                # 空格
        ]

    def chunk(self, text: str, metadata: dict = None) -> List[TextChunk]:
        """执行分块"""
        if metadata is None:
            metadata = {}

        # Step 1: 在所有语义边界处预切分
        segments = self._split_at_boundaries(text)

        # Step 2: 合并相邻短段，形成初始块
        initial_chunks = self._merge_segments(segments)

        # Step 3: 进一步优化块大小（切分过大块 / 合并过小块）
        final_chunks = self._optimize_chunks(initial_chunks, text)

        # Step 4: 构建TextChunk对象，添加重叠
        chunks = self._build_chunks_with_overlap(final_chunks, text, metadata)

        return chunks

    def _split_at_boundaries(self, text: str) -> List[str]:
        """在语义边界处预切分"""
        segments = [text]

        for sep in self.separators:
            new_segments = []
            for seg in segments:
                parts = sep.split(seg)
                new_segments.extend(parts)
            segments = [s.strip() for s in segments if s.strip()]

        return segments

    def _merge_segments(self, segments: List[str]) -> List[str]:
        """合并相邻短段"""
        merged = []
        current = ""

        for seg in segments:
            if not seg:
                continue
            if len(current) + len(seg) < self.target_chunk_size:
                current = f"{current}\n{seg}" if current else seg
            else:
                if current:
                    merged.append(current)
                current = seg

        if current:
            merged.append(current)

        return merged

    def _optimize_chunks(self, chunks: List[str], original_text: str) -> List[str]:
        """优化块大小"""
        optimized = []

        for chunk in chunks:
            if len(chunk) <= self.max_chunk_size:
                optimized.append(chunk)
            else:
                # 在句号处切分过长的块
                sub_chunks = self._split_long_chunk(chunk)
                optimized.extend(sub_chunks)

        return optimized

    def _split_long_chunk(self, chunk: str) -> List[str]:
        """切分过长的块"""
        sentences = re.split(r'(?<=[。！？\.\!\?])', chunk)
        sub_chunks = []
        current = ""

        for sentence in sentences:
            if len(current) + len(sentence) > self.target_chunk_size and current:
                sub_chunks.append(current)
                current = sentence
            else:
                current += sentence

        if current:
            sub_chunks.append(current)

        return sub_chunks

    def _build_chunks_with_overlap(
        self, chunks: List[str], original_text: str, metadata: dict
    ) -> List[TextChunk]:
        """构建带重叠的TextChunk对象"""
        overlap_size = int(self.target_chunk_size * self.overlap_ratio)
        result = []
        current_pos = 0

        for i, chunk_text in enumerate(chunks):
            # 在原文中定位当前块
            start = original_text.find(chunk_text[:50], current_pos)
            if start == -1:
                start = current_pos

            end = start + len(chunk_text)

            # 添加重叠区域
            if i > 0 and overlap_size > 0:
                overlap_start = max(0, start - overlap_size)
                overlap_text = original_text[overlap_start:start]
                chunk_text = overlap_text + chunk_text
                start = overlap_start

            result.append(TextChunk(
                text=chunk_text.strip(),
                chunk_id=i,
                start_index=start,
                end_index=end,
                token_count=self._estimate_tokens(chunk_text),
                metadata={**metadata, "chunk_index": i}
            ))

            current_pos = end

        return result

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        """估算token数量（中文约1.5字符/token）"""
        return int(len(text) / 1.5)
```

### 4.4 向量化与索引构建模块

```python
# src/ingest/indexer.py
"""向量化索引构建与管理"""

import chromadb
from chromadb.config import Settings
from typing import List, Optional, Dict
from dataclasses import asdict
import hashlib
import json
import time

from src.ingest.chunker import TextChunk


class NewsIndexer:
    """
    新闻文档向量索引管理器

    使用ChromaDB进行向量存储与管理，
    支持增量更新和元数据过滤检索。
    """

    # 元数据Schema定义
    METADATA_SCHEMA = {
        "source": "str",          # 来源站点
        "category": "str",        # 分类（大模型/机器人/芯片/政策...）
        "publish_date": "str",    # 发布日期 ISO格式
        "importance": "int",      # 重要性评分 1-5
        "doc_hash": "str",        # 文档内容哈希，用于去重
    }

    def __init__(
        self,
        persist_directory: str = "./data/chroma_db",
        collection_name: str = "ai_news",
        embedding_model: str = "BAAI/bge-large-zh-v1.5",
        embedding_dimension: int = 1024,
    ):
        self.collection_name = collection_name
        self.embedding_model = embedding_model
        self.embedding_dimension = embedding_dimension

        # 初始化ChromaDB客户端（持久化模式）
        self.chroma_client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=persist_directory,
            anonymized_telemetry=False,
        ))

        # 获取或创建Collection
        self.collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},  # 使用余弦相似度
        )

    def compute_doc_hash(self, content: str) -> str:
        """计算文档内容哈希，用于去重"""
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    def is_duplicate(self, doc_hash: str) -> bool:
        """检查文档是否已存在"""
        result = self.collection.get(
            where={"doc_hash": doc_hash},
            limit=1
        )
        return len(result['ids']) > 0

    def add_documents(
        self,
        chunks: List[TextChunk],
        doc_metadata: Optional[Dict] = None,
        batch_size: int = 100
    ) -> int:
        """
        批量添加文档块到向量索引

        Args:
            chunks: TextChunk列表
            doc_metadata: 文档级元数据（会被合并到每个chunk中）
            batch_size: 批量写入大小

        Returns:
            成功添加的chunk数量
        """
        doc_metadata = doc_metadata or {}

        # 准备数据
        ids = []
        documents = []
        metadatas = []

        for chunk in chunks:
            chunk_meta = {
                **doc_metadata,
                "chunk_index": chunk.chunk_id,
                "token_count": chunk.token_count,
                "doc_hash": self.compute_doc_hash(chunk.text),
            }
            # 过滤掉非序列化的值
            chunk_meta = {
                k: str(v) for k, v in chunk_meta.items()
                if v is not None
            }

            chunk_id = f"{doc_metadata.get('source', 'unknown')}_{chunk_meta['doc_hash'][:8]}_{chunk.chunk_id}"

            ids.append(chunk_id)
            documents.append(chunk.text)
            metadatas.append(chunk_meta)

        # 批量写入
        added_count = 0
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i + batch_size]
            batch_docs = documents[i:i + batch_size]
            batch_meta = metadatas[i:i + batch_size]

            try:
                self.collection.add(
                    ids=batch_ids,
                    documents=batch_docs,
                    metadatas=batch_meta,
                )
                added_count += len(batch_ids)
            except Exception as e:
                print(f"批量写入失败 (batch {i}): {e}")
                continue

        # 持久化
        self.chroma_client.persist()

        return added_count

    def search(
        self,
        query: str,
        n_results: int = 10,
        where_filter: Optional[Dict] = None,
        where_document_filter: Optional[Dict] = None,
    ) -> Dict:
        """
        向量相似度检索

        Args:
            query: 查询文本
            n_results: 返回结果数量
            where_filter: 元数据过滤条件，如 {"category": "大模型"}
            where_document_filter: 文档内容过滤

        Returns:
            包含documents、metadatas、distances的字典
        """
        kwargs = {
            "query_texts": [query],
            "n_results": n_results,
        }
        if where_filter:
            kwargs["where"] = where_filter
        if where_document_filter:
            kwargs["where_document"] = where_document_filter

        return self.collection.query(**kwargs)

    def get_stats(self) -> Dict:
        """获取索引统计信息"""
        count = self.collection.count()
        peek = self.collection.peek(min(5, count)) if count > 0 else {}
        return {
            "total_chunks": count,
            "sample_ids": peek.get("ids", []),
        }

    def delete_by_source(self, source: str):
        """删除指定来源的所有文档"""
        self.collection.delete(
            where={"source": source}
        )
        self.chroma_client.persist()
```

### 4.5 混合检索与重排序模块

```python
# src/retrieval/retriever.py
"""混合检索器：向量检索 + 关键词检索 + 时间加权 + 重排序"""

import math
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta


class HybridRetriever:
    """
    混合检索器

    结合向量语义检索和时间衰减权重，提供更准确的新闻检索结果。

    检索策略：
    1. 向量语义相似度检索（主检索通道）
    2. 时间衰减加权（新闻时效性）
    3. 重要性加权（热点新闻优先）
    4. 可选：关键词BM25检索融合
    """

    def __init__(
        self,
        indexer,  # NewsIndexer实例
        time_decay_lambda: float = 0.1,    # 时间衰减系数（越大衰减越快）
        importance_weight: float = 0.2,     # 重要性权重
        semantic_weight: float = 0.7,       # 语义相似度权重
        recency_weight: float = 0.1,         # 时效性权重
    ):
        self.indexer = indexer
        self.time_decay_lambda = time_decay_lambda
        self.weights = {
            "semantic": semantic_weight,
            "recency": recency_weight,
            "importance": importance_weight,
        }
        # 归一化权重
        total = sum(self.weights.values())
        self.weights = {k: v / total for k, v in self.weights.items()}

    def retrieve(
        self,
        query: str,
        top_k: int = 10,
        time_range_days: Optional[int] = None,
        category_filter: Optional[str] = None,
    ) -> List[Dict]:
        """
        执行混合检索

        Args:
            query: 用户查询
            top_k: 返回数量
            time_range_days: 时间范围（天数），None表示不限
            category_filter: 分类过滤

        Returns:
            排序后的检索结果列表，每项包含text、metadata、score
        """
        # Step 1: 构建过滤条件
        where_filter = {}
        if category_filter:
            where_filter["category"] = category_filter

        if time_range_days:
            cutoff_date = (
                datetime.now() - timedelta(days=time_range_days)
            ).strftime("%Y-%m-%d")
            where_filter["publish_date"] = {"$gte": cutoff_date}

        # Step 2: 扩大初始召回量（检索更多候选，后续精排）
        initial_k = top_k * 3
        results = self.indexer.search(
            query=query,
            n_results=min(initial_k, self.indexer.collection.count()),
            where_filter=where_filter if where_filter else None,
        )

        if not results or not results['documents']:
            return []

        # Step 3: 多维度评分
        scored_results = []
        now = datetime.now()

        for i in range(len(results['documents'][0])):
            doc_text = results['documents'][0][i]
            doc_metadata = results['metadatas'][0][i]
            distance = results['distances'][0][i]

            # 语义相似度得分（将距离转为相似度分）
            semantic_score = 1 - distance  # ChromaDB cosine距离

            # 时间衰减得分
            recency_score = self._compute_recency_score(doc_metadata, now)

            # 重要性得分
            importance = int(doc_metadata.get("importance", "3"))
            importance_score = importance / 5.0

            # 加权综合得分
            final_score = (
                self.weights["semantic"] * semantic_score
                + self.weights["recency"] * recency_score
                + self.weights["importance"] * importance_score
            )

            scored_results.append({
                "text": doc_text,
                "metadata": doc_metadata,
                "scores": {
                    "semantic": semantic_score,
                    "recency": recency_score,
                    "importance": importance_score,
                    "final": final_score,
                }
            })

        # Step 4: 按综合得分排序
        scored_results.sort(key=lambda x: x["scores"]["final"], reverse=True)

        return scored_results[:top_k]

    def _compute_recency_score(
        self, metadata: Dict, now: datetime
    ) -> float:
        """
        计算时间衰减得分

        使用指数衰减函数：score = e^(-lambda * days_ago)
        1天前的文章得分约0.9，7天前约0.5，30天前约0.05
        """
        publish_date_str = metadata.get("publish_date")
        if not publish_date_str:
            return 0.5  # 无日期时给中间分

        try:
            publish_date = datetime.strptime(publish_date_str, "%Y-%m-%d")
            days_ago = (now - publish_date).days
            return math.exp(-self.time_decay_lambda * days_ago)
        except (ValueError, TypeError):
            return 0.5
```

### 4.6 查询理解与改写模块

```python
# src/retrieval/query_transform.py
"""查询理解与改写：提升检索召回率的查询优化"""

import re
from typing import List
from datetime import datetime


class QueryTransformer:
    """
    查询改写器

    将用户的自然语言问题转换为更适合向量检索的查询形式。

    策略：
    1. 时间表达式提取（"最近一周" → 具体日期范围）
    2. 查询扩展（添加同义词和行业术语）
    3. 问题分解（复杂问题拆分为多个子查询）
    """

    # 时间表达式映射
    TIME_PATTERNS = [
        (r'今天', 0),
        (r'昨天', 1),
        (r'前天', 2),
        (r'这周|本周', 7),
        (r'上周', 14),
        (r'最近一周|近一周|一周内', 7),
        (r'最近半月|近半月', 15),
        (r'最近一月|近一月|一个月|近一个月', 30),
        (r'最近三个月|近三个月|一季度', 90),
        (r'今年', (datetime.now() - datetime(datetime.now().year, 1, 1)).days),
    ]

    # AI领域同义词扩展
    SYNONYM_EXPANSIONS = {
        "大模型": ["大语言模型", "LLM", "GPT", "通用语言模型"],
        "AI": ["人工智能", "Artificial Intelligence"],
        "ChatGPT": ["OpenAI", "GPT-4", "GPT"],
        "自动驾驶": ["无人驾驶", "autonomous driving"],
        "芯片": ["半导体", "GPU", "算力芯片"],
    }

    def transform(self, query: str) -> dict:
        """
        查询转换主方法

        Returns:
            {
                "rewritten_query": str,       # 改写后的查询
                "time_range_days": int|None,  # 时间范围
                "expanded_queries": list,      # 扩展查询列表
                "detected_intent": str,       # 检测到的意图
            }
        """
        time_range = self._extract_time_range(query)
        intent = self._detect_intent(query)
        expanded = self._expand_query(query)

        return {
            "rewritten_query": query,
            "time_range_days": time_range,
            "expanded_queries": expanded,
            "detected_intent": intent,
        }

    def _extract_time_range(self, query: str) -> int:
        """从查询中提取时间范围"""
        for pattern, days in self.TIME_PATTERNS:
            if re.search(pattern, query):
                return days
        return None  # 无时间限制

    def _detect_intent(self, query: str) -> str:
        """检测用户查询意图"""
        if re.search(r'哪些|有什么|最新|进展|动态', query):
            return "news_browsing"  # 新闻浏览
        elif re.search(r'怎么|如何|怎么做|教程|方法', query):
            return "how_to"          # 方法论
        elif re.search(r'对比|区别|哪个好|vs|versus', query):
            return "comparison"      # 对比分析
        elif re.search(r'什么意思|是什么|解释|定义', query):
            return "definition"      # 概念解释
        else:
            return "general"

    def _expand_query(self, query: str) -> List[str]:
        """查询扩展：添加同义词"""
        expansions = [query]

        for term, synonyms in self.SYNONYM_EXPANSIONS.items():
            if term in query:
                for synonym in synonyms:
                    expanded = query.replace(term, synonym)
                    if expanded != query:
                        expansions.append(expanded)

        return expansions
```

### 4.7 RAG编排引擎（核心模块）

```python
# src/generation/rag_engine.py
"""RAG编排引擎：串联检索与生成的核心模块"""

import json
from typing import List, Dict, Optional
from dataclasses import dataclass, field

from src.retrieval.retriever import HybridRetriever
from src.retrieval.query_transform import QueryTransformer
from src.generation.prompt_templates import build_rag_prompt


@dataclass
class RAGResponse:
    """RAG系统回答"""
    answer: str
    sources: List[Dict]          # 引用来源
    query_understanding: Dict    # 查询理解结果
    retrieval_stats: Dict       # 检索统计
    metadata: Dict = field(default_factory=dict)


class RAGEngine:
    """
    RAG编排引擎

    核心流程：
    1. 查询理解与改写
    2. 多路检索与结果融合
    3. 上下文窗口组装
    4. LLM生成回答
    5. 引用标注与后处理
    """

    def __init__(
        self,
        retriever: HybridRetriever,
        llm_client=None,  # LLM API客户端（如DashScope/OpenAI SDK）
        query_transformer: Optional[QueryTransformer] = None,
        max_context_chunks: int = 5,
        max_context_tokens: int = 4000,
    ):
        self.retriever = retriever
        self.llm_client = llm_client
        self.query_transformer = query_transformer or QueryTransformer()
        self.max_context_chunks = max_context_chunks
        self.max_context_tokens = max_context_tokens

    async def query(
        self,
        user_query: str,
        category: Optional[str] = None,
        top_k: int = 5,
    ) -> RAGResponse:
        """
        处理用户查询，返回带引用的回答

        Args:
            user_query: 用户问题
            category: 限定新闻分类
            top_k: 检索结果数量

        Returns:
            RAGResponse对象
        """
        # Step 1: 查询理解与改写
        query_info = self.query_transformer.transform(user_query)
        time_range = query_info["time_range_days"]

        # Step 2: 执行检索
        retrieval_results = self.retriever.retrieve(
            query=query_info["rewritten_query"],
            top_k=top_k,
            time_range_days=time_range,
            category_filter=category,
        )

        # Step 3: 上下文组装
        context_chunks = self._assemble_context(retrieval_results)

        # Step 4: 构建提示词
        prompt = build_rag_prompt(
            user_query=user_query,
            context_chunks=context_chunks,
            intent=query_info["detected_intent"],
        )

        # Step 5: 调用LLM生成回答
        if self.llm_client:
            answer = await self._call_llm(prompt)
        else:
            answer = self._mock_generate(prompt, context_chunks)

        # Step 6: 构建引用来源
        sources = self._build_sources(retrieval_results)

        return RAGResponse(
            answer=answer,
            sources=sources,
            query_understanding=query_info,
            retrieval_stats={
                "total_retrieved": len(retrieval_results),
                "context_used": len(context_chunks),
                "time_range": time_range,
            },
            metadata={"model": "rag_engine_v1"},
        )

    def _assemble_context(
        self, retrieval_results: List[Dict]
    ) -> List[Dict]:
        """
        上下文窗口组装

        策略：
        1. 按综合得分排序取top_k
        2. 控制总token数不超过上限
        3. 去除重复内容
        """
        selected = []
        used_tokens = 0
        seen_texts = set()

        for result in retrieval_results:
            text = result["text"]
            # 简单去重
            text_hash = hash(text[:100])  # 用前100字符做简易去重
            if text_hash in seen_texts:
                continue

            token_count = result["metadata"].get("token_count", len(text) // 2)

            if used_tokens + token_count > self.max_context_tokens:
                continue
            if len(selected) >= self.max_context_chunks:
                break

            seen_texts.add(text_hash)
            used_tokens += token_count
            selected.append({
                "text": text,
                "metadata": result["metadata"],
                "score": result["scores"]["final"],
            })

        return selected

    async def _call_llm(self, prompt: str) -> str:
        """调用LLM API（示例使用DashScope SDK）"""
        try:
            # DashScope调用示例
            from dashscope import Generation
            response = await Generation.call(
                model="qwen-max",
                prompt=prompt,
                max_tokens=2000,
                temperature=0.3,  # 低温度保证事实准确性
                top_p=0.8,
            )
            return response.output.text
        except ImportError:
            # OpenAI兼容接口示例
            from openai import AsyncOpenAI
            client = AsyncOpenAI()
            response = await client.chat.completions.create(
                model="qwen-max",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0.3,
            )
            return response.choices[0].message.content

    def _mock_generate(self, prompt: str, chunks: List[Dict]) -> str:
        """Mock生成（用于测试，无LLM时）"""
        if not chunks:
            return "抱歉，暂未检索到相关新闻内容。请尝试更换关键词或扩大时间范围。"

        answer = "根据最新新闻资讯，为您整理如下信息：\n\n"
        for i, chunk in enumerate(chunks, 1):
            source = chunk["metadata"].get("source", "未知来源")
            date = chunk["metadata"].get("publish_date", "未知日期")
            text = chunk["text"][:300]
            answer += f"**{i}. [{source}] ({date})**\n{text}...\n\n"

        answer += "\n---\n*以上信息由RAG系统自动聚合，数据来源于各新闻站点。*"
        return answer

    def _build_sources(self, retrieval_results: List[Dict]) -> List[Dict]:
        """构建引用来源列表"""
        sources = []
        for result in retrieval_results[:3]:
            meta = result["metadata"]
            sources.append({
                "title": meta.get("title", "未知标题"),
                "source": meta.get("source", "未知来源"),
                "url": meta.get("url", ""),
                "publish_date": meta.get("publish_date", ""),
                "relevance_score": round(result["scores"]["final"], 3),
            })
        return sources
```

### 4.8 提示词模板

```python
# src/generation/prompt_templates.py
"""RAG系统的提示词模板管理"""

from typing import List, Dict

INTENT_PROMPTS = {
    "news_browsing": "你是一位AI领域的新闻分析师。请基于提供的新闻资讯，为用户梳理最新的行业动态和重要进展。回答应当结构清晰、要点明确。",
    "how_to": "你是一位AI技术实践专家。请基于提供的参考资料，为用户解答技术实践问题。回答应当包含具体步骤和方法论。",
    "comparison": "你是一位AI行业分析专家。请基于提供的新闻和资讯，为用户进行客观的对比分析。回答应当包含多维度对比表格和结论。",
    "definition": "你是一位AI领域的科普专家。请基于提供的资料，用通俗易懂的语言解释相关概念。回答应当由浅入深、配有实例。",
    "general": "你是一位知识渊博的AI行业专家。请基于提供的新闻资讯，准确、全面地回答用户的问题。",
}


def build_rag_prompt(
    user_query: str,
    context_chunks: List[Dict],
    intent: str = "general",
) -> str:
    """
    构建RAG提示词

    采用"系统角色 + 上下文 + 约束 + 问题"的结构化格式。
    """
    system_role = INTENT_PROMPTS.get(intent, INTENT_PROMPTS["general"])

    # 格式化上下文块
    context_text = ""
    for i, chunk in enumerate(context_chunks, 1):
        source = chunk["metadata"].get("source", "未知来源")
        date = chunk["metadata"].get("publish_date", "未知日期")
        title = chunk["metadata"].get("title", "")
        context_text += f"\n【参考资料 {i}】来源: {source} | 日期: {date}"
        if title:
            context_text += f" | 标题: {title}"
        context_text += f"\n{chunk['text']}\n"

    prompt = f"""{system_role}

# 参考资料
以下是检索到的相关新闻资讯，请基于这些内容回答用户问题。
{context_text}

# 回答要求
1. **准确性**：仅基于上述参考资料回答，不要编造参考资料中没有的信息
2. **引用标注**：引用信息时标注来源编号，如 [参考资料1]
3. **时效性**：优先使用日期较新的资料
4. **结构化**：使用标题、编号列表、表格等方式组织回答
5. **客观性**：保持客观中立，如有争议性内容请呈现多方观点
6. **字数**：回答控制在500-1000字之间

# 用户问题
{user_query}

# 回答
"""
    return prompt
```

### 4.9 API接口

```python
# src/api/main.py
"""FastAPI应用入口"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio

from src.generation.rag_engine import RAGEngine, RAGResponse
from src.ingest.indexer import NewsIndexer
from src.retrieval.retriever import HybridRetriever


# 初始化组件
indexer = NewsIndexer(persist_directory="./data/chroma_db")
retriever = HybridRetriever(indexer=indexer)
rag_engine = RAGEngine(retriever=retriever)

app = FastAPI(
    title="AI新闻RAG系统",
    version="1.0.0",
    description="基于RAG架构的AI热点新闻聚合与智能问答系统",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    """问答请求"""
    query: str
    category: Optional[str] = None
    top_k: int = 5


class ChatResponse(BaseModel):
    """问答响应"""
    answer: str
    sources: List[dict]
    query_understanding: dict
    retrieval_stats: dict


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """智能问答接口"""
    try:
        response: RAGResponse = await rag_engine.query(
            user_query=request.query,
            category=request.category,
            top_k=request.top_k,
        )
        return ChatResponse(
            answer=response.answer,
            sources=response.sources,
            query_understanding=response.query_understanding,
            retrieval_stats=response.retrieval_stats,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_stats():
    """获取系统统计信息"""
    stats = indexer.get_stats()
    return {"status": "running", **stats}


@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}
```

---

## 五、部署方案

### 5.1 Docker Compose 一键部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  # RAG应用服务
  rag-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/ai_news
      - REDIS_URL=redis://redis:6379/0
      - CHROMA_PERSIST_DIR=/app/data/chroma_db
    volumes:
      - ./data:/app/data
    depends_on:
      - db
      - redis
    restart: unless-stopped

  # PostgreSQL数据库
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=ai_news
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Celery Worker（新闻采集与索引更新）
  worker:
    build:
      context: .
      dockerfile: Dockerfile
    command: celery -A src.scheduler.tasks worker --loglevel=info --concurrency=2
    environment:
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    restart: unless-stopped

  # Celery Beat（定时任务调度）
  beat:
    build:
      context: .
      dockerfile: Dockerfile
    command: celery -A src.scheduler.tasks beat --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    restart: unless-stopped

  # Nginx反向代理（生产环境可选）
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - rag-app

volumes:
  pg_data:
  redis_data:
```

### 5.2 Dockerfile

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY src/ src/
COPY config/ config/

# 创建数据目录
RUN mkdir -p /app/data/chroma_db

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 5.3 依赖清单

```
# requirements.txt
# RAG框架
llama-index>=0.10.0
llama-index-embeddings-huggingface>=0.2.0
llama-index-vector-stores-chroma>=0.1.0

# 向量数据库
chromadb>=0.4.0

# Embedding模型
sentence-transformers>=2.2.0

# 文档解析
beautifulsoup4>=4.12.0
markdown>=3.5.0
unstructured>=0.12.0
python-frontmatter>=1.0.0

# LLM API
dashscope>=1.14.0
openai>=1.0.0

# Web框架
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.5.0

# 任务调度
celery>=5.3.0

# 数据库
psycopg2-binary>=2.9.0
redis>=5.0.0
SQLAlchemy>=2.0.0

# 工具
httpx>=0.25.0
feedparser>=6.0.0
numpy>=1.24.0
```

### 5.4 定时任务配置

```python
# src/scheduler/tasks.py
"""Celery定时任务：新闻采集与索引更新"""

from celery import Celery
from celery.schedules import crontab

app = Celery('ai_news_tasks', broker='redis://redis:6379/0')

# 定时任务配置
app.conf.beat_schedule = {
    # 每30分钟采集一次新闻
    'collect-news-every-30min': {
        'task': 'collect_and_index_news',
        'schedule': crontab(minute='*/30'),
        'args': [],
    },
    # 每天凌晨清理过期索引
    'cleanup-expired-daily': {
        'task': 'cleanup_expired_index',
        'schedule': crontab(hour=2, minute=0),
        'args': [],
    },
    # 每小时更新热点评分
    'update-hotness-hourly': {
        'task': 'update_hotness_scores',
        'schedule': crontab(minute=0),
        'args': [],
    },
}


@app.task
def collect_and_index_news():
    """采集新闻并更新向量索引"""
    from src.ingest.crawler import NewsCrawler
    from src.ingest.parser import DocumentParser
    from src.ingest.chunker import SemanticChunker
    from src.ingest.indexer import NewsIndexer

    crawler = NewsCrawler()
    parser = DocumentParser()
    chunker = SemanticChunker()
    indexer = NewsIndexer()

    # 1. 采集新闻
    articles = crawler.crawl_all_sources()

    # 2. 解析、分块、索引
    new_count = 0
    for article in articles:
        parsed = parser.parse_html(article['html'], article['url'])

        if indexer.is_duplicate(indexer.compute_doc_hash(parsed.content)):
            continue

        chunks = chunker.chunk(
            parsed.content,
            metadata={"title": parsed.title, "url": parsed.url}
        )
        indexer.add_documents(chunks, doc_metadata={
            "source": article['source'],
            "category": article.get('category', '综合'),
            "publish_date": article.get('date', ''),
            "title": parsed.title,
            "url": article['url'],
            "importance": article.get('importance', 3),
        })
        new_count += 1

    return {"new_articles_indexed": new_count}


@app.task
def cleanup_expired_index():
    """清理超过90天的过期索引"""
    from src.ingest.indexer import NewsIndexer
    # 实现过期清理逻辑
    pass


@app.task
def update_hotness_scores():
    """更新热点评分（基于浏览量、引用量等信号）"""
    # 实现热点评分更新逻辑
    pass
```

---

## 六、性能优化策略

### 6.1 检索性能优化

| 优化方向 | 具体措施 | 预期效果 |
|----------|----------|----------|
| **向量索引优化** | 使用HNSW算法（ChromaDB默认），设置ef_construction=200, M=16 | 检索延迟<50ms（10万级向量） |
| **批量Embedding** | 使用sentence-transformers的batch_encode，batch_size=128 | 吞吐量提升3-5倍 |
| **GPU加速Embedding** | 部署时使用GPU实例，Embedding速度提升10倍以上 | 单次Embedding从200ms降至20ms |
| **查询缓存** | Redis缓存高频查询的检索结果，TTL=10分钟 | 高频查询响应<10ms |
| **预计算** | 热点话题预计算Embedding和摘要，定时更新 | 热点查询零延迟 |

### 6.2 生成性能优化

| 优化方向 | 具体措施 | 预期效果 |
|----------|----------|----------|
| **流式输出** | 使用FastAPI的StreamingResponse + LLM流式API | 首字延迟降低60% |
| **上下文压缩** | 使用LLMLingua或LongLLMLingua压缩检索到的上下文 | Token消耗降低40% |
| **分级生成** | 简单问题用小模型(Qwen-7B)，复杂问题用大模型(Qwen-72B) | API成本降低50% |
| **回答缓存** | 相似查询（余弦相似度>0.95）命中缓存直接返回 | 重复查询零成本 |

### 6.3 采集与索引优化

| 优化方向 | 具体措施 | 预期效果 |
|----------|----------|----------|
| **增量索引** | 仅对新增/修改文档进行Embedding和索引写入 | 索引更新时间减少90% |
| **异步管道** | 采集 → 解析 → 分块 → Embedding → 写入，全链路异步 | 采集吞吐量提升3倍 |
| **内容去重** | SimHash + 指纹去重，避免重复采集和索引 | 存储空间节省30% |
| **智能调度** | 根据新闻源更新频率动态调整采集间隔 | 避免无效请求，节省带宽 |

### 6.4 代码级优化示例

```python
# 性能优化：批量Embedding与缓存装饰器

import hashlib
import json
import functools
from sentence_transformers import SentenceTransformer


class EmbeddingService:
    """高性能Embedding服务"""

    def __init__(self, model_name: str = "BAAI/bge-large-zh-v1.5"):
        self.model = SentenceTransformer(model_name)
        self._cache = {}  # 生产环境替换为Redis

    def embed_batch(self, texts: list[str], batch_size: int = 128) -> list[list[float]]:
        """批量Embedding，自动处理缓存"""
        results = [None] * len(texts)
        uncached_indices = []
        uncached_texts = []

        # 检查缓存
        for i, text in enumerate(texts):
            cache_key = hashlib.md5(text.encode()).hexdigest()
            if cache_key in self._cache:
                results[i] = self._cache[cache_key]
            else:
                uncached_indices.append(i)
                uncached_texts.append(text)

        # 批量计算未缓存的Embedding
        if uncached_texts:
            embeddings = self.model.encode(
                uncached_texts,
                batch_size=batch_size,
                show_progress_bar=False,
                normalize_embeddings=True,  # L2归一化，配合余弦相似度
            )
            for idx, embedding in zip(uncached_indices, embeddings):
                cache_key = hashlib.md5(texts[idx].encode()).hexdigest()
                results[idx] = embedding.tolist()
                self._cache[cache_key] = embedding.tolist()

        return results


def lru_cache_with_ttl(maxsize=128, ttl_seconds=600):
    """带TTL的LRU缓存装饰器"""
    def decorator(func):
        cache = {}

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # 构建缓存键
            key = hashlib.md5(
                json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str).encode()
            ).hexdigest()

            import time
            now = time.time()

            if key in cache:
                result, timestamp = cache[key]
                if now - timestamp < ttl_seconds:
                    return result
                else:
                    del cache[key]

            result = await func(*args, **kwargs)
            if len(cache) >= maxsize:
                # 简易淘汰：删除最早的一半
                oldest_keys = sorted(cache.items(), key=lambda x: x[1][1])[:maxsize // 2]
                for k, _ in oldest_keys:
                    del cache[k]

            cache[key] = (result, now)
            return result

        return wrapper
    return decorator
```

### 6.5 扩展性优化

| 方向 | 当前方案 | 扩展方案 |
|------|----------|----------|
| 向量库 | ChromaDB（单机） | Milvus集群（分布式，支持亿级向量） |
| Embedding | 本地部署单模型 | 多模型路由（中文用bge，英文用E5） |
| 检索 | 单路向量检索 | 多路召回（向量+BM25+知识图谱） |
| 生成 | 单次生成 | Multi-Agent协作（检索Agent + 生成Agent + 校验Agent） |
| 存储 | 单PostgreSQL | 读写分离 + 分库分表 |

---

## 七、监控与可观测性

### 7.1 关键监控指标

| 指标类别 | 具体指标 | 告警阈值 |
|----------|----------|----------|
| 检索质量 | Top-5召回率 | < 0.6 |
| 检索性能 | P99检索延迟 | > 200ms |
| 生成质量 | 回答相关性评分 | < 3.5/5 |
| 生成性能 | 首字延迟(TTFT) | > 3s |
| 系统健康 | 索引文档总数 | 环比下降>10% |
| 成本 | 日均LLM Token消耗 | > 预算120% |

### 7.2 日志规范

```python
# 结构化日志示例
import structlog

logger = structlog.get_logger()

async def handle_query(query: str):
    logger.info("query_received", query=query)

    start_time = time.time()
    results = retriever.retrieve(query)
    retrieval_time = time.time() - start_time

    logger.info(
        "retrieval_completed",
        query=query,
        result_count=len(results),
        retrieval_time_ms=retrieval_time * 1000,
        top_score=results[0]["scores"]["final"] if results else 0,
    )

    # ... 生成回答 ...
```

---

## 八、总结

本方案基于LlamaIndex + ChromaDB + FastAPI技术栈，完整覆盖了从新闻采集、文档解析、智能分块、向量化、混合检索到LLM生成的全链路设计。核心亮点包括：

1. **混合检索策略** -- 向量语义检索 + 时间衰减 + 重要性加权，确保新闻检索既精准又有时效性
2. **自适应分块** -- 基于语义边界的智能分块，避免截断关键信息
3. **查询理解增强** -- 时间表达式提取、意图识别、查询扩展，提升检索召回率
4. **可扩展架构** -- 模块化设计，支持从ChromaDB平滑迁移到Milvus等分布式向量库
5. **生产级部署** -- Docker Compose一键部署，Celery定时任务，结构化日志与监控

建议分三个阶段落地：
- **MVP阶段（2周）**：实现核心RAG链路，支持50篇以内的新闻问答
- **增强阶段（4周）**：接入多源采集，部署重排序，上线查询缓存
- **规模化阶段（6周）**：迁移分布式向量库，引入Multi-Agent，建立质量评估闭环
