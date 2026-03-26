---
slug: "elasticsearch-ai-platform"
title: "Elasticsearch AI: Vector Search, RAG, and Agent Builder"
excerpt: "ELSER v2 beats BM25 by 18% NDCG@10. Inference endpoints, Jina models, GPU indexing, and Agent Builder make Elasticsearch a full production AI platform."
date: "2026-02-14"
readTime: "12 min read"
tags: ["Elasticsearch", "AI/ML", "Platform Engineering"]
author: "Ade A."
imageUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80"
imageAlt: "Abstract neural network visualization with glowing blue and teal connection nodes on a dark background representing AI vector embedding space"
---

# Elasticsearch AI: Vector Search, RAG, and Agent Builder

Elasticsearch now ships with a built-in ML model, a unified inference layer covering 20+ providers, GPU-accelerated vector indexing, and a native agentic framework — all in the same cluster.

The operational argument for keeping AI workloads here is concrete: document-level RBAC on vector queries, ILM on embeddings, hybrid BM25 + semantic search in a single request, and no second cluster to operate. The teams I've seen pull out a dedicated vector store did it after they realised they were running dual-write pipelines to keep it in sync with Elasticsearch — every document update needed to propagate to two systems, and eventual consistency windows kept causing retrieval mismatches. Consolidating on Elasticsearch removed an entire class of synchronisation bugs.

This post covers the full picture: sparse vs dense vector storage, built-in models (ELSER and Jina), the Elastic Inference Service, GPU indexing, and three practical paths to RAG with working code for each.

> **Key Takeaways**
> - Elasticsearch stores vectors natively with three field types: `dense_vector` (HNSW, float/int8/int4/binary quantization), `sparse_vector` (ELSER inverted index, explainable), and `semantic_text` (recommended default, auto-manages the inference endpoint) ([Vector search in Elasticsearch](https://www.elastic.co/docs/solutions/search/vector)).
> - Sparse vectors (ELSER) outperform dense vectors on exact-term queries — model numbers, product codes, proper nouns — while dense vectors excel at open-ended natural language questions. Most production workloads benefit from hybrid search combining both.
> - ELSER v2 achieves an 18% NDCG@10 improvement over BM25 across BEIR benchmarks with no fine-tuning required ([ELSER docs](https://www.elastic.co/docs/explore-analyze/machine-learning/nlp/ml-nlp-elser); [Thakur et al., 2021](https://arxiv.org/abs/2104.08663)).
> - Jina multilingual models (`jina-embeddings-v5-text-small`, `jina-reranker-v3`) are now available via Elastic Inference Service — no ML node, no JinaAI API key, billed per token ([Jina models on EIS](https://www.elastic.co/docs/explore-analyze/machine-learning/nlp/ml-nlp-jina)).
> - GPU-accelerated HNSW indexing is available in Preview (Stack 9.3) via NVIDIA cuVS, reducing CPU pressure during large dense vector ingest ([GPU vector indexing](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/gpu-vector-indexing)).
> - Elastic Agent Builder + Workflows chains Elasticsearch query results directly into LLM reasoning via the `ai.agent` step, with no custom glue code ([Agent Builder + Workflows](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/agents-and-workflows)).

> **TL;DR** — Elasticsearch stores vectors natively (`semantic_text`, `dense_vector`, `sparse_vector`), runs ELSER and Jina models in-cluster or via managed EIS, accelerates dense vector index builds with GPU (Preview), and ties LLM reasoning into deterministic workflows via Agent Builder. One platform, no extra infrastructure.

---

## Elasticsearch as a Vector Database

Elasticsearch is not a dedicated vector database — it's a general-purpose data platform that added native vector support because semantic search needed it. Bolting on a second system just for embeddings is operational debt most teams don't want.

The three vector field types cover distinct use cases ([Vector search in Elasticsearch](https://www.elastic.co/docs/solutions/search/vector)):

<table>
<thead>
<tr><th>Field Type</th><th>Query Type</th><th>Best For</th></tr>
</thead>
<tbody>
<tr><td><code>dense_vector</code></td><td><code>knn</code></td><td>Semantic similarity with your own embedding model</td></tr>
<tr><td><code>sparse_vector</code></td><td><code>sparse_vector</code></td><td>ELSER-based semantic term expansion, explainable results</td></tr>
<tr><td><code>semantic_text</code></td><td><code>semantic</code></td><td>Recommended default — inference endpoint manages the model</td></tr>
</tbody>
</table>

### Sparse vs Dense Vectors — What Actually Differs

Dense vectors are fixed-length float arrays — 768 to 3,072 dimensions depending on the model. Every document maps to a point in a continuous semantic space. Cosine similarity between points determines relevance. This works well for natural language questions where intent matters more than exact wording.

The failure mode is exact-match blindness. A dense embedding compresses all document meaning into a fixed-size float array. Rare terms, model numbers, product codes, and CVE identifiers get diluted in the averaging. A query for a specific product SKU may miss documents that contain it verbatim.

Sparse vectors work differently. ELSER expands documents into weighted token dictionaries at index time — not the original terms, but learned semantic expansions. A document about "horizontal pod autoscaling" might produce weighted entries for "kubernetes scaling", "resource limits", and "HPA controller" — terms semantically related but absent from the original text. At query time, the same expansion applies to the query, and matching happens over the expanded token space. The underlying structure is an inverted index — identical to BM25. No HNSW traversal, no approximate nearest neighbor scan. Exact, fast, and explainable: you can inspect exactly which expanded tokens matched and with what weight.

<table>
<thead>
<tr><th>Dimension</th><th>Dense (<code>dense_vector</code>)</th><th>Sparse (<code>sparse_vector</code> / ELSER)</th></tr>
</thead>
<tbody>
<tr><td>Best for</td><td>Semantic similarity, NL questions</td><td>Mixed workloads, exact + semantic</td></tr>
<tr><td>Exact term handling</td><td>Poor — rare terms get averaged out</td><td>Good — expanded token matching</td></tr>
<tr><td>Index type</td><td>HNSW (approximate NN)</td><td>Inverted index (exact match)</td></tr>
<tr><td>Score explainability</td><td>Opaque (cosine / dot product)</td><td>Decomposable per matched token</td></tr>
<tr><td>Multilingual</td><td>Yes (with multilingual models)</td><td>English only (ELSER)</td></tr>
<tr><td>Storage (1M × 1024 dims)</td><td>~4GB float32, ~1GB int8</td><td>Variable, typically smaller</td></tr>
</tbody>
</table>

**Dense vector storage and quantization.** A 1M-document corpus with 1024-dimension float32 embeddings requires ~4GB of heap per shard before overhead. Elasticsearch supports three quantization modes to reduce this:

- `int8_hnsw` — 4× smaller than float32, minimal precision loss. Default recommendation for production.
- `int4_hnsw` — 8× smaller, moderate precision loss. Suited for very large datasets where storage dominates.
- `bbq_hnsw` — Binary quantization. Extreme compression; best for massive corpora where approximate results are acceptable.

```json
PUT /knowledge-base
{
  "mappings": {
    "properties": {
      "embedding": {
        "type": "dense_vector",
        "dims": 1024,
        "index": true,
        "similarity": "cosine",
        "index_options": { "type": "int8_hnsw" }
      }
    }
  }
}
```

### Why Elasticsearch Rather Than a Dedicated Vector Store?

The synchronisation problem is the one that bites hardest. When your primary documents change — updates, deletes, re-chunking — a separate vector store needs a matching update pipeline. With Elasticsearch, the embedding lives in the same document as the source text. Delete the document, both are gone. Update the text, a single reindex call regenerates the embedding. There is no second system to keep in step, no dual-write complexity, and no eventual consistency window between the two representations.

The security model also transfers without extra work. Document-level RBAC applies to kNN queries the same way it governs full-text retrieval — no separate auth layer to build or maintain. Retention policies, data tiers, and snapshot repositories work on embedding fields without additional configuration.

### Getting Started with `semantic_text`

`semantic_text` is the right starting point. Configure an inference endpoint once (ELSER, OpenAI, Jina, Cohere — anything), and Elasticsearch generates embeddings at index time without ingest pipeline configuration.

```json
PUT /knowledge-base
{
  "mappings": {
    "properties": {
      "title":   { "type": "text" },
      "content_semantic": {
        "type": "semantic_text",
        "inference_id": "my-elser-endpoint"
      }
    }
  }
}
```

<!-- [UNIQUE INSIGHT] -->
The reindex requirement is the sharp edge most teams hit late: if you swap the inference endpoint (ELSER to OpenAI, or model version upgrade), you must reindex. `semantic_text` ties stored vectors to the model that generated them. Plan your model selection before ingesting large datasets — changing models is a reindex, not a config change.

For ingestion methods including how `semantic_text` fits into ingest pipelines, see [Getting Data into Elasticsearch](/blog/getting-data-into-elasticsearch).

---

## ELSER and Jina — Built-in ML Models

### Is ELSER the Right Starting Point for Semantic Search?

Yes — for English-language workloads. ELSER is the path of least resistance: it ships with every deployment, needs no external API call, and doesn't require you to choose a dense embedding model before you have query data to test against. The tradeoff is English-only — if your corpus is multilingual, start with Jina instead ([ELSER docs](https://www.elastic.co/docs/explore-analyze/machine-learning/nlp/ml-nlp-elser)).

ELSER v2 is GA. Rather than producing a dense float array, it maps each document to a weighted token dictionary — a sparse representation that mirrors the structure of an inverted index. The scoring is transparent: you can inspect which expanded terms contributed to a match and at what weight. Across the BEIR evaluation suite ([Thakur et al., 2021](https://arxiv.org/abs/2104.08663)), the model achieves an average 18% NDCG@10 gain over BM25, with 10 wins, 1 draw, and 1 loss across 12 heterogeneous retrieval tasks. The optimised x86-64 Linux build reaches 26 documents per second — a 90% throughput gain over v1.

Deploy via inference API with `adaptive_allocations` (recommended for production):

```json
PUT _inference/sparse_embedding/my-elser-endpoint
{
  "service": "elasticsearch",
  "service_settings": {
    "model_id": ".elser_model_2",
    "adaptive_allocations": {
      "enabled": true,
      "min_number_of_allocations": 1,
      "max_number_of_allocations": 10
    },
    "num_threads": 1
  }
}
```

Set `min_number_of_allocations: 0` in non-critical environments to reduce cost. Set to `1` to keep the model warm for low-latency search. Minimum ML node size: 4GB on Elastic Cloud Hosted.

### Jina: Multilingual Dense Embeddings and Reranking via EIS

<!-- [UNIQUE INSIGHT] -->
Jina models are now available natively through Elastic Inference Service — no JinaAI API key, no ML node management, billed per token through your Elastic subscription ([Jina models docs](https://www.elastic.co/docs/explore-analyze/machine-learning/nlp/ml-nlp-jina)). This is the path for multilingual workloads where ELSER (English-only) isn't the right fit.

Available models through EIS (GA in Stack 9.3):

<table>
<thead>
<tr><th>Model</th><th>Type</th><th>Dimensions</th><th>Context</th><th>Best For</th></tr>
</thead>
<tbody>
<tr><td><code>jina-embeddings-v5-text-small</code></td><td>Embedding</td><td>1024</td><td>32,768 tokens</td><td>Multilingual retrieval, high-precision search</td></tr>
<tr><td><code>jina-embeddings-v5-text-nano</code></td><td>Embedding</td><td>768</td><td>8,192 tokens</td><td>Cost-efficient multilingual embeddings</td></tr>
<tr><td><code>jina-reranker-v3</code></td><td>Reranker</td><td>—</td><td>—</td><td>Listwise reranking, up to 64 docs per call</td></tr>
</tbody>
</table>

Create a Jina embedding endpoint via EIS (no external API key needed):

```json
PUT _inference/text_embedding/jina-embeddings
{
  "service": "elastic",
  "service_settings": {
    "model_id": "jina-embeddings-v5-text-small"
  }
}
```

For reranking after first-stage retrieval:

```json
PUT _inference/rerank/jina-reranker
{
  "service": "elastic",
  "service_settings": {
    "model_id": "jina-reranker-v3"
  }
}
```

Use `jina-reranker-v3` after hybrid or semantic search to push the most relevant results to the top before passing context to an LLM. It processes up to 64 candidates per inference call — well-suited for RAG pipelines where you retrieve 20-50 candidates and want to trim to the top 5-10.

Alternatively, use the direct JinaAI API service if you have an existing JinaAI account:

```json
PUT _inference/text_embedding/jina-direct
{
  "service": "jinaai",
  "service_settings": {
    "api_key": "${JINAAI_API_KEY}",
    "model_id": "jina-embeddings-v3"
  }
}
```

The EIS path is simpler operationally; the direct API path gives you access to models not yet on EIS.

---

## The Inference Endpoint — One API for Every Model

The `/_inference` API is the abstraction layer that makes Elasticsearch model-agnostic. Every embedding provider, reranking service, or generation model registers under a named endpoint with a declared task type. Field mappings and ingest processors reference that name — not the underlying provider. To rotate models, provision a new endpoint and update the reference. Application queries and indexing logic stay unchanged ([Inference endpoint API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-inference-put)).

Supported task types:
- `text_embedding` — dense vectors: OpenAI, Cohere, Vertex, Mistral, Jina, Bedrock, E5…
- `sparse_embedding` — sparse vectors: ELSER
- `rerank` — cross-encoder reranking: Cohere, Jina, VoyageAI, Contextual AI…
- `chat_completion` / `completion` — generation: OpenAI, Anthropic, Azure OpenAI, DeepSeek, Groq…

Coverage includes the major cloud providers (AWS Bedrock, Azure OpenAI, Vertex AI), independent inference providers (Mistral, Groq, DeepSeek, Fireworks), and Elastic's own EIS. The full list is in the [inference endpoint docs](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-inference-put) — it updates with each release, so checking there is more reliable than any list I could write here.

<!-- [UNIQUE INSIGHT] -->
The practical value here is that model selection becomes an infrastructure concern, not an application concern. When a provider reprices, a newer model outperforms the current one, or a compliance requirement mandates a switch, you provision a new endpoint and update a single reference. No query rewrites, no mapping migrations, no application deploys. At scale — across dozens of indices and multiple services consuming the same inference layer — that decoupling is worth designing for from the start.

---

## Elastic Inference Service — Managed Models, No ML Nodes

Elastic Inference Service (EIS) runs ML models on Elastic-managed GPU infrastructure, billed per token rather than per ML node VCU ([EIS docs](https://www.elastic.co/docs/explore-analyze/elastic-inference/eis)). GA on Stack 9.3. For teams not running dedicated ML nodes, EIS is the operational-zero path to semantic search and LLM integration.

Models available through EIS: ELSER, Jina embeddings (v3, v5-nano, v5-small), Jina rerankers (v2, v3), Gemini Embedding v1, OpenAI text-embedding-3-small/large, Microsoft multilingual E5 large, and LLM chat models including Claude Sonnet/Opus, Gemini 2.5, and OpenAI GPT-4o.

<!-- [UNIQUE INSIGHT] -->
ELSER on EIS specifically shows better ingest throughput than self-managed ML nodes, with equivalent search latency. If you're already on Elastic Cloud and your bottleneck is embedding generation speed during large ingest runs, EIS is worth benchmarking against your current ML node setup before provisioning more nodes.

Rate limits on EIS: 6,000 requests/min and 6,000,000 tokens/min for ELSER and Jina embeddings; 600 requests/min for rerankers. Inference requests route to the nearest region (AWS `us-east-1` or GCP `us-east4`). ELSER and Jina requests process entirely within Elastic infrastructure — no third-party routing.

---

## GPU-Accelerated Vector Indexing

GPU-accelerated HNSW index construction is available in Preview in Stack 9.3, powered by the NVIDIA cuVS library ([GPU vector indexing](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/gpu-vector-indexing)). It targets large-scale dense vector ingest — particularly batch loads where index build time is the bottleneck and you want to free up CPU for search and other tasks.

Requirements: NVIDIA GPU with Ampere architecture (compute capability ≥ 8.0), minimum 8GB GPU memory, CUDA runtime and cuVS libraries, Linux x86_64, Java 22+, Enterprise subscription. Supports `hnsw` and `int8_hnsw` index types with `float` element type.

Enable at the node level:

```yaml
# elasticsearch.yml
vectors.indexing.use_gpu: true
```

Monitor cluster-wide GPU indexing status:

```bash
GET _xpack/usage
```

Response:
```json
{
  "gpu_vector_indexing": {
    "available": true,
    "enabled": true,
    "index_build_count": 30,
    "nodes_with_gpu": 3,
    "nodes": [
      { "type": "NVIDIA L4", "memory_in_bytes": 24000000000, "enabled": true, "index_build_count": 10 },
      { "type": "NVIDIA A100", "memory_in_bytes": 80000000000, "enabled": true, "index_build_count": 10 }
    ]
  }
}
```

Two performance notes from the docs worth knowing: first, use base64-encoded vectors rather than JSON arrays — JSON parsing can become the bottleneck when the GPU can process data faster than it can be parsed. Second, avoid network-attached storage; NVMe is necessary to keep pace with GPU index build rates.

For autoscaling patterns relevant to GPU node sizing, see [Kubernetes Autoscaling: HPA vs KEDA](/blog/kubernetes-autoscaling-hpa-vs-keda).

---

## RAG, Workflows, and Agentic Pipelines

RAG with Elasticsearch pairs semantic or hybrid retrieval with LLM generation. Fetch relevant passages, inject them into the model's context window, and receive a grounded answer with traceable source attribution ([RAG with Elasticsearch](https://www.elastic.co/docs/solutions/search/rag)). Because retrieval passes through the same query engine as the rest of your data, access controls apply at the document level automatically. A user can only receive context from documents they are authorised to read — no enforcement code required at the application layer.

### Three RAG Paths

**Path 1: ES|QL `COMPLETION`** — retrieval and LLM generation in a single ES|QL query. Minimal setup; useful for quick prototypes, dashboards, and ad-hoc question answering over structured data.

```json
POST /_query
{
  "query": """
    FROM knowledge-base
    | WHERE MATCH(content, "kubernetes resource limits")
    | SORT _score DESC
    | LIMIT 5
    | KEEP title, content
    | COMPLETION "Summarize the key points about kubernetes resource limits based on the context." USING {
        "inferenceId": "my-openai-endpoint",
        "input": "content"
      }
  """
}
```

The `COMPLETION` command passes the retrieved rows to the specified inference endpoint and returns a generated answer alongside the source documents. No application code needed.

---

**Path 2: Custom implementation** — full control over chunking, context window assembly, and prompt engineering. The recommended pattern for production applications that need deterministic retrieval logic or multi-step RAG.

```python
from elasticsearch import Elasticsearch

es = Elasticsearch(
    "https://my-cluster.es.io:443",
    api_key="your-api-key"
)

query = "How does Kubernetes handle resource limits for pods?"

# Step 1: Hybrid retrieval — BM25 + semantic via RRF
resp = es.search(
    index="knowledge-base",
    body={
        "retriever": {
            "rrf": {
                "retrievers": [
                    {"standard": {"query": {"match": {"content": query}}}},
                    {"standard": {"query": {"semantic": {"field": "content_semantic", "query": query}}}}
                ],
                "rank_window_size": 20,
                "rank_constant": 20
            }
        },
        "size": 5,
        "_source": ["title", "content"]
    }
)

# Step 2: Assemble context from top hits
context = "\n\n---\n\n".join(
    f"[{hit['_source']['title']}]\n{hit['_source']['content']}"
    for hit in resp["hits"]["hits"]
)

# Step 3: Generate via Elasticsearch inference API
response = es.inference.inference(
    inference_id="my-openai-endpoint",
    task_type="chat_completion",
    body={
        "input": (
            "Answer using only the context below.\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {query}"
        )
    }
)

print(response["completion"][0]["result"])
```

Because retrieval goes through Elasticsearch, document-level RBAC applies automatically. Users only retrieve documents they have read access to — no custom enforcement needed at the application layer.

---

**Path 3: Elastic Agent Builder** — Elastic's native agentic framework. Configured in Kibana, connects directly to Elasticsearch knowledge bases, supports tool use, and composes with Elastic Workflows for multi-step automation. The right choice when you need session memory, tool orchestration, and auditability without building an agent framework from scratch.

### Agent Builder + Elastic Workflows

Agent Builder and Elastic Workflows compose bidirectionally: agents can trigger workflows via workflow tools, and workflows can invoke agents as reasoning steps via the `ai.agent` step ([Agent Builder + Workflows](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/agents-and-workflows)). The `ai.agent` step treats the agent as a reasoning engine that summarizes data, classifies events, or makes decisions before passing results to the next automation step.

A concrete example — query Elasticsearch for delayed flights, summarize with an agent, print the result:

```yaml
version: "1"
name: analyze_flight_delays
triggers:
  - type: manual
steps:
  - name: get_delayed_flights
    type: elasticsearch.search
    with:
      index: "kibana_sample_data_flights"
      query:
        range:
          FlightDelayMin:
            gt: 60
      size: 5

  - name: summarize_delays
    type: ai.agent
    with:
      agent_id: "elastic-ai-agent"
      message: |
        Review the following flight delay records and summarize which airlines
        are most affected and the average delay time:
        {{ steps.get_delayed_flights.output }}

  - name: print_summary
    type: console
    with:
      message: "{{ steps.summarize_delays.output }}"
```

The `{{ steps.get_delayed_flights.output }}` template variable injects the raw Elasticsearch response directly into the agent prompt. No custom API code. The Elastic Workflows GitHub repo (`elastic/workflows`) contains 50+ examples using this pattern — incident summarization, anomaly classification, alert triage.

For the broader patterns behind multi-step agentic systems, see [Agentic AI Workflows](/blog/agentic-ai-workflows). For how Elasticsearch fits into AI search architectures, see [Search and AI](/blog/search-and-ai).

---

## Hybrid Search — Combining BM25 and Vectors

Hybrid search consistently outperforms pure BM25 or pure vector search on mixed query types, particularly where domain terminology, model numbers, or proper nouns matter — Elastic's own benchmarks ([Elastic hybrid search benchmarks](https://www.elastic.co/search-labs/blog/hybrid-search-elastic-relevance), 2024) and independent BEIR evaluations both show this pattern. The `rrf` retriever applies reciprocal rank fusion — ranking by position across both result sets, not by normalizing raw scores, which makes it robust to mismatched score distributions.

```json
GET /knowledge-base/_search
{
  "retriever": {
    "rrf": {
      "retrievers": [
        {
          "standard": {
            "query": { "match": { "content": "kubernetes autoscaling" } }
          }
        },
        {
          "standard": {
            "query": { "semantic": { "field": "content_semantic", "query": "kubernetes autoscaling" } }
          }
        }
      ],
      "rank_window_size": 50,
      "rank_constant": 20
    }
  }
}
```

For RAG pipelines, pair hybrid retrieval with the `jina-reranker-v3` endpoint as a second-stage pass: retrieve 30-50 candidates via RRF, rerank to the top 5-10, then inject only those into the LLM context. The reranker adds precision without expanding the LLM's context window unnecessarily.

### When Should You Use Hybrid Search Over Pure Semantic?

Use hybrid when queries contain exact-match terms — model numbers, product codes, proper nouns — where pure semantic search can miss obvious hits. Use pure semantic when queries are natural language questions against prose content. Layer in reranking when precision at position 1-5 matters more than recall.

---

*For the foundational concepts on Elasticsearch indexing and data models, see [Getting Started with Elasticsearch](/blog/getting-started-elasticsearch).*

---

**About the author:** Ade A. is an Enterprise Solutions Architect, focused on AI-powered search, large-scale observability, and security architectures. [More posts by Ade A.](/blog)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["BlogPosting", "TechArticle"],
  "headline": "Elasticsearch AI: Vector Search, RAG, and Agent Builder",
  "description": "ELSER v2 beats BM25 by 18% NDCG@10. Inference endpoints, Jina models, GPU indexing, and Agent Builder make Elasticsearch a full production AI platform.",
  "wordCount": 2545,
  "url": "https://aade.me/blog/elasticsearch-ai-platform",
  "datePublished": "2026-02-14",
  "dateModified": "2026-02-14",
  "image": "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80",
  "author": {
    "@type": "Person",
    "name": "Ade A.",
    "url": "https://aade.me"
  },
  "publisher": {
    "@type": "Organization",
    "name": "aade.me",
    "url": "https://aade.me"
  },
  "keywords": "Elasticsearch, AI/ML, Vector Search, Platform Engineering, Agentic AI, ELSER, Jina, GPU vector indexing",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://aade.me/blog/elasticsearch-ai-platform"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Blog",
      "item": "https://aade.me/blog"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Elasticsearch AI: Vector Search, RAG, and Agent Builder",
      "item": "https://aade.me/blog/elasticsearch-ai-platform"
    }
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Ade A.",
  "url": "https://aade.me",
  "jobTitle": "Platform and Cloud Engineer",
  "knowsAbout": ["Elasticsearch", "Platform Engineering", "Distributed Systems", "Cloud Infrastructure", "AI/ML Platforms"]
}
</script>
