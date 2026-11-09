---
slug: "search-and-ai"
title: "Vector Databases and RAG: What Actually Works in 2026"
excerpt: "Vector databases are maturing fast, and RAG patterns are evolving to match. Here is a vendor-neutral look at what the landscape looks like and where the real performance differences lie."
date: "2026-01-08"
tags: ["AI/ML", "Search", "RAG", "Vector Databases"]
author: "Ade A."
imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop"
imageAlt: "AI-powered semantic search visualization"
---

Choosing a vector database in 2026 is less about the database and more about the retrieval pattern. Most purpose-built vector databases now converge on the same core capabilities; the differences that matter are in how they handle hybrid search, metadata filtering, and operational simplicity.

> **Key Takeaways**
> - Vector search is now a data type, not a database category. PostgreSQL (pgvector), MongoDB, and Redis all support it alongside traditional query patterns.
> - RAG evolved past simple retrieval. The current challenge is not whether retrieval works. It is making retrieved context precise enough for the LLM to produce correct answers.
> - Hybrid search combines sparse keyword and dense vector retrieval. In Elastic's BEIR benchmark, reciprocal rank fusion raised average NDCG@10 by 18% over BM25 alone ([Elastic Search Labs](https://www.elastic.co/search-labs/blog/improving-information-retrieval-elastic-stack-hybrid)).
> - Purpose-built vector databases (Pinecone, Weaviate, Milvus, Qdrant) generally expose more ANN tuning controls. General-purpose databases with vector extensions can reduce operational overhead for smaller workloads. Benchmark both against your own data.
> - If your stack already includes Elasticsearch, see [AI Search: An Elasticsearch Perspective](/blog/ai-search-elasticsearch-perspective) for a complete breakdown of layers 1 through 5.

---

## Has Vector Search Become Commodity Infrastructure?

For many workloads, yes. The shift happened between 2024 and 2025: vector search moved from a specialized capability requiring a purpose-built system to a data type supported by most major databases. PostgreSQL with pgvector, MongoDB Atlas Vector Search, Redis VSS, and Oracle 23ai all added vector indexing to existing query engines.

This matters for operations. Running a separate vector database alongside your primary data store means managing two systems, two scaling policies, and two schema migrations. For smaller workloads, the throughput penalty of a general-purpose database with vector support may be small enough that operational simplicity wins. Measure it on your own data and compare against [ann-benchmarks.com](https://ann-benchmarks.com).

<!-- [UNIQUE INSIGHT] -->
There is no hard size threshold at which a general-purpose database stops being adequate. ANN tuning becomes a real specialization as the index grows, because it needs control surfaces (segment configuration, quantization parameters, graph construction parallelism) that purpose-built systems tend to expose more fully. Test at your own scale and query concurrency.

---

## What Is the Difference Between Pinecone, Weaviate, Milvus, and Qdrant?

Each targets a distinct primary use case, even though they overlap on core functionality.

**Pinecone** is a managed service with serverless indexes, so there is no cluster to size or operate ([Pinecone docs](https://docs.pinecone.io/guides/index-data/indexing-overview)). Its bring-your-own-cloud option runs the data plane in your own AWS, GCP or Azure account, still operated by Pinecone ([BYOC docs](https://docs.pinecone.io/guides/production/bring-your-own-cloud)). Check the current docs for which index parameters you can tune.

**Weaviate** integrates with embedding and generative model providers. When an embedding integration is enabled, Weaviate generates embeddings for objects as they are added ([Weaviate docs](https://docs.weaviate.io/weaviate/model-providers)). That suits teams that want the embedding step and the retrieval step configured in one place.

**Milvus** (and its managed version, Zilliz Cloud) is open source and offers several index types, including IVF_FLAT, IVF_SQ8 and HNSW ([Milvus docs](https://milvus.io/docs/index.md)). It also supports DISKANN, a disk-based index designed for datasets that exceed available RAM ([Milvus DISKANN docs](https://milvus.io/docs/diskann.md)). More index choices mean more tuning work, so it fits teams with dedicated infrastructure engineers.

**Qdrant** supports filtered vector search through payload indexes. Its filterable HNSW approach adds graph edges based on indexed payload values, so filters can be applied while traversing the graph ([Qdrant course](https://qdrant.tech/course/essentials/day-2/filterable-hnsw/)). If metadata filtering dominates your query pattern alongside vector similarity, test this behavior on your own data.

None of these is universally best. The right choice is determined by your scale, operational team, and whether you need tight coupling between embedding generation and retrieval.

---

## Why Does Retrieval Quality Determine RAG Performance?

A RAG pipeline has two moving parts: retrieval and generation. Generation-side changes (larger model, longer context window, better prompt) cannot recover documents that retrieval never returned. Retrieval quality is the first thing to measure.

When retrieval precision is low (the top-k results contain irrelevant documents), the LLM either ignores the context and hallucinates, or includes it and produces a vague answer that hedges against the conflicting information. When retrieval recall is low, the LLM fills the gap. Neither failure is visible at the prompt level; both show up in answer quality.

**The hybrid retrieval pattern.** Combining sparse keyword search (BM25) with dense vector search via reciprocal rank fusion improved results in Elastic's BEIR benchmark: it raised average NDCG@10 by 1.4% over Elastic Learned Sparse Encoder alone and 18% over BM25 alone ([Elastic Search Labs](https://www.elastic.co/search-labs/blog/improving-information-retrieval-elastic-stack-hybrid)). That benchmark does not isolate domain-specific corpora, so test on your own. The intuition: keyword search handles exact term matching and rare tokens; vector search handles semantic paraphrases. A user asking about "connection timeout errors" and another asking "why does my API stop responding" are describing the same problem with different vocabulary. Hybrid retrieval closes that gap.

**Chunking strategy is underrated.** The granularity at which you chunk documents before embedding affects retrieval precision. Sentence-level chunks maximize precision but lose inter-sentence context. Paragraph-level chunks balance precision and context. Fixed-size chunks with overlap are fast to implement but break semantic units arbitrarily. For most knowledge base use cases, paragraph-level chunking with some overlap is a reasonable starting point. Tune it against your own evaluation set.

---

## Is RAG Sufficient, or Do You Need Agentic Retrieval?

RAG is sufficient when the user question can be answered from a static corpus and a single retrieval step. That covers most document Q&A, internal knowledge base search, and product documentation use cases.

Agentic retrieval adds value when:
- The answer requires live data (current system state, real-time metrics, open issue count)
- The question requires chaining retrieval steps based on intermediate results ("find the runbook for the top error in this week's incident report")
- The user expects the system to take an action, not just produce an answer

The cost of agentic retrieval is latency and complexity. Each reasoning step adds a round trip to the LLM, so a multi-step agent takes noticeably longer than a single-retrieval RAG pipeline. For most search use cases, RAG is the right stopping point.

---

## FAQ

### Is pgvector production-ready for serious vector workloads?

Often yes, for smaller workloads with moderate QPS, since pgvector supports HNSW indexing. At larger index sizes or high query concurrency, measure the gap to purpose-built systems on your own data. Check the ANN benchmarks at [ann-benchmarks.com](https://ann-benchmarks.com) for current throughput comparisons under your target precision.

### What is the difference between HNSW and IVF indexes?

HNSW (Hierarchical Navigable Small World) builds a layered graph that enables fast approximate nearest neighbor search with consistent latency. It works efficiently only when most vector data is held in memory ([Elastic docs](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/approximate-knn-search)). IVF (Inverted File Index) style indexes (IVF_FLAT, IVF_SQ8) group the vector space into clusters and search a subset of clusters per query. Elastic's cluster-based DiskBBQ is described as a disk-based alternative to HNSW with lower RAM requirements, though HNSW-based formats perform better at very high recall (99% or higher) ([Elastic docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/bbq)). For most use cases starting out, HNSW is the right default.

### Does fine-tuning embedding models improve RAG quality?

It depends on how domain-specific your corpus is. General-purpose embedding models (E5, BGE, ELSER) work well on common language patterns. For highly specialized domains (legal documents, clinical notes, proprietary code), fine-tuning on domain-representative data may improve recall, but the size of the gain depends on your data, so measure it on your own evaluation set. The cost is training infrastructure and an ongoing retraining pipeline when the corpus shifts. Improving chunking strategy and adding hybrid retrieval are usually cheaper to try first.

### How do I evaluate retrieval quality?

Run offline evaluation against a labeled dataset of (query, relevant document) pairs. Common metrics: Recall@k (did the correct document appear in the top k results), NDCG@k (did it appear near the top), and MRR (mean reciprocal rank of the first correct result). Tools like RAGAS and TruLens automate this for RAG pipelines. Without labeled data, start with LLM-as-judge on a sample of real queries. It is noisier but faster than manual annotation.

### What should I look for in a vector database SLA?

Uptime guarantee and query latency p95 under load. Purpose-built databases with managed tiers (Pinecone, Zilliz) publish p95 latency SLOs. Self-hosted deployments require you to measure and bound this yourself. Also check: index build time after bulk import (some systems block queries during reindexing), and whether metadata filtering degrades to brute-force scan under selective filters.

---

Vector databases and RAG are production infrastructure now. The architecture questions worth asking in 2026 are about retrieval pattern (hybrid vs pure vector), chunking strategy, and operational complexity, not about whether the technology works. For the full picture of how these patterns apply specifically inside Elasticsearch, including lexical, semantic, hybrid, RAG, and agentic layers in one stack, see [AI Search: An Elasticsearch Perspective](/blog/ai-search-elasticsearch-perspective).
