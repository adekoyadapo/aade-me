---
slug: "ai-search-elasticsearch-perspective"
title: "AI Search: An Elasticsearch Perspective"
excerpt: "Elasticsearch supports five distinct search layers, from BM25 to Agent Builder. Understanding when to use each layer is the difference between a search that works and one that scales."
date: "2026-09-14"
tags: ["Elasticsearch", "AI/ML", "Search", "Agent Builder", "RAG"]
author: "Ade A."
imageUrl: "/blog/ai-search-elasticsearch-perspective/hero.jpeg"
imageAlt: "Five layered planes connected by flowing data streams, representing the five layers of AI search in Elasticsearch"
---

Elasticsearch supports five distinct approaches to search, and most production clusters use at least two simultaneously. The choice between them is not a feature question. It is a failure-mode question: which retrieval failure is costing you most right now?

> **Key Takeaways**
> - BM25 (lexical) is the right default for exact-match queries and structured field retrieval. It needs no ML infrastructure.
> - `semantic_text` (GA since 9.0) makes semantic search a mapping concern, not a pipeline concern. ELSER V2 improves NDCG@10 by 18% over BM25 for English text ([Elastic Search Labs](https://www.elastic.co/search-labs/blog/elser-v2-sparse-encoder), September 2023).
> - Reciprocal Rank Fusion merges lexical and semantic rankings without score normalization. `rank_constant` defaults to 60; weighted RRF is GA in 9.2 ([Elastic docs](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion)).
> - RAG shifts the bottleneck to retrieval quality. A well-tuned hybrid retriever is worth more than a better LLM.
> - Agent Builder (GA in 9.4) wraps the reasoning loop, tool execution, and MCP server in a managed API. Execution is billed per tool call, not per token ([Elastic docs](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder)).

---

## Why Do Five Layers of Search Still Coexist?

Each layer adds capability and cost. The layers are not replacements but progressions: you add a layer when the previous one's failure mode becomes the primary complaint.

BM25 fails when users phrase queries differently from how documents are written. Semantic search closes that gap but loses exact-match precision on structured fields. Hybrid search merges both, but still produces static results from a fixed corpus. RAG generates answers but cannot act on them. Agent Builder acts, but costs significantly more per query than a single retrieval call.

The practical result: most real search systems run two or three layers simultaneously. The right layer for a given query shape depends on corpus type, latency budget, and whether the user needs an answer or an action.

---

## Layer 1: When Does Lexical Search Win?

BM25 is the right starting point for most corpora. It scores documents by term frequency (TF) and inverse document frequency (IDF), favoring rare terms that appear multiple times in a relevant document. No ML dependency. No inference endpoint. Handles structured queries precisely.

<!-- [UNIQUE INSIGHT] -->
The case for starting with BM25 is stronger than its reputation suggests. For structured fields (product SKUs, error codes, log identifiers), semantic search actively degrades precision. A query for `OOM-3421` should return that exact document, not semantically adjacent ones about memory pressure. Picking the wrong layer is often worse than picking no layer at all.

**Worked example.** Index: a software knowledge base with 50,000 troubleshooting articles. User query: "slow query performance elasticsearch".

```json
GET /kb/_search
{
  "query": {
    "match": {
      "body": {
        "query": "slow query performance elasticsearch",
        "operator": "or"
      }
    }
  },
  "_source": ["title", "category"],
  "size": 10
}
```

This works well when article titles and bodies contain those exact terms. It fails when a user asks "why are my searches taking forever": the vocabulary gap produces poor recall. That failure is the entry condition for Layer 2.

**The leading-wildcard trap.** BM25 supports wildcards, but leading wildcards (`*query`) force a full index scan. In Elasticsearch, `search.allow_expensive_queries` defaults to `true`, which means this runs without error and silently destroys query latency at scale. Set it to `false` in any cluster where users control the query string directly.

```yaml
# elasticsearch.yml
search.allow_expensive_queries: false
```

**When BM25 is enough.** Log search, document retrieval by identifier, filtering over structured fields, and autocomplete on indexed terms are all strong BM25 use cases. Adding semantic search to these workloads adds cost and latency with no measurable relevance gain.

---

## Layer 2: Does Semantic Search Replace BM25?

No. Semantic search closes the vocabulary gap. It does not eliminate the need for exact matching. The right framing: semantic search is the retrieval upgrade for free-text queries on natural language content, applied where vocabulary mismatch is the documented failure mode.

Since Elasticsearch 9.0, `semantic_text` is a GA field type. It automates the full embedding pipeline: model selection, chunking, inference at ingest time, and query-time inference. No separate embedding service required.

```json
PUT /kb
{
  "mappings": {
    "properties": {
      "title":         { "type": "text" },
      "body":          { "type": "text" },
      "body_semantic": {
        "type": "semantic_text",
        "inference_id": ".elser-2-elasticsearch"
      }
    }
  }
}
```

Ingest to both fields. `body_semantic` receives the same content as `body` and handles chunking internally:

```json
POST /kb/_doc
{
  "title": "Diagnosing Slow Queries in Elasticsearch",
  "body":  "Slow queries often stem from large shard counts, unoptimized mappings, or GC pressure caused by large field data caches...",
  "body_semantic": "Diagnosing Slow Queries in Elasticsearch. Slow queries often stem from large shard counts, unoptimized mappings, or GC pressure..."
}
```

Now the user query "why are my searches taking forever" retrieves the correct article even though none of those words appear in it:

```json
GET /kb/_search
{
  "query": {
    "semantic": {
      "field": "body_semantic",
      "query": "why are my searches taking forever"
    }
  }
}
```

**ELSER vs dense vectors.** ELSER (Elastic Learned Sparse EncodeR) V2 uses sparse token weights instead of fixed-length dense vectors. For English text, the numbers are significant. ELSER V2 improves NDCG@10 by 18% over BM25. Ingestion throughput is 90% higher than V1 ([Elastic docs](https://www.elastic.co/docs/explore-analyze/machine-learning/nlp/ml-nlp-elser)). Dense vectors (E5, multilingual-e5) are the better fit for multilingual corpora or when you need explicit cosine similarity control.

<!-- [UNIQUE INSIGHT] -->
Dense vectors require committing to a model at index time. A model change means a full reindex. ELSER's sparse representation does not carry this penalty: the weights are stored per token, so updating the underlying model affects new documents on ingestion without requiring a bulk reindex of existing data.

For detailed ingest patterns including bulk loading semantic fields at scale, see [Getting Data Into Elasticsearch](/blog/getting-data-into-elasticsearch).

---

## Layer 3: Does Hybrid Search Actually Help?

Yes, for most general-purpose text search. BM25 rewards term frequency; semantic search rewards meaning. A document that contains the exact query terms and is also semantically relevant should rank higher than one that satisfies only one criterion. Reciprocal Rank Fusion merges both ranked lists without requiring score normalization.

**How RRF works.** Each retriever returns a ranked list. RRF scores each document as `sum(1 / (rank_constant + rank_i))` across retrievers. The default `rank_constant` is 60. A document ranked first in both lists scores `2 / 61 ≈ 0.033`. A document ranked 50th in one list and absent from the other scores `1 / 110 ≈ 0.009`. Documents that appear in neither list score zero.

```json
GET /kb/_search
{
  "retriever": {
    "rrf": {
      "retrievers": [
        {
          "standard": {
            "query": {
              "match": {
                "body": "slow query performance elasticsearch"
              }
            }
          }
        },
        {
          "standard": {
            "query": {
              "semantic": {
                "field": "body_semantic",
                "query": "why are my searches taking forever"
              }
            }
          }
        }
      ],
      "rank_constant": 60,
      "rank_window_size": 50
    }
  },
  "_source": ["title", "category"]
}
```

**Weighted RRF (GA in 9.2).** When BM25 results are stronger for this corpus, boost them:

```json
"rrf": {
  "retrievers": [
    {
      "standard": { "query": { "match": { "body": "slow query performance" } } },
      "weight": 1.5
    },
    {
      "standard": { "query": { "semantic": { "field": "body_semantic", "query": "why are my searches taking forever" } } },
      "weight": 1.0
    }
  ],
  "rank_constant": 60
}
```

**ES|QL DECAY for recency (preview in 9.3).** For time-sensitive corpora (incident reports, release notes, changelog entries), combine hybrid retrieval with a decay function that down-ranks older documents:

```sql
FROM kb
| WHERE body_semantic MATCH "slow query performance"
| EVAL recency_score = 1 / (1 + DATE_DIFF("day", @timestamp, NOW()) * 0.01)
| SORT _score * recency_score DESC
| LIMIT 10
```

For more on retrieval patterns and hybrid search architecture, see [Search and AI](/blog/search-and-ai) and [Elasticsearch AI Platform](/blog/elasticsearch-ai-platform).

---

<svg xmlns="http://www.w3.org/2000/svg" width="700" height="270" viewBox="0 0 700 270" role="img" aria-label="Bar chart showing relative relevance improvement over BM25 baseline across Elasticsearch search layers">
  <title>Relative Relevance Improvement Over BM25 Baseline</title>
  <rect width="700" height="270" fill="#1e293b" rx="8"/>
  <text x="350" y="28" text-anchor="middle" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Relative Relevance Improvement Over BM25 Baseline</text>
  <line x1="160" y1="45" x2="160" y2="220" stroke="#475569" stroke-width="1"/>
  <line x1="160" y1="220" x2="660" y2="220" stroke="#475569" stroke-width="1"/>
  <text x="155" y="223" text-anchor="end" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">0%</text>
  <text x="155" y="178" text-anchor="end" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">25%</text>
  <text x="155" y="133" text-anchor="end" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">50%</text>
  <text x="155" y="88" text-anchor="end" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">75%</text>
  <line x1="158" y1="178" x2="662" y2="178" stroke="#334155" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="158" y1="133" x2="662" y2="133" stroke="#334155" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="158" y1="88" x2="662" y2="88" stroke="#334155" stroke-width="1" stroke-dasharray="4 4"/>
  <rect x="180" y="220" width="70" height="0" fill="#475569" rx="3"/>
  <text x="215" y="236" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">BM25</text>
  <text x="215" y="218" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10">baseline</text>
  <rect x="280" y="190" width="70" height="30" fill="#0077CC" rx="3"/>
  <text x="315" y="236" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Semantic</text>
  <text x="315" y="186" text-anchor="middle" fill="#60a5fa" font-family="system-ui, sans-serif" font-size="11">+18%</text>
  <rect x="380" y="174" width="70" height="46" fill="#00BFB3" rx="3"/>
  <text x="415" y="236" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Hybrid</text>
  <text x="415" y="170" text-anchor="middle" fill="#00BFB3" font-family="system-ui, sans-serif" font-size="11">+28%</text>
  <rect x="480" y="146" width="70" height="74" fill="#F9A825" rx="3"/>
  <text x="515" y="236" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">RAG</text>
  <text x="515" y="142" text-anchor="middle" fill="#F9A825" font-family="system-ui, sans-serif" font-size="11">+45%</text>
  <rect x="580" y="113" width="70" height="107" fill="#7C3AED" rx="3"/>
  <text x="615" y="236" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Agentic</text>
  <text x="615" y="109" text-anchor="middle" fill="#a78bfa" font-family="system-ui, sans-serif" font-size="11">+65%</text>
  <text x="350" y="258" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">*Semantic +18% sourced from Elastic ELSER V2 docs. All other values illustrative. Source: elastic.co/docs/explore-analyze/machine-learning/nlp/ml-nlp-elser</text>
</svg>

---

## Layer 4: Where Does RAG Break Down?

A better LLM does not fix bad retrieval. That is the failure mode that shows up in every production RAG deployment. RAG chains a retriever with a generative model: the retriever fetches context, the LLM synthesizes an answer. The retriever is the variable that determines output quality.

<!-- [PERSONAL EXPERIENCE] -->
When retrieval recall is low, the LLM fills the gap with hallucinations. When retrieval precision is low, the LLM uses irrelevant context and produces vague answers. The retriever is the variable that matters. Swapping GPT-4 for a newer model on a poor retrieval pipeline rarely moves quality metrics; tuning the hybrid retriever usually does.

**The retrieval bottleneck in practice.** Hybrid retrieval (Layer 3) is the right retriever for most RAG pipelines. Using pure semantic retrieval on a technical corpus trades the vocabulary-gap problem for an exact-match problem. When users quote error codes, log prefixes, or API names, hybrid retrieval maintains precision while extending recall to natural language paraphrases.

**What RAG cannot do.** RAG produces an answer from a static corpus at query time. It cannot:
- Check live system state (current CPU usage, open incident count, active alert status)
- Trigger downstream actions (create a ticket, invoke a REST endpoint, restart a service)
- Chain multiple retrieval steps based on intermediate results

When a user asks "what caused the slow queries last Tuesday and has it been resolved?" a RAG pipeline returns context from documentation. It cannot query the metrics index for last Tuesday's data and compare it to current state. That capability starts at Layer 5.

See [Elasticsearch AI Platform](/blog/elasticsearch-ai-platform) for inference endpoint configuration patterns that power retrieval in production RAG pipelines.

---

## Layer 5: What Does Agent Builder Actually Do?

Agent Builder wraps the agentic reasoning loop as a managed Elasticsearch capability: the LLM decides which tool to call, calls it, reads the result, and decides what to do next. This loop continues until the agent produces a final answer or hits a configured step limit.

**The reasoning loop.** Each step:
1. LLM receives conversation history plus available tool definitions
2. LLM emits a tool call, or a final answer if it has enough information
3. Elasticsearch executes the tool and appends the result to history
4. Loop repeats from step 1

The LLM does not execute queries directly. It returns structured tool-call objects. Elasticsearch runs the actual query, controls scope and permissions, and hands the result back.

**Four tool types ([Elastic docs](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/tools)):**

| Tool | What it does |
|------|-------------|
| Index Search | Semantic or hybrid search over a configured index |
| ES\|QL | Parameterized query with `?param` substitution |
| MCP Server | Connect to any MCP-compatible external system |
| Workflow | Trigger an Elastic workflow and wait for the result |

**Worked example: the agentic path.** The same user question, "why are my searches slow?", hits an Agent Builder agent configured with two tools: an Index Search tool on the knowledge base and an ES|QL tool querying a metrics index.

The agent emits a structured tool-call object (the LLM's output, not an API you write):

```json
{
  "tool": "index_search",
  "input": { "query": "slow query performance troubleshooting" }
}
```

It reads the top articles. One recommends checking shard count and heap pressure. The agent then calls the metrics tool:

```sql
FROM metrics-elasticsearch
| WHERE @timestamp > NOW() - 1h
| STATS avg_query_ms = AVG(query.latency_ms),
        heap_pct     = AVG(jvm.heap_used_percent)
```

With both pieces of context, the agent generates: "Your queries have averaged 820ms over the past hour. JVM heap usage is at 87%. This pattern typically indicates field data cache pressure causing extended GC pauses. The recommended action is to set `indices.fielddata.cache.size: 40%` in your cluster settings and monitor GC pause duration using the Stack Monitoring view."

That answer required two round trips, zero human intervention, and combined static knowledge with live operational state.

**The `_meta.description` field.** Each Index Search tool has a `_meta.description` field that the LLM reads to decide whether to call this tool. Write it precisely: "Search the software knowledge base for troubleshooting articles. Use when the user reports errors, slow performance, or configuration problems." A vague description causes the agent to misroute queries to the wrong tool.

**MCP and A2A.** Agent Builder exposes an MCP server endpoint so external tools can query Elasticsearch agents directly. The Agent-to-Agent (A2A) protocol allows one Agent Builder agent to delegate a subtask to a specialized agent, collect the result, and continue reasoning. Both are GA in 9.4.

**The honest cost story.** Execution-based billing: each tool call counts as one execution unit, regardless of how many tokens the LLM used internally to decide on it. Four steps. Four executions. For high-volume workloads, that cost adds up fast. Route queries that need live state or multi-step reasoning to Agent Builder. Route everything else to Layer 1 or Layer 3.

For context on how Agent Builder fits into the broader Elasticsearch scale story, see [Elasticsearch at Scale](/blog/elasticsearch-at-scale).

---

## How Do You Choose a Search Layer?

The query shape drives the layer decision.

| Query shape | Primary failure mode of simpler layers | Recommended layer |
|-------------|----------------------------------------|-------------------|
| Exact terms, structured fields (SKU, ID, error code) | N/A. BM25 is precise here | Layer 1: BM25 |
| Natural language, vocabulary gap between query and document | Recall failure | Layer 2: Semantic |
| Mixed: keyword precision and NL recall both required | Either/or failure depending on query | Layer 3: Hybrid/RRF |
| User needs a synthesized answer, not a ranked list | Cannot generate | Layer 4: RAG |
| Answer requires live state or multi-step reasoning | Static corpus | Layer 5: Agent Builder |

One rule holds across all cases: start at the lowest layer that satisfies the use case. Each step up adds latency and operational surface area. Layer 5 with full agentic reasoning will not outperform a well-tuned hybrid retriever when the user needs a ranked list of documents. Adding layers for their own sake is an infrastructure cost, not a relevance improvement.

---

## What Does This Cost?

Latency and operational complexity increase at each layer. The chart below shows relative p95 query latency from a representative configuration. Absolute numbers depend on corpus size, hardware tier, and tool count.

<svg xmlns="http://www.w3.org/2000/svg" width="700" height="290" viewBox="0 0 700 290" role="img" aria-label="Bar chart showing relative p95 query latency by Elasticsearch search layer">
  <title>Relative p95 Query Latency by Search Layer</title>
  <rect width="700" height="290" fill="#1e293b" rx="8"/>
  <text x="350" y="28" text-anchor="middle" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Relative p95 Query Latency by Search Layer</text>
  <line x1="160" y1="45" x2="160" y2="240" stroke="#475569" stroke-width="1"/>
  <line x1="160" y1="240" x2="660" y2="240" stroke="#475569" stroke-width="1"/>
  <text x="155" y="243" text-anchor="end" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">1×</text>
  <text x="155" y="191" text-anchor="end" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">5×</text>
  <text x="155" y="139" text-anchor="end" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">10×</text>
  <text x="155" y="87" text-anchor="end" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">15×</text>
  <line x1="158" y1="191" x2="662" y2="191" stroke="#334155" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="158" y1="139" x2="662" y2="139" stroke="#334155" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="158" y1="87" x2="662" y2="87" stroke="#334155" stroke-width="1" stroke-dasharray="4 4"/>
  <rect x="180" y="230" width="70" height="10" fill="#475569" rx="3"/>
  <text x="215" y="255" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">BM25</text>
  <text x="215" y="226" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10">~1×</text>
  <rect x="280" y="210" width="70" height="30" fill="#0077CC" rx="3"/>
  <text x="315" y="255" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Semantic</text>
  <text x="315" y="206" text-anchor="middle" fill="#60a5fa" font-family="system-ui, sans-serif" font-size="10">~3×</text>
  <rect x="380" y="200" width="70" height="40" fill="#00BFB3" rx="3"/>
  <text x="415" y="255" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Hybrid</text>
  <text x="415" y="196" text-anchor="middle" fill="#00BFB3" font-family="system-ui, sans-serif" font-size="10">~4×</text>
  <rect x="480" y="160" width="70" height="80" fill="#F9A825" rx="3"/>
  <text x="515" y="255" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">RAG</text>
  <text x="515" y="156" text-anchor="middle" fill="#F9A825" font-family="system-ui, sans-serif" font-size="10">~8×</text>
  <rect x="580" y="87" width="70" height="153" fill="#7C3AED" rx="3"/>
  <text x="615" y="255" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Agentic</text>
  <text x="615" y="83" text-anchor="middle" fill="#a78bfa" font-family="system-ui, sans-serif" font-size="10">~15×+ per step</text>
  <text x="350" y="278" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">*All multipliers illustrative. Agentic latency scales with step count. Absolute values depend on hardware and corpus size.</text>
</svg>

Latency for Agent Builder is per-step, not per-query. A two-step agent costs roughly twice the retrieval latency of Layer 3. A ten-step agent costs ten times. Set `max_steps` in the Agent Builder configuration to bound worst-case latency. For most troubleshooting and support use cases, a limit of four to six steps covers the useful range without exposing the tail.

---

## FAQ

### What Elasticsearch version do I need for `semantic_text`?

`semantic_text` is GA from Elasticsearch 9.0. You also need a running ELSER or multilingual-e5 inference endpoint. On Elastic Cloud, the `.elser-2-elasticsearch` endpoint is available by default on subscriptions that include ML nodes. Self-managed clusters need an ML node with sufficient memory to load the model.

### Is ELSER better than dense vector search for English text?

For general English text retrieval, yes. ELSER V2 improves NDCG@10 by 18% over BM25 and handles out-of-vocabulary terms better than dense models trained on fixed vocabularies. For multilingual content or tasks requiring explicit cosine similarity thresholds, dense models (multilingual-e5-small, E5-large) are a stronger fit. The key practical difference: ELSER is a sparse model, so storage scales with vocabulary width, not vector dimension.

### When should I use RRF versus a learned ranker?

RRF is the right default. It requires no training data and no score normalization. A learned ranker (via `text_similarity_reranker` or the Learning to Rank plugin) is worth adding when you have labeled click data or explicit relevance judgements and need to optimize for a specific query distribution. Without labeled data, a learned ranker adds operational complexity without a measurable gain over a well-tuned RRF configuration.

### Does Agent Builder replace the Elasticsearch Relevance Engine (ESRE)?

No. ESRE is the collective name for the retrieval and ranking capabilities built into Elasticsearch: ELSER, vector search, RRF, and reranking. Agent Builder is the orchestration layer on top. A typical Agent Builder agent uses ESRE capabilities via the Index Search tool as its retrieval mechanism. The two are complementary.

### What is the `_meta.description` field in Index Search tools?

It is the natural-language description the LLM reads when deciding whether to call a given tool. Write it precisely: "Search the software knowledge base for troubleshooting articles. Use when the user reports errors, slow performance, or configuration problems." A vague description causes the agent to misroute queries. Treat it as the tool's routing contract, not its documentation.

### How is Agent Builder billed in Elastic Cloud?

Agent Builder uses execution-based billing. Each tool call (index search, ES|QL query, MCP call, workflow trigger) counts as one execution. LLM inference inside the reasoning loop is billed separately as an AI inference call. Check current tier entitlements in the Elastic Cloud console. For high-volume workloads, model the expected step count per query before enabling Agent Builder at scale ([Elastic docs](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder)).

---

The complete reference for each layer lives in the Elastic documentation: [Search](https://www.elastic.co/docs/solutions/search), [Hybrid and semantic search](https://www.elastic.co/docs/solutions/search/hybrid-semantic-text), and [Agent Builder](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder). The practical path: deploy Layer 1, measure recall and precision, add `semantic_text` at Layer 2 when vocabulary gap is the documented failure, and layer up from there. Save Layer 5 for the queries that genuinely require live state or multi-step reasoning. That set is smaller than it looks when you first read the Agent Builder docs.
