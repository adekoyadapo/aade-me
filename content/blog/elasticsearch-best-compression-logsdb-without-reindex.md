---
slug: "elasticsearch-best-compression-logsdb-without-reindex"
title: "best_compression on Existing Elasticsearch Data"
excerpt: "Set best_compression in the template for new data, then let an ILM warm-phase forcemerge convert existing indices. Docs cite up to about 28% savings on logs."
date: "2026-11-04"
readTime: "8 min read"
tags: ["Elasticsearch", "ILM", "Storage", "logsdb"]
author: "Ade A."
imageUrl: "/blog/elasticsearch-best-compression-logsdb-without-reindex/hero.webp"
imageAlt: "Sketch of LZ4 segment stack beside a shorter best_compression stack, joined by an index.codec arrow"
---

You can get `best_compression` on existing Elasticsearch data without a reindex. Two changes cover most setups. A template change handles new data at the next rollover. An ILM warm-phase `forcemerge` with `index_codec: best_compression` converts the indices you already have. The template alone never touches old data, and rollover alone converts nothing.

**`best_compression`** is an `index.codec` value that compresses stored fields with ZSTD instead of the default LZ4. The saving depends on your data. The docs cite up to about 28% on logs. In Rally `elastic/logs` runs on Elasticsearch 9.5.6, a codec change plus a full merge made indices about 42% smaller than a merge alone.

> **Key Takeaways**
> - A template change applies to backing indices created after it, so the new codec starts at the next rollover. Existing indices keep their codec until a merge rewrites them ([General index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules); [Logs data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams/logs-data-stream) for the rollover rule).
> - A new codec applies to segments merged after the change, and a force merge can drive that conversion ([General index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules)).
> - The ILM `forcemerge` action accepts `index_codec: best_compression`. ILM closes and reopens the index first, so it is unavailable while closed ([ILM force merge](https://www.elastic.co/docs/reference/elasticsearch/index-lifecycle-actions/ilm-forcemerge)).
> - Existing indices reach that action by one of three routes, depending on where they sit in ILM today (explained below).
> - In Rally `elastic/logs` runs, a codec change plus a full merge made two indices about 42% smaller than a merge alone, against the docs' figure of up to about 28%.
> - `index.mode` is a static setting ([General index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules)). Moving to logsdb means template plus rollover, or a reindex for standalone indices.

> **TL;DR:** Put the codec in your templates. Add `index_codec` to the warm-phase `forcemerge` in your ILM policy. Indices still waiting for warm pick it up on their own. Move older ones back to the start of warm, or attach a warm-only policy to indices outside ILM.

---

## Does a best_compression Template Change Old Data?

The template covers new data. ILM covers old data. A template applies only when an index is created, and changes do not affect existing indices ([Create or update an index template](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-put-index-template)). For a data stream, that means the new codec starts at the next rollover ([Logs data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams/logs-data-stream)).

![Six LZ4 indices stay unchanged after a template change and rollover, then an ILM force merge converts them](/blog/elasticsearch-best-compression-logsdb-without-reindex/template-vs-ilm.svg)

Update the template first. Create the ILM policy from the next section before the template references it. The PUT replaces the whole template, so read the current one and keep its other settings and mappings.

```bash
ES=http://localhost:9200

curl -s -X PUT "$ES/_index_template/app-logs" \
  -H 'Content-Type: application/json' \
  -d '{
    "index_patterns": ["app-logs-*"],
    "data_stream": {},
    "priority": 300,
    "template": {
      "settings": {
        "index.codec": "best_compression",
        "index.lifecycle.name": "app-logs-policy"
      }
    }
  }'

curl -s -X POST "$ES/app-logs-prod/_rollover"
```

The rollover call assumes the data stream `app-logs-prod` already exists. After it, the new backing index uses `best_compression`. The older backing indices, including the one rolled over just before the change, keep the default LZ4 codec until a merge rewrites them ([General index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules)). See [storage optimization for the Elastic Stack](/blog/elasticsearch-stack-storage-optimization) for other savings in the same area.

## How Does ILM Convert Indices You Already Have?

ILM converts existing indices through the warm-phase `forcemerge` action with `index_codec: best_compression`. With that option, ILM closes the index, reopens it, and then force merges it to `max_num_segments`. The index is unavailable for reads and writes while it is closed ([ILM force merge](https://www.elastic.co/docs/reference/elasticsearch/index-lifecycle-actions/ilm-forcemerge)). The new codec applies to segments as they are merged ([General index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules)).

![ILM forcemerge steps: close the index, set best_compression, reopen, then merge three LZ4 segments into one](/blog/elasticsearch-best-compression-logsdb-without-reindex/ilm-forcemerge-steps.svg)

Here is a complete policy. The hot phase rolls over. The warm phase converts and merges.

```bash
curl -s -X PUT "$ES/_ilm/policy/app-logs-policy" \
  -H 'Content-Type: application/json' \
  -d '{
    "policy": {
      "phases": {
        "hot": {"actions": {"rollover": {"max_primary_shard_size": "50gb", "max_age": "1d"}}},
        "warm": {
          "min_age": "2d",
          "actions": {"forcemerge": {"max_num_segments": 1, "index_codec": "best_compression"}}
        }
      }
    }
  }'
```

An index is unavailable for reads and writes while ILM has it closed, so the action belongs on indices that no longer take writes. The ILM docs warn that too many force merges at once can hurt the cluster, for example when many existing indices reach their `min_age` together. Stagger it with a longer `min_age` or `index.lifecycle.origination_date` ([ILM force merge](https://www.elastic.co/docs/reference/elasticsearch/index-lifecycle-actions/ilm-forcemerge)).

## Which Route Fits Indices Already in ILM?

Which route your existing indices take depends on where they are in ILM today.

### Route 1: indices still waiting for the warm phase

Indices still waiting in hot convert after the ILM policy gains `index_codec`. A policy change updates an index's cached phase definition only when it can be applied safely, and when an index advances to the next phase it uses the phase definition from the updated policy ([Update or switch an ILM policy](https://www.elastic.co/docs/manage-data/lifecycle/index-lifecycle-management/policy-updates)). An index still in hot therefore picks up the new warm phase when it moves to warm. On Elasticsearch 9.5.6, four small rolled-over indices did this with no other action. One shrank from 6.88 MB to 4.83 MB, with about 240 ms of failed reads during the close and reopen.

<!-- [UNIQUE INSIGHT] --> The docs say `min_age` changes do not reach indices already inside a phase. An index waiting in hot is not inside warm, so a shorter warm `min_age` still applied. Check `GET <index>/_ilm/explain` after the update to confirm the index moved.

### Route 2: indices that already left the warm phase

A policy update alone does not convert an index that already finished warm. Such an index keeps its old codec and stays at `warm/complete/complete`.

Move it back to the start of the warm phase with the [move API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-ilm-move-to-step). ILM then reads the updated phase definition and runs every step. Index names below are examples. `GET _data_stream/app-logs-prod` lists the real ones.

```bash
curl -s -X POST "$ES/_ilm/move/.ds-app-logs-prod-2026.11.01-000003" \
  -H 'Content-Type: application/json' \
  -d '{
    "current_step": {"phase": "warm", "action": "complete", "name": "complete"},
    "next_step": {"phase": "warm"}
  }'
```

<!-- [UNIQUE INSIGHT] --> Do not jump straight to the `forcemerge` step. With `"action": "forcemerge", "name": "forcemerge"` as the target, the merge runs but the codec stays on the default, most likely because the jump skips the close, update-settings and open steps that come before it. On a small test index the saving was about 4% instead of about 27%. Always target the phase, not the step.

### Route 3: indices outside ILM

Attach a warm-only policy to chosen indices. The docs say not to apply a policy that contains a rollover action by hand, because it is not carried forward to new indices ([Apply an ILM policy to an existing index](https://www.elastic.co/docs/manage-data/lifecycle/index-lifecycle-management/policy-apply)). A policy with no hot rollover avoids that.

```bash
curl -s -X PUT "$ES/_ilm/policy/warm-best-compression-only" \
  -H 'Content-Type: application/json' \
  -d '{
    "policy": {
      "phases": {
        "warm": {
          "min_age": "0ms",
          "actions": {"forcemerge": {"max_num_segments": 1, "index_codec": "best_compression"}}
        }
      }
    }
  }'

curl -s -X PUT "$ES/.ds-legacy-logs-2026.09.01-000001,.ds-legacy-logs-2026.09.02-000002/_settings" \
  -H 'Content-Type: application/json' \
  -d '{"index.lifecycle.name": "warm-best-compression-only"}'
```

Name the indices. A wildcard that matches the write index would put it under ILM too. Two named old backing indices converted in about 10 seconds on a small test cluster. An unattached old index and the write index were left alone.

## Skipping ILM for a Single Index

For a single index you can skip ILM. `PUT <index>/_settings?reopen=true` closes the index, applies the static setting, and reopens it ([Update index settings API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-put-settings)). Then set a write block and force merge.

```bash
curl -s -X PUT "$ES/app-logs-2026.10/_settings?reopen=true" \
  -H 'Content-Type: application/json' \
  -d '{"index.codec":"best_compression"}'

curl -s -X PUT "$ES/app-logs-2026.10/_settings" \
  -H 'Content-Type: application/json' \
  -d '{"index.blocks.write":true}'

curl -s -X POST "$ES/app-logs-2026.10/_forcemerge?max_num_segments=1&flush=true"
```

The reopen is not zero downtime. On a 2,000,000-document index, reads failed for about one second with 0 replicas, and also on a data stream write index with 1 replica. A standalone index with 1 replica showed under 100 ms. Writes waited and finished about a second late, with no errors. Measure your own replica setup. Large old segments did not convert on their own: an index of three 158 MB segments kept all three after 15 minutes of steady writes. The merge policy cause is not documented, so test your own index. That is why the merge matters. See [shards, segments, and fragmentation](/blog/elasticsearch-shards-segments-fragmentation) for how segments and merges work.

## What Does best_compression Save on Logs?

`best_compression` plus a merge made two Rally `elastic/logs` indices about 42% smaller than a merge alone. Both runs used Elasticsearch 9.5.6 and merged to one segment, and the table adds logsdb for comparison. The documents were copied from logsdb data, so they are reconstructed, not the originals.

![Bar chart of merged index size for Kubernetes and nginx logs under default, best_compression, and logsdb codecs](/blog/elasticsearch-best-compression-logsdb-without-reindex/size-comparison.svg)

| Source (documents) | Control: merge only | `best_compression` + merge | logsdb + merge |
|---|---|---|---|
| Kubernetes application log (1,315,000) | 297.0 MB | 170.9 MB (42.5% smaller) | 143.6 MB (about 52% smaller) |
| Nginx access (230,000) | 124.7 MB | 72.2 MB (42.1% smaller) | 38.4 MB (69.2% smaller) |

logsdb uses `best_compression` by default in 9.5.6, so its column includes the codec saving.

Stored fields account for most of the gap. They fell from 206.9 MB to 80.9 MB (61%) on the Kubernetes data and from 73.6 MB to 22.1 MB (70%) on nginx. The docs cite up to about 28% for the codec on logs ([General index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules)). The Rally logs saved more, likely because they carry long, repetitive text. Test one index before you plan capacity around any single figure.

### What the merge costs

A full merge needs free disk. On a 329 MB index, peak extra disk was about 219 MB, close to the 228 MB merged output. A control with no codec change peaked at about 382 MB, above its 314 MB merged output. Treat merged size as a floor. The [Force merge API docs](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge) give a worst case of up to 3x. For the disk watermark alerts to set before a merge, see [Elasticsearch stack monitoring](/blog/elasticsearch-stack-monitoring).

Aggregations get slower on a single-segment index. Range plus terms aggregations went from 17.9 ms to 23.9 ms median, and a date histogram from 18.6 ms to 27.5 ms. That is about 33% and 48% slower. A control with a merge and no codec change showed the same slowdown. <!-- [UNIQUE INSIGHT] --> The slowdown comes with the merge, so the codec does not explain it. Merging 39 segments into one most likely cuts parallel search across segments. If you use get-by-id, the [docs note](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules) a 10% to 33% increase in latency with `best_compression`. A hot-cache get-by-id test did not show it, so measure on cold data if you depend on it.

## Can Existing Elasticsearch Indices Move to logsdb?

To move a data stream to logsdb, change the template and roll over. The docs say an updated template takes effect at the next rollover ([Logs data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams/logs-data-stream)). Old backing indices stay in standard mode and leave through ILM.

```bash
curl -s -X PUT "$ES/_index_template/svc-logs" \
  -H 'Content-Type: application/json' \
  -d '{
    "index_patterns": ["svc-logs-*"],
    "data_stream": {},
    "priority": 300,
    "template": {"settings": {"index.mode": "logsdb"}}
  }'

curl -s -X POST "$ES/svc-logs-prod/_rollover"
```

There is no in-place route for existing indices. `index.mode` is a static setting ([General index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules)), and in 9.5.6 an update on an open or a closed index was rejected. A standalone index that must change mode needs a reindex into a logsdb index.

Check the version first. The docs say logsdb is on by default for new `logs-*-*` data streams from 9.0 ([Logs data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams/logs-data-stream)). Existing data streams in clusters upgraded from 8.x are not switched automatically. Custom index names that do not match the pattern are standard mode. Those are the cases where this section applies. See [Elasticsearch at scale](/blog/elasticsearch-at-scale) for logsdb in production log volumes.

logsdb sorts the index and, with the required subscription, uses synthetic `_source` ([Configure a logs data stream](https://www.elastic.co/docs/manage-data/data-store/data-streams/logs-data-stream-configure)). In a 9.5.6 test it rejected a disabled `_source` at create time. Run your own queries against a logsdb index before you move a production stream.

## Which Path Fits Which Index?

| Situation | Do this |
|---|---|
| New indices or data streams | Put the codec or mode in the template |
| Rolled-over indices still waiting for warm | Update the ILM policy with `index_codec` |
| Indices already past warm | `_ilm/move` to the start of the warm phase |
| Indices outside ILM | Attach a warm-only policy to named non-write indices |
| A single index, no ILM | `reopen=true`, write block, force merge |
| Data stream that should be logsdb | Template change plus rollover |
| Standalone index that must change mode | Reindex |

## How Do You Check It Worked?

Check three things: the ILM step, the codec, and the live segment bytes. The commands assume `ES` is set as in the first block.

```bash
curl -s "$ES/.ds-app-logs-prod-2026.11.01-000003/_ilm/explain" | jq '.indices[] | {phase, action, step}'

curl -s "$ES/.ds-app-logs-prod-2026.11.01-000003/_settings/index.codec?flat_settings=true"

curl -s "$ES/_cat/segments/.ds-app-logs-prod-2026.11.01-000003?v&bytes=b&h=segment,docs.count,size"
```

Use `_cat/segments` for sizes. The `_cat/indices` and `_stats/store` figures lag a merge by several seconds, so they can look unchanged right after one. A converted index reports `best_compression` and one segment per shard.

## FAQ

### Does a template change convert existing Elasticsearch indices?

No. A template applies only when an index is created, so only backing indices created after a rollover get the new codec ([Create or update an index template](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-put-index-template)). Existing indices convert through a merge, which ILM can run with `index_codec`.

### How does ILM change the codec of an existing index?

The warm-phase `forcemerge` action with `index_codec: best_compression` closes the index, reopens it, and force merges it ([ILM force merge](https://www.elastic.co/docs/reference/elasticsearch/index-lifecycle-actions/ilm-forcemerge)). The index is unavailable for reads and writes while closed, so use it on indices that no longer take writes.

### Why did my ILM policy update not convert old indices?

Indices that already finished the warm phase do not re-run it, and a policy update leaves them on their old codec ([Update or switch an ILM policy](https://www.elastic.co/docs/manage-data/lifecycle/index-lifecycle-management/policy-updates)). Move them to the start of the warm phase with `_ilm/move` and `"next_step": {"phase": "warm"}`. Jumping to the `forcemerge` step skips the codec steps.

### How much storage does best_compression save?

The docs cite up to about 28% on log data. On two Rally logs sources, a codec change plus a full merge gave 42.5% and 42.1% against a merge-only control in one run each. Results depend on the data, so test one index first.

### Can I change index.mode on an existing index?

No. The setting is static, and an update was rejected on both open and closed indices in 9.5.6. Update the template and roll over so new backing indices use the new mode, or reindex into an index created with it ([General index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules)).
