---
slug: "elasticsearch-whats-new-2025-2026"
title: "What's New with Elasticsearch: Key Updates"
excerpt: "Elasticsearch 9.1–9.3 cut vector memory 95%, landed DiskBBQ sub-20ms search, made ES|QL production-ready, and acquired Jina AI. Here's what changed operationally."
date: "2026-03-19"
tags: ["Elasticsearch", "Elastic Stack", "Vector Search", "Observability", "Platform Engineering"]
author: "Ade A."
imageUrl: "/blog/elasticsearch-whats-new-2025-2026/hero.webp"
imageAlt: "Elasticsearch 9.x key updates: elastic wordmark with HNSW vector graph, server stack, and stat cards showing 95% memory reduction, 12x indexing throughput, sub-20ms search, and ES|QL GA"
---

# What's New with Elasticsearch: Key Updates

Three releases in six months have changed the cost and capability profile of Elasticsearch. Versions 9.1 through 9.3 shipped BBQ quantization as the default, brought ES|QL to full production readiness, built out a native inference layer from an acquisition, and introduced agentic automation directly in Kibana. Each of those four threads is concrete — not directional. This post covers what actually landed and what it means for teams operating these workloads.

> **Key Takeaways**
> - BBQ vector quantization is now the default for new `dense_vector` indices, cutting memory by over 95% versus float32 ([Elastic 9.1](https://www.elastic.co/blog/whats-new-elastic-9-1-0)).
> - DiskBBQ (GA in 9.2) reads vectors from disk at sub-20ms latency with a 100 MB memory footprint regardless of index size ([Elastic 9.2](https://www.elastic.co/blog/whats-new-elastic-9-2-0)).
> - Elastic acquired Jina AI in October 2025. Three multilingual models are now GA through Elastic Inference Service — no external API key or ML node required ([Jina acquisition](https://www.businesswire.com/news/home/20251009619654/en/Elastic-Completes-Acquisition-of-Jina-AI-a-Leader-in-Frontier-Models-for-Multimodal-and-Multilingual-Search)).
> - Managed OTLP Endpoint (GA) accepts standard OTLP directly — no collector, no schema translation ([Managed OTLP](https://www.businesswire.com/news/home/20251020492942/en/Elastic-Announces-Managed-OTLP-Endpoint-for-Easier-Scalable-OpenTelemetry)).
> - Agent Builder and Elastic Workflows are both in 9.3, making Kibana a functional agentic platform with YAML-defined automation ([Elastic 9.3](https://www.elastic.co/blog/whats-new-elastic-9-3-0)).

---

## Elasticsearch Vector Search: 95% Lower Memory, DiskBBQ GA

The RAM cost of running large vector indexes has dropped. BBQ quantization became the default in 9.1 for new `dense_vector` indices, cutting heap requirements by more than 95% over float32 ([Elastic 9.1](https://www.elastic.co/blog/whats-new-elastic-9-1-0)). That translates directly to smaller data nodes and lower cluster cost. Teams that ruled out dense vector workloads due to memory provisioning now have different numbers to work with.

<!-- [UNIQUE INSIGHT] -->
The default change is more consequential than the changelog implies. Previously, opting into quantization required explicit configuration and a documented precision tradeoff. Now new indices are efficient by default — but any cluster templates or provisioning playbooks written before 9.1 that assume float32 are now wrong. If you're building on existing automation, check your index settings explicitly before scaling out.

For inference endpoint setup and embedding model selection, see [Elasticsearch as an AI Platform](/blog/elasticsearch-ai-platform).

### ACORN Filtered Search

ACORN, GA in 9.1, fixes a specific retrieval problem. Filtered kNN queries used to fall back to brute-force scans under highly selective filters. ACORN integrates filtering directly into HNSW graph traversal, delivering up to 5x faster filtered vector search — including against OpenSearch's equivalent ([Elastic 9.1](https://www.elastic.co/blog/whats-new-elastic-9-1-0)). Workloads with tenant isolation, date-range filters, or category constraints see the biggest gains.

### DiskBBQ — Sub-20ms at 100 MB Memory

DiskBBQ reached GA in 9.2. It reads quantized vectors from disk rather than holding them in heap. The result: sub-20ms search latency with a total memory footprint of 100 MB, regardless of how large the index is ([Elastic 9.2](https://www.elastic.co/blog/whats-new-elastic-9-2-0)). The target workload is hundreds of millions of vectors where cost-per-query matters more than absolute minimum latency. At that scale, RAM provisioning is no longer the capacity constraint.

### GPU Vector Indexing (Tech Preview, 9.3)

GPU-accelerated HNSW index construction landed in tech preview in 9.3, using NVIDIA cuVS. Elastic's benchmarks show 12x indexing throughput and 7x faster force-merges versus CPU builds ([GPU vector indexing](https://www.elastic.co/search-labs/blog/elasticsearch-gpu-accelerated-vector-indexing-nvidia)). Requirements are specific: NVIDIA Ampere architecture (compute capability ≥ 8.0), 8 GB minimum GPU memory, Linux x86_64, Enterprise license. One flag enables it:

```yaml
vectors.indexing.use_gpu: true
```

This is not production-ready. GA is on the roadmap. The use case is large-batch ingest where index build time is the bottleneck and you want CPU freed for live query traffic.

---

## Did ES|QL Finally Graduate?

Yes — the blockers are gone. LOOKUP JOIN and cross-cluster search both went GA in 9.1, removing the two features that most teams cited as blockers for production adoption ([Elastic 9.1](https://www.elastic.co/blog/whats-new-elastic-9-1-0)). LOOKUP JOIN enriches query results against reference indices at query time. Cross-cluster search lets a single ES|QL query span multiple clusters without moving data.

Performance followed in 9.2: filter pushdowns run up to 86x faster on certain query shapes, and time-series queries are 10x faster than prior releases ([Elastic 9.2](https://www.elastic.co/blog/whats-new-elastic-9-2-0)). Those are not incremental improvements.

<!-- [UNIQUE INSIGHT] -->
The real value of ES|QL is consolidation, not syntax. One language covering full-text search, log analytics, cross-cluster enrichment, and time-series aggregation means one tool for platform teams to standardise on. Teams currently maintaining Kibana lenses for dashboards, Query DSL for search APIs, and separate cross-cluster tooling can start converging on ES|QL for new work. That shrinks the operational knowledge surface for anyone running Elasticsearch at scale.

A LOOKUP JOIN example — enriching log events with a metadata reference index at query time:

```esql
FROM logs-*
| WHERE @timestamp > NOW() - 1h
| LOOKUP JOIN service-registry ON service.name
| STATS error_rate = COUNT(*) BY service.name, service.owner
| SORT error_rate DESC
| LIMIT 20
```

This query previously required an application-side join or a denormalised index. With LOOKUP JOIN GA, enrichment happens inline.

ES|QL's role in production monitoring is covered in [Elasticsearch Stack Monitoring, A Production Guide](/blog/elasticsearch-stack-monitoring).

---

## What Does the Jina AI Acquisition Mean for Your Stack?

Elastic acquired Jina AI in October 2025. Han Xiao, Jina's founder, moved over as VP of AI at Elastic ([Jina acquisition](https://www.businesswire.com/news/home/20251009619654/en/Elastic-Completes-Acquisition-of-Jina-AI-a-Leader-in-Frontier-Models-for-Multimodal-and-Multilingual-Search)). The practical effect is in 9.3: three Jina models are now GA through Elastic Inference Service (EIS), removing the need for an external JinaAI API key or self-hosted ML nodes ([EIS launch](https://www.businesswire.com/news/home/20251009383846/en/Elastic-Introduces-Native-Inference-Service-in-Elastic-Cloud)).

The three GA models via EIS in 9.3:

| Model | Type | Best For |
|---|---|---|
| `jina-embeddings-v3` | Dense embeddings | Multilingual retrieval, 89 languages |
| `jina-reranker-v2-base-multilingual` | Reranker | Cross-lingual reranking, up to 64 docs |
| `jina-reranker-v3` | Reranker | Listwise reranking, highest precision |

ELSER (English-only) workloads are unchanged. For multilingual or mixed-language corpora, the Jina models through EIS are now the path with the least operational overhead.

<!-- [UNIQUE INSIGHT] -->
The acquisition changes the dependency model, not just the model availability. Elastic now owns the roadmap for these embeddings — previously, EIS Jina support ran through a third-party partnership. Going forward, model updates, fine-tuned variants, and new multilingual releases can ship directly into EIS without external coordination. For teams standardising on Elastic's inference layer, that removes a category of external dependency risk.

Provision a Jina embedding endpoint via EIS:

```json
PUT _inference/text_embedding/jina-multilingual
{
  "service": "elastic",
  "service_settings": {
    "model_id": "jina-embeddings-v3"
  }
}
```

Self-managed clusters access EIS via Cloud Connect, which went GA in 9.3. No model hosting required on your side.

For hybrid search patterns and RAG setup, see [Elasticsearch as an AI Platform](/blog/elasticsearch-ai-platform).

---

## How Does the Elasticsearch Observability Story Change in 9.x?

Three additions define the shift: Streams GA, Managed OTLP Endpoint GA, and the `pattern_text` field type GA. Together they address log storage costs, collector sprawl, and parsing overhead — the three most common complaints from teams running large log workloads.

Streams reached GA in 9.2. It adds AI-driven log parsing with automatic field extraction in Kibana. A Significant Events surface highlights anomalies — OOM errors, server failures, startup and shutdown events. ILM configuration is handled automatically; you don't pre-engineer ingest pipelines per source ([Elastic 9.2](https://www.elastic.co/blog/whats-new-elastic-9-2-0)). That matters for teams ingesting ad-hoc log formats from tens of services.

The Managed OTLP Endpoint went GA in October 2025. Any OTel SDK or collector can point to it and ship data directly — no local Elastic collector tier, no schema translation, no format changes required ([Managed OTLP](https://www.businesswire.com/news/home/20251020492942/en/Elastic-Announces-Managed-OTLP-Endpoint-for-Easier-Scalable-OpenTelemetry)). It reduces the ingestion path from three hops to one.

The `pattern_text` field type, GA in 9.3, applies dictionary encoding to high-cardinality log text fields and cuts storage by roughly 50% ([Elastic 9.3](https://www.elastic.co/blog/whats-new-elastic-9-3-0)). For indexes where storage dominates the cost line, that's a number worth testing against your own data.

EDOT (Elastic Distributions of OpenTelemetry) is now stable across all language SDKs, with OpAMP-based centralised configuration handling remote SDK updates without redeployment. For a deep look at EDOT architecture and gateway patterns, see [Observability with EDOT](/blog/observability-with-elasticsearch-edot).

For a full breakdown of ingestion paths including OTLP, see [Getting Data into Elasticsearch](/blog/getting-data-into-elasticsearch).

---

## Agent Builder, Workflows, and the Agentic Platform Shift

Agent Builder reached GA in 9.3. It is a visual tool in Kibana for building AI agents that query Elasticsearch indices, call inference endpoints, and chain results into multi-step reasoning flows ([Elastic 9.3](https://www.elastic.co/blog/whats-new-elastic-9-3-0)). Elastic Workflows, also shipping in 9.3 as tech preview, provides YAML-based automation with manual, scheduled, or alert-triggered execution.

The two compose bidirectionally: workflows can invoke agents via the `ai.agent` step type, and agents can trigger workflows as tools. ElasticON London 2026 framed this explicitly as the platform's strategic direction — the future is agentic.

A minimal Workflow example using an `ai.agent` step:

```yaml
version: "1"
name: summarize_recent_errors
triggers:
  - type: scheduled
    interval: 1h
steps:
  - name: fetch_errors
    type: elasticsearch.search
    with:
      index: "logs-*"
      query:
        bool:
          filter:
            - range:
                "@timestamp":
                  gte: "now-1h"
            - match:
                log.level: "ERROR"
      size: 10

  - name: summarize
    type: ai.agent
    with:
      agent_id: "ops-summary-agent"
      message: |
        Summarize the following error logs. Identify patterns and the top 3
        most impactful error types:
        {{ steps.fetch_errors.output }}

  - name: notify
    type: console
    with:
      message: "{{ steps.summarize.output }}"
```

<!-- [PERSONAL EXPERIENCE] -->
The friction I've seen with teams evaluating Agent Builder is knowledge base setup. Specifically: `semantic_text` fields need to be configured and populated before the agent can query them usefully. The agent is only as good as the retrieval underneath it. Getting the embedding endpoint and field mappings right before touching the Agent Builder UI avoids a full rework cycle.

For Agent Builder deep-dive and RAG patterns, see [Elasticsearch as an AI Platform](/blog/elasticsearch-ai-platform).

---

## What's on the Elasticsearch Roadmap?

Five items are worth tracking:

### 1. GPU Vector Indexing → GA
Currently tech preview in 9.3. The benchmarks — 12x indexing throughput, 7x faster force-merges — make this worthwhile for large-batch ingest workloads. Don't rely on it in production until GA.

### 2. Elastic Workflows → GA
The YAML automation layer is functional but the API surface is not stable. Build production automation on it only after GA ships.

### 3. Stateless Elasticsearch
Compute and storage separation is on the roadmap, following the pattern already shipped in Serverless. Independent scaling of indexing and search compute would change capacity planning for variable-throughput workloads significantly.

### 4. Cross-Project Search
Each serverless project is currently isolated. Cross-project querying would enable multi-tenant architectures without consolidating data into a single project.

### 5. BYOK Encryption
Bring Your Own Key support for data at rest — relevant for regulated industries with key management requirements.

For cloud architecture patterns that complement these scaling capabilities, see [Architecting to Scale in the Cloud](/blog/architecturing-to-scale-cloud).

---

## Frequently Asked Questions About Elasticsearch 9.x

### Is Elasticsearch 8.x still supported?

8.19 is the final 8.x minor release, shipped in July 2025. Elastic extended the 8.x line with 8.19 for teams not ready to migrate yet. Security patches continue, but the feature roadmap moved to 9.x entirely. The capability gap between 8.19 and 9.3 is now wide — particularly for vector search workloads and ES|QL.

### What is DiskBBQ and why does it matter?

DiskBBQ reads quantized vectors from disk rather than holding them in heap. It delivers sub-20ms search latency with a 100 MB memory footprint, regardless of index size ([Elastic 9.2](https://www.elastic.co/blog/whats-new-elastic-9-2-0)). Teams indexing tens or hundreds of millions of vectors no longer need to provision RAM proportional to the corpus size. The tradeoff is slightly higher p99 latency versus in-memory HNSW — a straightforward call for cost-sensitive workloads where sub-100ms is acceptable.

### Do I need to change my OTel setup for the Managed OTLP Endpoint?

No. The endpoint accepts standard OTLP over gRPC and HTTP. Any existing OTel SDK, EDOT distribution, or collector points to it without modification — no schema translation, no format changes, no Elastic agent required ([Managed OTLP](https://www.businesswire.com/news/home/20251020492942/en/Elastic-Announces-Managed-OTLP-Endpoint-for-Easier-Scalable-OpenTelemetry)). For all ingestion methods including OTLP, see [Getting Data into Elasticsearch](/blog/getting-data-into-elasticsearch).

### What is Elastic Inference Service (EIS)?

EIS provides GPU-accelerated inference — ELSER, Jina AI models, and rerankers — hosted on Elastic's infrastructure and billed per token through your subscription ([EIS launch](https://www.businesswire.com/news/home/20251009383846/en/Elastic-Introduces-Native-Inference-Service-in-Elastic-Cloud)). Self-managed clusters reach it via Cloud Connect, GA in 9.3. For teams on Elastic Cloud without dedicated ML nodes, EIS removes model hosting from the equation entirely.

### Does BBQ becoming the default break existing indexes?

No. The BBQ default applies to new `dense_vector` indices created after upgrading to 9.1. Existing indices keep their current `index_options` untouched. To apply BBQ to an existing index, you reindex with updated mappings. See [Elasticsearch AI: Vector Search, RAG, and Agent Builder](/blog/elasticsearch-ai-platform) for index mapping details.

---

*Complete Elasticsearch 9.x release notes: [official Elastic release notes](https://www.elastic.co/docs/release-notes/elasticsearch).*

---

**About the author:** Ade A. is an Enterprise Solutions Architect, focused on AI-powered search, large-scale observability, and security architectures. [More posts by Ade A.](/blog)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["BlogPosting", "TechArticle"],
  "headline": "What's New with Elasticsearch: Key Updates",
  "description": "Elasticsearch 9.1–9.3 cut vector memory 95%, landed DiskBBQ sub-20ms search, made ES|QL production-ready, and acquired Jina AI. Here's what changed operationally.",
  "wordCount": 1700,
  "url": "https://aade.me/blog/elasticsearch-whats-new-2025-2026",
  "datePublished": "2026-03-21",
  "dateModified": "2026-03-21",
  "image": "/blog/elasticsearch-whats-new-2025-2026/hero.webp",
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
  "keywords": "Elasticsearch, Elastic Stack, Vector Search, Observability, Platform Engineering, BBQ quantization, DiskBBQ, ES|QL, Jina AI, Elastic Inference Service, GPU vector indexing",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://aade.me/blog/elasticsearch-whats-new-2025-2026"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Elasticsearch 8.x still supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "8.19 is the final 8.x minor release, shipped in July 2025. Security patches continue on 8.19 but the feature roadmap is 9.x only. The capability gap between 8.19 and 9.3 is now wide, particularly for vector search and ES|QL workloads."
      }
    },
    {
      "@type": "Question",
      "name": "What is DiskBBQ and why does it matter?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DiskBBQ reads quantized vectors from disk rather than holding them in heap, achieving sub-20ms search latency with a 100 MB memory footprint regardless of index size. Teams indexing hundreds of millions of vectors no longer need to provision RAM proportional to the corpus size."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to change my OTel setup for the Managed OTLP Endpoint?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. The Managed OTLP Endpoint accepts standard OTLP over gRPC and HTTP. Any existing OTel SDK, EDOT distribution, or collector points to it without modification. No schema translation, no format changes, no Elastic agent required."
      }
    },
    {
      "@type": "Question",
      "name": "What is Elastic Inference Service (EIS)?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "EIS provides GPU-accelerated inference — ELSER, Jina AI models, and rerankers — hosted on Elastic's infrastructure and billed per token through your subscription. Self-managed clusters access it via Cloud Connect, GA in 9.3."
      }
    },
    {
      "@type": "Question",
      "name": "Does BBQ becoming the default break existing indexes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. The BBQ default applies only to new dense_vector indices created after upgrading to 9.1. Existing indices keep their current index_options untouched. To apply BBQ to an existing index, reindex with updated mappings."
      }
    }
  ]
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
      "name": "What's New with Elasticsearch: Key Updates",
      "item": "https://aade.me/blog/elasticsearch-whats-new-2025-2026"
    }
  ]
}
</script>
