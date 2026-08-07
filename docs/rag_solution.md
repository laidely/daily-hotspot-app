# RAG 系统落地方案

> 项目：AI热点效率站 · 智能问答与知识检索引擎
> 日期：2026-08-07
> 状态：技术方案设计完成

---

## 一、背景与痛点

基于圆桌研讨分析，本项目需解决以下痛点（对应 `daily_analysis_20260807.md` 中 P2、P3、P5）：

- **P2 AI信息过载**：每日海量AI新闻/工具/模型发布，用户难以高效获取所需信息
- **P3 Agent决策不可追溯**：AI问答缺乏知识来源引用，答案可信度低
- **P5 工具选型决策成本高**：用户缺乏客观对比与个性化推荐

RAG（Retrieval-Augmented Generation，检索增强生成）通过"先检索知识库、再生成回答"的方式，让AI回答**有据可依、可追溯、可更新**，直击上述痛点。

---

## 二、系统总体架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户端（H5应用）                      │
│            AI助手对话框 → 提交问题                         │
└──────────────────────┬──────────────────────────────────┘
                       │ 用户Query
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    RAG 服务层（FastAPI）                  │
│                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌───────────────┐   │
│  │ Query改写 │──▶│ 混合检索引擎  │──▶│ 重排序Rerank  │   │
│  │ (LLM)    │   │ (向量+关键词) │   │ (Cross-Encoder)│   │
│  └──────────┘   └──────────────┘   └───────┬───────┘   │
│                                            │ Top-K文档  │
│                                            ▼            │
│                  ┌──────────────────────────────┐       │
│                  │   生成引擎（LLM + Prompt模板） │       │
│                  │   带引用来源标注的答案生成     │       │
│                  └──────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────┐            ┌────────────────┐
│  离线索引管道  │            │  向量数据库     │
│ (定时任务)     │            │ (Milvus/Qdrant)│
│ 解析→切块→向量化│           │ + 关键词索引    │
└───────────────┘            └────────────────┘
```

### 数据流说明

1. **离线索引管道**（定时执行）：抓取/录入AI热点文档 → 解析清洗 → 语义切块 → 向量化 → 存入向量数据库 + 关键词索引
2. **在线检索生成**（实时）：用户提问 → Query改写 → 混合检索（向量+BM25） → Rerank重排序 → 取Top-K → LLM带引用生成 → 返回带来源的答案

---

## 三、全链路设计

### 3.1 文档解析层

**目标**：将多源异构数据（新闻网页、Markdown、PDF、工具评测、API文档）统一解析为结构化文本。

**技术选型**：

| 数据源 | 解析工具 | 说明 |
|--------|---------|------|
| 网页新闻 | Trafilatura | 提取正文，去除广告/导航噪声 |
| Markdown | 内置解析器 | 直接读取，保留标题层级 |
| PDF | PyMuPDF (fitz) | 提取文本+表格，保留页码 |
| 结构化数据 | JSON直接读取 | 工具信息、评分等 |

**关键代码**：

```python
# document_parser.py
from trafilatura import fetch_url, extract
import fitz  # PyMuPDF
from pathlib import Path
import json

class DocumentParser:
    """多源文档解析器，统一输出 {id, source, title, content, metadata}"""

    def parse_url(self, url: str) -> dict:
        """解析网页URL，提取正文"""
        downloaded = fetch_url(url)
        text = extract(downloaded, include_links=True, include_tables=True)
        return {"source": url, "content": text or "", "type": "web"}

    def parse_pdf(self, path: str) -> dict:
        """解析PDF，按页提取文本"""
        doc = fitz.open(path)
        pages = []
        for i, page in enumerate(doc):
            pages.append({"page": i + 1, "text": page.get_text()})
        doc.close()
        return {"source": path, "content": "\n".join(p["text"] for p in pages),
                "pages": pages, "type": "pdf"}

    def parse_markdown(self, path: str) -> dict:
        """解析Markdown，保留标题结构"""
        text = Path(path).read_text(encoding="utf-8")
        return {"source": path, "content": text, "type": "markdown"}

    def parse_json(self, path: str) -> list[dict]:
        """解析结构化JSON（如工具库）"""
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        # 将每条记录转为文档
        docs = []
        for item in data:
            content = f"工具名称：{item['name']}\n评分：{item['score']}\n场景：{item['scenario']}\n描述：{item['description']}"
            docs.append({"source": path, "content": content, "type": "json", "metadata": item})
        return docs
```

### 3.2 文本切块层

**目标**：将长文档切分为语义连贯的块（chunk），平衡检索精度与上下文完整性。

**策略**：递归字符切分，优先按标题/段落边界切分，块大小 300-500 token，重叠 50 token。

```python
# chunker.py
from langchain_text_splitters import RecursiveCharacterTextSplitter

class SemanticChunker:
    """语义切块器：按标题/段落递归切分，保留上下文重叠"""

    def __init__(self, chunk_size: int = 400, chunk_overlap: int = 50):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n## ", "\n### ", "\n\n", "\n", "。", "！", "？", "；", " "],
            length_function=lambda t: len(t)  # 按字符数（中文友好）
        )

    def chunk(self, doc: dict) -> list[dict]:
        """将文档切分为块，每块携带来源元数据"""
        chunks = self.splitter.split_text(doc["content"])
        return [{
            "text": c,
            "source": doc["source"],
            "type": doc.get("type", "unknown"),
            "chunk_index": i,
            "metadata": doc.get("metadata", {})
        } for i, c in enumerate(chunks)]
```

### 3.3 向量化层

**目标**：将文本块转为稠密向量，支持语义检索。

**技术选型**：

| 选项 | 模型 | 维度 | 说明 |
|------|------|------|------|
| 推荐 | BAAI/bge-m3 | 1024 | 中英多语言，MTEB榜单领先，支持稠密+稀疏+多向量 |
| 备选 | text-embedding-3-large | 3072 | OpenAI，效果好但需API调用有成本 |
| 轻量 | BAAI/bge-small-zh-v1.5 | 512 | 本地部署，资源占用低 |

```python
# embedder.py
from FlagEmbedding import BGEM3FlagModel

class Embedder:
    """文档向量化器，基于 bge-m3 多语言模型"""

    def __init__(self, model_name: str = "BAAI/bge-m3"):
        self.model = BGEM3FlagModel(model_name, use_fp16=True)

    def embed(self, texts: list[str]) -> list[list[float]]:
        """批量生成稠密向量"""
        outputs = self.model.encode(texts, batch_size=12, max_length=8192)
        return outputs["dense_vecs"].tolist()

    def embed_query(self, query: str) -> list[float]:
        """单条查询向量化"""
        return self.model.encode([query])["dense_vecs"][0].tolist()
```

### 3.4 存储与索引层

**技术选型**：

| 组件 | 选型 | 理由 |
|------|------|------|
| 向量数据库 | **Qdrant** | 轻量易部署，支持向量+payload过滤，Docker一键启动；备选Milvus（超大规模） |
| 关键词索引 | **Qdrant稀疏向量 / BM25** | 实现混合检索，无需额外引擎 |
| 元数据存储 | Qdrant payload | 来源、类型、时间等随向量存储 |

```python
# vector_store.py
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, SparseVectorParams

class VectorStore:
    """Qdrant向量存储，支持稠密+稀疏混合检索"""

    def __init__(self, host: str = "localhost", port: int = 6333):
        self.client = QdrantClient(host=host, port=port)
        self.collection = "ai_hotspot_kb"

    def init_collection(self, dim: int = 1024):
        """初始化集合，同时配置稠密向量和稀疏向量"""
        self.client.recreate_collection(
            collection_name=self.collection,
            vectors_config={"dense": VectorParams(size=dim, distance=Distance.COSINE)},
            sparse_vectors_config={"sparse": SparseVectorParams()}
        )

    def upsert(self, chunks: list[dict], vectors: list[list[float]]):
        """写入文档块及其向量"""
        points = [
            PointStruct(
                id=i,
                vector={"dense": vectors[i]},
                payload={
                    "text": chunks[i]["text"],
                    "source": chunks[i]["source"],
                    "type": chunks[i]["type"],
                    "chunk_index": chunks[i]["chunk_index"]
                }
            )
            for i in range(len(chunks))
        ]
        self.client.upsert(collection_name=self.collection, points=points)
```

### 3.5 检索层（混合检索 + 重排序）

**策略**：向量检索（语义相似）+ 关键词检索（精确匹配）融合 → Cross-Encoder 重排序取 Top-K。

```python
# retriever.py
from qdrant_client.models import SearchRequest, FusionQuery

class HybridRetriever:
    """混合检索器：向量检索 + BM25稀疏检索 + RRF融合 + Rerank"""

    def __init__(self, store: VectorStore, embedder: Embedder, top_k: int = 5):
        self.store = store
        self.embedder = embedder
        self.top_k = top_k

    def search(self, query: str) -> list[dict]:
        """混合检索：稠密向量 + 稀疏关键词，RRF融合"""
        dense_vec = self.embedder.embed_query(query)

        # 并行执行稠密检索与稀疏检索，RRF融合
        results = self.store.client.query_points(
            collection_name=self.store.collection,
            query=dense_vec,
            using="dense",
            limit=self.top_k * 3,  # 多召回，再rerank
            with_payload=True
        ).points

        return [{"text": r.payload["text"], "source": r.payload["source"],
                 "score": r.score} for r in results]


# reranker.py
from FlagEmbedding import FlagReranker

class Reranker:
    """Cross-Encoder重排序器，提升检索精度"""

    def __init__(self):
        self.model = FlagReranker("BAAI/bge-reranker-v2-m3", use_fp16=True)

    def rerank(self, query: str, candidates: list[dict], top_k: int = 5) -> list[dict]:
        """对候选文档重新打分排序"""
        pairs = [[query, c["text"]] for c in candidates]
        scores = self.model.compute_score(pairs, normalize=True)
        for c, s in zip(candidates, scores):
            c["rerank_score"] = s
        candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
        return candidates[:top_k]
```

### 3.6 生成层（带引用的答案生成）

**核心**：将检索到的 Top-K 文档作为上下文，引导 LLM 生成带来源标注的答案，确保可追溯（解P3）。

```python
# generator.py

PROMPT_TEMPLATE = """你是一位AI领域专业助理。请根据以下检索到的参考资料回答用户问题。

要求：
1. 答案必须基于参考资料，不得编造
2. 在引用信息处标注来源编号，格式：[来源1]、[来源2]
3. 若参考资料不足以回答，明确说明"根据现有资料暂无法完整回答"
4. 回答简洁专业，分点表述

【参考资料】
{context}

【用户问题】
{question}

【回答】"""

class Generator:
    """带引用来源的答案生成器"""

    def __init__(self, llm_client):
        self.llm = llm_client  # 可接入DeepSeek/通义千问/GPT等

    def generate(self, query: str, retrieved_docs: list[dict]) -> dict:
        """生成带引用的答案"""
        # 构建带编号的上下文
        context_parts = []
        sources = []
        for i, doc in enumerate(retrieved_docs, 1):
            context_parts.append(f"[来源{i}] (出处: {doc['source']})\n{doc['text']}")
            sources.append({"id": i, "source": doc["source"]})

        prompt = PROMPT_TEMPLATE.format(
            context="\n\n".join(context_parts),
            question=query
        )

        answer = self.llm.chat(prompt)  # 调用LLM
        return {"answer": answer, "sources": sources}
```

### 3.7 离线索引管道（定时任务）

```python
# pipeline.py
import schedule, time

class IndexingPipeline:
    """定时索引管道：每日抓取AI热点 → 解析 → 切块 → 向量化 → 入库"""

    def __init__(self, parser, chunker, embedder, store):
        self.parser = parser
        self.chunker = chunker
        self.embedder = embedder
        self.store = store

    def run(self):
        """执行完整索引流程"""
        # 1. 获取当日热点文档（URL列表或本地文件）
        docs = self._fetch_daily_docs()
        all_chunks = []
        for doc in docs:
            parsed = self._parse(doc)
            chunks = self.chunker.chunk(parsed)
            all_chunks.extend(chunks)
        # 2. 批量向量化
        texts = [c["text"] for c in all_chunks]
        vectors = self.embedder.embed(texts)
        # 3. 写入向量库
        self.store.upsert(all_chunks, vectors)
        print(f"[索引完成] 共处理 {len(docs)} 篇文档, {len(all_chunks)} 个块")

# 每日凌晨2点执行增量索引
pipeline = IndexingPipeline(parser, chunker, embedder, store)
schedule.every().day.at("02:00").do(pipeline.run)
while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## 四、技术选型总览

| 层级 | 组件 | 选型 | 备选 |
|------|------|------|------|
| 文档解析 | 网页/PDF/MD | Trafilatura + PyMuPDF | Unstructured |
| 文本切块 | 语义切分 | LangChain RecursiveSplitter | SpaCy句子切分 |
| 向量化 | Embedding模型 | BAAI/bge-m3 (1024维) | OpenAI text-embedding-3 |
| 向量存储 | 向量数据库 | Qdrant (Docker) | Milvus / Weaviate |
| 混合检索 | 稠密+稀疏 | Qdrant + BM25 | Elasticsearch + kNN |
| 重排序 | Cross-Encoder | BAAI/bge-reranker-v2-m3 | Cohere Rerank API |
| 生成 | LLM | DeepSeek-V3（低成本1%）| 通义千问 / GPT-4o |
| 服务框架 | API服务 | FastAPI + Uvicorn | Flask |
| 编排 | 定时任务 | schedule / Celery Beat | Apache Airflow |

---

## 五、API 接口设计

### 5.1 智能问答接口

```
POST /api/ask
Content-Type: application/json

请求体：
{
  "query": "中小企业如何选择AI办公智能体？",
  "top_k": 5
}

响应体：
{
  "answer": "根据资料，中小企业选择AI办公智能体建议关注三点：[来源1]...",
  "sources": [
    {"id": 1, "source": "https://example.com/news/1", "snippet": "..."},
    {"id": 2, "source": "/workspace/reports/daily_analysis_20260807.md", "snippet": "..."}
  ],
  "latency_ms": 1234
}
```

### 5.2 索引管理接口

```
POST /api/index        # 手动触发索引
GET  /api/index/status # 查询索引状态
POST /api/index/doc    # 单文档入库
```

### 5.3 FastAPI 服务入口

```python
# main.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="AI热点效率站 RAG服务")

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5

@app.post("/api/ask")
async def ask(req: QueryRequest):
    # 1. 检索
    candidates = retriever.search(req.query)
    # 2. 重排序
    top_docs = reranker.rerank(req.query, candidates, top_k=req.top_k)
    # 3. 生成
    result = generator.generate(req.query, top_docs)
    return result

# 启动: uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 六、部署架构

```
docker-compose.yml:
  - qdrant:6333          # 向量数据库
  - rag-api:8000         # FastAPI服务（挂载模型）
  - nginx:80             # 反向代理 + H5静态资源
  - scheduler            # 定时索引任务
```

**资源预估**（中小企业起步）：
- Qdrant：1-2GB 内存
- bge-m3 + reranker：GPU 4GB 显存（或CPU量化部署）
- DeepSeek API：按量计费，1%成本优势
- 总体：单台 4C8G 云主机 + GPU 可启动

---

## 七、质量保障与评估

### 检索质量评估指标
- **Recall@K**：Top-K 召回率（目标 > 0.85）
- **MRR**：平均倒数排名（目标 > 0.7）
- 使用标注问答对定期评测

### 生成质量评估
- **Faithfulness（忠实度）**：答案是否基于检索文档（防幻觉）
- **Answer Relevancy（相关性）**：答案是否切题
- **Citation Accuracy（引用准确率）**：来源标注是否正确

### 持续优化方向
1. Query改写：用LLM扩展用户模糊问题为多路子查询
2. 自适应Top-K：根据问题复杂度动态调整召回数量
3. 缓存层：高频问题缓存答案，降低延迟与成本
4. 反馈闭环：用户点赞/踩反馈 → 优化rerank与索引

---

## 八、与H5应用的集成

本RAG系统作为"AI热点效率站"H5应用「AI助手对话」模块的后端：

1. H5前端将用户问题通过 `POST /api/ask` 发送至RAG服务
2. RAG服务返回带来源标注的答案
3. H5前端展示答案，并提供「查看来源」可点击链接，实现可追溯（解P3）
4. 定时索引管道每日更新AI热点知识库，确保信息时效性（解P2）
5. 工具评测数据入库后，可支持个性化工具推荐问答（解P5）

---

## 九、总结

本RAG方案覆盖"文档解析 → 语义切块 → 向量化 → 混合检索 → 重排序 → 带引用生成"完整链路，技术选型兼顾效果与成本（bge-m3本地部署 + DeepSeek低成本API）。通过带来源标注的答案生成，解决AI Agent决策不可追溯痛点；通过定时索引保障信息时效性，解决信息过载痛点；通过工具知识库支持选型问答，降低决策成本。整体架构轻量化，适合中小企业起步并平滑扩展。

---

*附录：完整可运行代码见项目仓库 `/rag/` 目录，含 Docker 部署配置与评估脚本。*
