# RAG系统落地方案 — AI热点知识管理与智能创作平台

> 📅 日期：2025年5月28日
> 🎯 目标：基于热点痛点设计RAG系统，实现文档解析→向量化→检索→生成全链路
> 📐 版本：v1.0

---

## 一、系统概述

### 1.1 背景与痛点

基于今日圆桌会议分析，核心痛点聚焦于：
- **信息过载**：AI领域每日产生海量资讯，人工筛选效率极低
- **知识碎片化**：热点信息散落在不同平台，无法形成系统化知识
- **创作效率低**：从热点发现到深度内容产出，链路长、耗时长
- **知识无法沉淀**：AI生成的内容缺乏有效的知识管理机制

### 1.2 系统定位

构建一个面向AI领域内容创作者的 **RAG（Retrieval-Augmented Generation）驱动的知识管理与智能创作平台**，实现：

```
热点采集 → 智能解析 → 知识向量化 → 语义检索 → AI辅助创作 → 多平台分发
```

### 1.3 核心能力

| 能力 | 描述 | 技术方案 |
|------|------|---------|
| 多源采集 | 网页、API、RSS、社交媒体 | Scrapy + Playwright |
| 文档解析 | PDF/HTML/Markdown/图片 | Unstructured + OCR |
| 智能分块 | 语义感知的文档切分 | 递归字符分割 + 语义边界检测 |
| 向量化 | 高质量文本嵌入 | BGE-M3 / text-embedding-3-large |
| 混合检索 | 语义+关键词+元数据 | BM25 + Dense Retrieval |
| 重排序 | 精准相关性排序 | BGE-Reranker-v2-m3 |
| 增强生成 | 基于检索结果的深度创作 | DeepSeek / GPT-4o |
| 知识图谱 | 实体关系抽取与可视化 | Neo4j + LLM抽取 |

---

## 二、技术架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端应用层                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 热点仪表盘 │  │ 知识检索  │  │ 智能创作  │  │ 分析报告  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│                        API网关层                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FastAPI + JWT认证 + 限流 + 日志                      │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                        业务逻辑层                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 采集服务  │  │ 解析服务  │  │ 检索服务  │  │ 生成服务  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 索引服务  │  │ 排序服务  │  │ 缓存服务  │  │ 调度服务  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│                        数据存储层                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Milvus   │  │PostgreSQL│  │  Redis   │  │  Neo4j   │    │
│  │ 向量数据库 │  │ 关系数据  │  │  缓存    │  │ 知识图谱  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐                                │
│  │Elasticsearch│ │ MinIO   │                                │
│  │ 全文检索   │  │ 对象存储 │                                │
│  └──────────┘  └──────────┘                                │
├─────────────────────────────────────────────────────────────┤
│                        基础设施层                             │
│  Docker + Kubernetes + Prometheus + Grafana + ELK           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据流架构

```
数据源 ──→ 采集器 ──→ 消息队列 ──→ 解析器 ──→ 分块器
                                                    │
                                                    ▼
创作请求 ──→ 查询理解 ──→ 混合检索 ──→ 重排序 ──→ 上下文组装
                                                    │
                                                    ▼
                                              LLM生成器 ──→ 后处理 ──→ 输出
```

---

## 三、技术选型

### 3.1 核心技术栈

| 组件 | 技术选型 | 选型理由 |
|------|---------|---------|
| **后端框架** | FastAPI (Python 3.11+) | 异步高性能，AI生态丰富 |
| **向量数据库** | Milvus 2.4 | 开源、高性能、支持混合检索 |
| **全文检索** | Elasticsearch 8.x | 成熟的BM25实现，中文分词支持 |
| **关系数据库** | PostgreSQL 16 | JSON支持好，pgvector扩展 |
| **缓存** | Redis 7.x | 高性能缓存，支持向量缓存 |
| **消息队列** | RabbitMQ | 可靠消息传递，任务调度 |
| **对象存储** | MinIO | S3兼容，私有化部署 |
| **知识图谱** | Neo4j 5.x | 图数据库，实体关系管理 |
| **Embedding模型** | BGE-M3 (multilingual) | 中文效果优秀，多语言支持 |
| **Reranker** | BGE-Reranker-v2-m3 | 精准重排序，多语言 |
| **LLM** | DeepSeek-V2 / GPT-4o | 深度创作能力 |
| **文档解析** | Unstructured + PaddleOCR | 多格式支持，中文OCR |
| **前端** | Vue 3 + Vant 4 | 移动端优先，组件丰富 |
| **部署** | Docker Compose / K8s | 容器化部署 |

### 3.2 Embedding模型对比

| 模型 | 维度 | 最大长度 | 中文效果 | 推理速度 | 推荐场景 |
|------|------|---------|---------|---------|---------|
| BGE-M3 | 1024 | 8192 | ⭐⭐⭐⭐⭐ | 快 | 通用场景（推荐） |
| text-embedding-3-large | 3072 | 8191 | ⭐⭐⭐⭐ | 中 | 需要OpenAI生态 |
| BGE-large-zh-v1.5 | 1024 | 512 | ⭐⭐⭐⭐ | 快 | 纯中文场景 |
| GTE-Qwen2 | 1536 | 32768 | ⭐⭐⭐⭐ | 中 | 长文本场景 |

---

## 四、核心模块设计与关键代码

### 4.1 文档解析模块

```python
"""
文档解析模块 - 支持多格式文档智能解析
"""
from unstructured.partition.auto import partition
from unstructured.staging.base import elements_to_json
import hashlib
import json
from typing import List, Dict
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class ParsedDocument:
    """解析后的文档结构"""
    doc_id: str
    title: str
    source: str
    doc_type: str
    content: str
    elements: List[Dict]
    metadata: Dict
    created_at: str

    def to_dict(self):
        return asdict(self)


class DocumentParser:
    """多格式文档解析器"""

    def __init__(self, ocr_enabled: bool = True):
        self.ocr_enabled = ocr_enabled

    def parse(self, file_path: str, source: str = "") -> ParsedDocument:
        """解析文档"""
        # 生成文档唯一ID
        doc_hash = hashlib.md5(
            f"{file_path}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        # 使用unstructured自动识别格式并解析
        elements = partition(
            filename=file_path,
            ocr_languages=["chi_sim", "eng"] if self.ocr_enabled else None,
            strategy="hi_res" if self.ocr_enabled else "fast"
        )

        # 提取元数据
        metadata = {
            "file_path": file_path,
            "file_type": file_path.split(".")[-1].lower(),
            "element_count": len(elements),
            "parsed_at": datetime.now().isoformat()
        }

        # 组装内容
        content = "\n\n".join([
            str(el) for el in elements if str(el).strip()
        ])

        # 提取标题（取第一个Title类型元素）
        title = ""
        for el in elements:
            if el.category == "Title":
                title = str(el)
                break
        if not title:
            title = file_path.split("/")[-1]

        return ParsedDocument(
            doc_id=doc_hash,
            title=title,
            source=source,
            doc_type=metadata["file_type"],
            content=content,
            elements=[{
                "type": el.category,
                "content": str(el),
                "metadata": el.metadata.to_dict() if el.metadata else {}
            } for el in elements],
            metadata=metadata,
            created_at=datetime.now().isoformat()
        )
```

### 4.2 智能分块模块

```python
"""
智能分块模块 - 语义感知的文档切分
"""
from typing import List, Dict
from dataclasses import dataclass
import re


@dataclass
class Chunk:
    """文档块"""
    chunk_id: str
    doc_id: str
    content: str
    chunk_type: str  # title, paragraph, table, code, list
    index: int
    metadata: Dict


class SemanticChunker:
    """语义感知分块器"""

    def __init__(
        self,
        max_chunk_size: int = 512,
        min_chunk_size: int = 100,
        overlap_size: int = 50,
        separator_threshold: int = 200
    ):
        self.max_chunk_size = max_chunk_size
        self.min_chunk_size = min_chunk_size
        self.overlap_size = overlap_size
        self.separator_threshold = separator_threshold

    def chunk(self, document: ParsedDocument) -> List[Chunk]:
        """对文档进行语义分块"""
        chunks = []
        current_chunk = ""
        chunk_index = 0

        for element in document.elements:
            element_type = element["type"]
            element_content = element["content"]

            # 根据元素类型决定是否切分
            if element_type in ["Title", "Header"]:
                # 标题类元素：保存当前块并开始新块
                if current_chunk.strip():
                    chunks.append(self._create_chunk(
                        document.doc_id, current_chunk, chunk_index
                    ))
                    chunk_index += 1
                current_chunk = f"## {element_content}\n\n"
            elif element_type in ["Table"]:
                # 表格类：独立成块
                if current_chunk.strip():
                    chunks.append(self._create_chunk(
                        document.doc_id, current_chunk, chunk_index
                    ))
                    chunk_index += 1
                chunks.append(self._create_chunk(
                    document.doc_id, element_content, chunk_index, "table"
                ))
                chunk_index += 1
                current_chunk = ""
            elif element_type in ["Code", "CodeSnippet"]:
                # 代码块：独立成块
                if current_chunk.strip():
                    chunks.append(self._create_chunk(
                        document.doc_id, current_chunk, chunk_index
                    ))
                    chunk_index += 1
                chunks.append(self._create_chunk(
                    document.doc_id, element_content, chunk_index, "code"
                ))
                chunk_index += 1
                current_chunk = ""
            else:
                # 正文类：累积到当前块
                current_chunk += element_content + "\n\n"

                # 超过最大块大小时切分
                if len(current_chunk) > self.max_chunk_size:
                    # 寻找最佳切分点（句子边界）
                    split_pos = self._find_split_point(current_chunk)
                    if split_pos > self.min_chunk_size:
                        chunk_content = current_chunk[:split_pos]
                        overlap = current_chunk[max(0, split_pos - self.overlap_size):split_pos]
                        chunks.append(self._create_chunk(
                            document.doc_id, chunk_content, chunk_index
                        ))
                        chunk_index += 1
                        current_chunk = overlap + current_chunk[split_pos:]

        # 保存最后一块
        if current_chunk.strip() and len(current_chunk) > self.min_chunk_size:
            chunks.append(self._create_chunk(
                document.doc_id, current_chunk, chunk_index
            ))

        return chunks

    def _find_split_point(self, text: str) -> int:
        """找到最佳切分点（优先在句子/段落边界）"""
        # 优先在段落边界切分
        paragraph_break = text.rfind("\n\n", 0, self.max_chunk_size)
        if paragraph_break > self.min_chunk_size:
            return paragraph_break

        # 其次在句子边界切分
        sentence_ends = [
            text.rfind("。", 0, self.max_chunk_size),
            text.rfind("！", 0, self.max_chunk_size),
            text.rfind("？", 0, self.max_chunk_size),
            text.rfind(".", 0, self.max_chunk_size),
        ]
        best = max(pos for pos in sentence_ends if pos > 0)
        if best > self.min_chunk_size:
            return best + 1

        return self.max_chunk_size

    def _create_chunk(
        self, doc_id: str, content: str, index: int,
        chunk_type: str = "paragraph"
    ) -> Chunk:
        """创建文档块"""
        import hashlib
        chunk_id = hashlib.md5(
            f"{doc_id}_{index}_{content[:50]}".encode()
        ).hexdigest()[:16]

        return Chunk(
            chunk_id=chunk_id,
            doc_id=doc_id,
            content=content.strip(),
            chunk_type=chunk_type,
            index=index,
            metadata={"char_count": len(content)}
        )
```

### 4.3 向量化与索引模块

```python
"""
向量化与索引模块 - 文档嵌入与向量存储
"""
from pymilvus import (
    connections, Collection, FieldSchema,
    CollectionSchema, DataType, utility
)
from sentence_transformers import SentenceTransformer
from typing import List, Optional
import numpy as np


class VectorStore:
    """向量存储管理器"""

    def __init__(
        self,
        collection_name: str = "ai_hotspot_docs",
        embedding_model: str = "BAAI/bge-m3",
        dimension: int = 1024,
        milvus_uri: str = "http://localhost:19530"
    ):
        self.collection_name = collection_name
        self.dimension = dimension
        self.milvus_uri = milvus_uri

        # 初始化Embedding模型
        self.encoder = SentenceTransformer(embedding_model)

        # 连接Milvus
        connections.connect(uri=milvus_uri)

        # 创建或加载集合
        self._init_collection()

    def _init_collection(self):
        """初始化向量集合"""
        if utility.has_collection(self.collection_name):
            self.collection = Collection(self.collection_name)
        else:
            fields = [
                FieldSchema(name="chunk_id", dtype=DataType.VARCHAR, is_primary=True, max_length=32),
                FieldSchema(name="doc_id", dtype=DataType.VARCHAR, max_length=32),
                FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=8192),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.dimension),
                FieldSchema(name="chunk_type", dtype=DataType.VARCHAR, max_length=32),
                FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=128),
                FieldSchema(name="publish_date", dtype=DataType.VARCHAR, max_length=16),
            ]

            schema = CollectionSchema(fields=fields, description="AI热点文档向量库")
            self.collection = Collection(
                name=self.collection_name,
                schema=schema
            )

            # 创建索引（IVF_FLAT适合中等规模数据）
            index_params = {
                "index_type": "IVF_FLAT",
                "metric_type": "COSINE",
                "params": {"nlist": 128}
            }
            self.collection.create_index(
                field_name="embedding",
                index_params=index_params
            )

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """文本向量化"""
        embeddings = self.encoder.encode(
            texts,
            batch_size=32,
            show_progress_bar=False,
            normalize_embeddings=True  # L2归一化，配合COSINE相似度
        )
        return embeddings

    def add_chunks(self, chunks: List[Chunk], source: str = "", date: str = ""):
        """添加文档块到向量库"""
        texts = [chunk.content for chunk in chunks]
        embeddings = self.embed_texts(texts)

        data = [
            [chunk.chunk_id for chunk in chunks],
            [chunk.doc_id for chunk in chunks],
            [chunk.content for chunk in chunks],
            embeddings.tolist(),
            [chunk.chunk_type for chunk in chunks],
            [source] * len(chunks),
            [date] * len(chunks),
        ]

        self.collection.insert(data)
        self.collection.flush()

    def search(
        self,
        query: str,
        top_k: int = 10,
        filter_expr: str = "",
        output_fields: Optional[List[str]] = None
    ) -> List[Dict]:
        """语义检索"""
        query_embedding = self.embed_texts([query])[0]

        search_params = {
            "metric_type": "COSINE",
            "params": {"nprobe": 16}
        }

        if output_fields is None:
            output_fields = ["chunk_id", "doc_id", "content", "chunk_type", "source"]

        results = self.collection.search(
            data=[query_embedding.tolist()],
            anns_field="embedding",
            param=search_params,
            limit=top_k,
            expr=filter_expr,
            output_fields=output_fields
        )

        return [
            {
                "score": hit.score,
                "content": hit.entity.get("content"),
                "source": hit.entity.get("source"),
                "chunk_type": hit.entity.get("chunk_type"),
                "doc_id": hit.entity.get("doc_id"),
            }
            for hit in results[0]
        ]
```

### 4.4 混合检索与重排序模块

```python
"""
混合检索与重排序模块 - BM25 + 语义检索 + Reranker
"""
from elasticsearch import Elasticsearch
from typing import List, Dict
from sentence_transformers import CrossEncoder


class HybridRetriever:
    """混合检索器"""

    def __init__(
        self,
        vector_store: VectorStore,
        es_host: str = "http://localhost:9200",
        reranker_model: str = "BAAI/bge-reranker-v2-m3",
        semantic_weight: float = 0.7,
        bm25_weight: float = 0.3
    ):
        self.vector_store = vector_store
        self.es = Elasticsearch(es_host)
        self.reranker = CrossEncoder(reranker_model)
        self.semantic_weight = semantic_weight
        self.bm25_weight = bm25_weight

    def retrieve(self, query: str, top_k: int = 20) -> List[Dict]:
        """混合检索"""
        # 1. 语义检索（向量）
        semantic_results = self.vector_store.search(query, top_k=top_k * 2)

        # 2. 关键词检索（BM25）
        bm25_results = self._bm25_search(query, top_k=top_k * 2)

        # 3. 分数融合（Reciprocal Rank Fusion）
        fused_results = self._reciprocal_rank_fusion(
            semantic_results, bm25_results
        )

        # 4. 取top_k个候选
        candidates = fused_results[:top_k]

        # 5. 重排序
        reranked = self._rerank(query, candidates)

        return reranked[:top_k]

    def _bm25_search(self, query: str, top_k: int) -> List[Dict]:
        """BM25全文检索"""
        response = self.es.search(
            index="ai_hotspot_docs",
            body={
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": ["title^3", "content^1"],
                        "type": "best_fields",
                        "fuzziness": "AUTO"
                    }
                },
                "size": top_k,
                "_source": ["chunk_id", "content", "source"]
            }
        )

        return [
            {
                "chunk_id": hit["_source"].get("chunk_id", ""),
                "content": hit["_source"]["content"],
                "source": hit["_source"].get("source", ""),
                "score": hit["_score"],
                "retrieval_type": "bm25"
            }
            for hit in response["hits"]["hits"]
        ]

    def _reciprocal_rank_fusion(
        self,
        list1: List[Dict],
        list2: List[Dict],
        k: int = 60
    ) -> List[Dict]:
        """RRF分数融合"""
        scores = {}

        for rank, item in enumerate(list1):
            chunk_id = item.get("chunk_id", item.get("content", "")[:32])
            scores[chunk_id] = scores.get(chunk_id, 0) + self.semantic_weight / (k + rank + 1)
            if chunk_id not in scores or "content" not in scores[chunk_id]:
                scores[chunk_id] = {"content": item["content"], "source": item.get("source", ""), "fused_score": scores.get(chunk_id, 0)}

        for rank, item in enumerate(list2):
            chunk_id = item.get("chunk_id", item.get("content", "")[:32])
            if chunk_id not in scores:
                scores[chunk_id] = {"content": item["content"], "source": item.get("source", ""), "fused_score": 0}
            scores[chunk_id]["fused_score"] += self.bm25_weight / (k + rank + 1)

        # 按融合分数排序
        sorted_results = sorted(
            scores.values(),
            key=lambda x: x["fused_score"],
            reverse=True
        )

        return sorted_results

    def _rerank(self, query: str, candidates: List[Dict]) -> List[Dict]:
        """重排序"""
        pairs = [(query, c["content"]) for c in candidates]
        scores = self.reranker.predict(pairs)

        for candidate, score in zip(candidates, scores):
            candidate["rerank_score"] = float(score)

        return sorted(candidates, key=lambda x: x["rerank_score"], reverse=True)
```

### 4.5 增强生成模块

```python
"""
增强生成模块 - 基于检索结果的AI内容生成
"""
from openai import OpenAI
from typing import List, Dict, Optional


class RAGGenerator:
    """RAG增强生成器"""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.deepseek.com/v1",
        model: str = "deepseek-chat",
        temperature: float = 0.7,
        max_tokens: int = 4096
    ):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def generate(
        self,
        query: str,
        context: List[Dict],
        system_prompt: Optional[str] = None,
        output_format: str = "article"
    ) -> str:
        """基于检索上下文生成内容"""

        # 组装上下文
        context_text = "\n\n".join([
            f"【参考资料{i+1}】（来源：{c.get('source', '未知')}）\n{c['content']}"
            for i, c in enumerate(context)
        ])

        if system_prompt is None:
            system_prompt = self._get_default_system_prompt(output_format)

        user_prompt = f"""基于以下参考资料，回答用户问题。

## 参考资料
{context_text}

## 用户问题
{query}

## 要求
1. 充分利用参考资料中的信息，不要编造事实
2. 引用资料时标注来源
3. 内容深度足够，字数2000字以上
4. 结构清晰，逻辑严密
5. 包含数据支撑和具体案例"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )

        return response.choices[0].message.content

    def _get_default_system_prompt(self, output_format: str) -> str:
        """获取默认系统提示词"""
        prompts = {
            "article": """你是一位资深科技内容创作者，擅长撰写深度分析文章。
你的写作风格：专业但不晦涩，有深度但不枯燥，善用数据支撑观点。
文章结构：引言（吸引注意）→ 背景分析 → 深度解读 → 案例分析 → 趋势展望 → 总结。
每段3-5句话，总字数2000-2500字。""",

            "summary": """你是一位信息提炼专家，擅长从大量资料中提取核心信息。
输出格式：要点式总结，每个要点包含核心观点+数据支撑。
语言简洁，避免冗余，总字数500-800字。""",

            "report": """你是一位行业分析师，擅长撰写专业分析报告。
报告结构：执行摘要 → 行业背景 → 数据分析 → 痛点识别 → 趋势预测 → 建议。
使用数据图表描述，语言专业严谨，总字数3000-5000字。"""
        }
        return prompts.get(output_format, prompts["article"])
```

---

## 五、部署方案

### 5.1 Docker Compose 部署

```yaml
version: '3.8'

services:
  # API服务
  api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/rag_db
      - MILVUS_URI=http://milvus:19530
      - ES_HOST=http://elasticsearch:9200
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - milvus
      - elasticsearch
      - redis

  # 前端
  web:
    build: ./web
    ports:
      - "3000:80"
    depends_on:
      - api

  # PostgreSQL
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: rag_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Milvus
  milvus:
    image: milvusdb/milvus:v2.4-latest
    ports:
      - "19530:19530"
      - "9091:9091"
    volumes:
      - milvus_data:/var/lib/milvus

  # Elasticsearch
  elasticsearch:
    image: elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # MinIO
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  milvus_data:
  es_data:
  minio_data:
```

### 5.2 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 文档解析速度 | <5s/篇 | 10页以内PDF |
| Embedding速度 | 1000条/分钟 | BGE-M3 batch=32 |
| 检索延迟(P99) | <200ms | 混合检索+重排序 |
| 生成延迟(P99) | <30s | 2000字文章 |
| 系统可用性 | 99.9% | 月度SLA |
| 并发检索 | 100 QPS | 单节点 |

---

## 六、成本估算

| 资源 | 规格 | 月费用（估算） |
|------|------|-------------|
| 云服务器 | 4C8G × 2 | ¥800 |
| GPU服务器 | A10 24G × 1（Embedding） | ¥3000 |
| Milvus | 自建 | 含在服务器 |
| LLM API | DeepSeek-V2 | ¥500-2000 |
| 对象存储 | 100GB | ¥20 |
| 域名+SSL | - | ¥100 |
| **合计** | - | **¥4420-5920/月** |

---

## 七、后续优化方向

1. **增量索引**：支持热点文档的实时增量更新
2. **查询改写**：LLM辅助的查询理解和扩展
3. **多模态RAG**：支持图片、视频内容的检索与生成
4. **个性化推荐**：基于用户画像的知识推荐
5. **协作编辑**：多人协作的知识库管理
6. **自动标签**：LLM自动为文档生成标签和分类

---

*文档版本：v1.0*
*创建日期：2025年5月28日*
*作者：AI热点雷达项目组*
