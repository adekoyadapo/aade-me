---
slug: "elasticsearch-shards-segments-fragmentation"
title: "Elasticsearch Segments: Why Shard Count Misleads"
excerpt: "Elasticsearch segments hold deleted documents until a merge clears them. In a worst-case 9.5.5 lab on one node, a merge cut a shard by 38%. Check docs.deleted."
date: "2026-10-28"
readTime: "20 min read"
tags: ["Elasticsearch", "Performance", "Architecture", "Operations"]
author: "Ade A."
imageUrl: "/blog/elasticsearch-shards-segments-fragmentation/hero.webp"
imageAlt: "Hand-drawn sketch of a shard with five segments, coral deleted documents, and one clean segment after a merge"
---

An Elasticsearch shard can pass every sizing rule and still be unhealthy. Say the shard is 30GB, the count is under the node limit, and disk keeps growing. Shard count does not show this. Elasticsearch segments and deleted documents do.

A shard is built from immutable segments, so an update or delete never frees space on its own. The lab below reproduces the effect on Elasticsearch 9.5.5 in three to four minutes on my laptop (the base lab). The last sections cover a way to reclaim space on an index that still receives writes and should carry less risk than a full force merge.

> **Key Takeaways**
> - A shard is a Lucene index made of immutable segments, and each refresh with new writes adds one ([Near real-time search](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search)). As a shard grows, merges combine segments into fewer, larger ones ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)).
> - Updates and deletes only flag the old copy. The bytes stay on disk until a merge removes them ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)).
> - In a constructed worst case on 9.5.5 (40% of documents updated, 10% deleted), the shard held 18,107 deleted documents next to 27,027 live ones. After a 45-second wait, one extra write, and a 35-second wait, one merge cut it from 1.27 MB to 0.79 MB (my lab, below).
> - Full force merges are documented for read-only indices ([Force merge API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge)). `only_expunge_deletes=true` rewrites only segments above a delete threshold ([Lucene `TieredMergePolicy`](https://lucene.apache.org/core/10_5_0/core/org/apache/lucene/index/TieredMergePolicy.html)), so it should be lower risk on a write index. A small writer test found no write errors, but the first merge freed nothing and needed a repeat (details and limits below).
> - Prevent the churn with data streams, ILM rollover, and whole-index deletion instead of document deletes ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)).

> **TL;DR** — Shard count hides fragmentation; `docs.deleted` and segment count reveal it. Use rollover so data leaves by index, not `_delete_by_query`. On a write index, test `only_expunge_deletes=true` on staging, run it off-peak, and repeat after a wait and one write if `docs.deleted` did not drop. Keep full force merges for read-only indices.

---

## What Does a Fragmented Shard Look Like?

A fragmented shard looks healthy from the outside: `_cat/shards` reports a normal size and the cluster is green. The signs are in the segment list: many small segments and a large share of deleted documents. In the lab below, 18,107 deleted documents sat next to 27,027 live ones across eight segments. A **deleted document** here is one flagged as deleted that still sits in a segment file.

I built that state on purpose. The lab below loads 30,000 orders into one shard in six bulk batches (see [bulk ingestion patterns](/blog/getting-data-into-elasticsearch) for production loading), updates about 40% of them, and deletes about 10%. The result from `_cat/segments`:

```text
segment docs.count docs.deleted    size
_0            2432         2568 145.3kb
_1            2298         2702 139.8kb
_2            2703         2297 143.9kb
_3            2567         2433   144kb
_4            2298         2702 144.7kb
_5            2568         2432 144.2kb
_6           12161            0 342.2kb
_7               0         2973  37.8kb
```

Six original segments are each about half dead. `_6` holds the 12,161 new versions of the updated orders. `_7` shows `docs.count 0` and 2,973 deleted: consistent with the markers the delete leaves behind. Across the shard, `_stats` reports 27,027 live documents and 18,107 deleted ones, for 1.27 MB on disk.

Nothing is broken. Segments are immutable, so Lucene cannot reclaim space in place.

---

## Elasticsearch Segments Inside a Shard

Each Elasticsearch shard is a separate Lucene index ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)). Lucene stores it as a set of **segments**, and segments are immutable: a segment is never edited after it is written ([Merge settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/merge)). New data arrives as a new segment. Search reads the segments and combines the partial results.

Writes follow a short path. A document is routed to its primary shard, held in an in-memory buffer, and logged to the translog for durability. A **refresh** writes the buffer out as a new segment and opens it to search ([Near real-time search](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search)). Until that happens, the write is acknowledged but invisible.

![Animated diagram: writes sit in a buffer, a refresh turns them into segment 12, and they become searchable](/blog/elasticsearch-shards-segments-fragmentation/refresh-cycle.svg)

- **Refresh does not run every second for every index.** By default Elasticsearch refreshes every second, but only on indices that received a search request in the last 30 seconds. On Elastic Cloud Serverless the default is 5 seconds ([Refresh API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-refresh)). By my reading of that default, a busy, searched index can cut a new small segment each second it sees writes.
- **Refresh and flush are different.** Flushing makes sure data held only in the transaction log is also stored in the Lucene index. After a restart, Elasticsearch replays unflushed operations from the translog ([Flush API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-flush)). A refresh only makes data searchable.

Background merges offset this. Elasticsearch keeps some segment metadata in heap memory so searches can use it quickly. As a shard grows, its segments are merged into fewer, larger ones, which means less metadata in heap ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)).

---

## Updates and Deletes Never Edit Anything

Think of a ledger written in ink. You never erase a line. You strike it through and write the corrected line below, and space comes back only when someone recopies the ledger. A merge is the recopy.

Because segments are immutable, an update cannot change a field in place. It writes a new version of the document and flags the old one as deleted. The [Force merge API docs](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge) describe the flagging (soft-deleted, with a tombstone).

![Animated diagram: updating order 42 writes v2 to a new segment and flags the old copy; deleting order 44 only flags it](/blog/elasticsearch-shards-segments-fragmentation/update-delete.svg)

### What an update writes

The [Update API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-update) fetches the document, applies your change, and reindexes the whole document. A one-field change and a ten-field change both write a full new version.

| Operation | What you send | What gets written | Old copy |
|---|---|---|---|
| Insert | Index request with a new `_id` | One new document | None |
| Update | `_update` with a changed field, or an index request with an existing `_id` | One complete new version | Flagged deleted |
| Update by query | `_update_by_query` over many documents | One new version per match | All flagged deleted |
| Delete | `DELETE` by `_id` | A small marker | Flagged deleted |

<!-- [PERSONAL EXPERIENCE] -->
One update is cheap: the one that changes nothing. In an exploratory run on 9.5.5, I sent a partial update to a document that already held that value. The response was this. The Update API page does not describe this behaviour, so treat it as observed:

```text
{"_index":"orders","_id":"6","_version":2,"result":"noop","_shards":{"total":0,"successful":0,"failed":0},"_seq_no":30006,"_primary_term":1}
```

`_version` did not change. Partial updates from application code can resend unchanged values, and this skips the write for those.

### What a delete writes

Deletes work the same way from the user's side. Elasticsearch marks the document as deleted and leaves it in place. It keeps using disk and memory until a periodic merge removes it ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)). Elasticsearch also tracks recent history with extra deleted documents, which the [cat segments API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-cat-segments) describes. That is consistent with segment `_7` in the lab output holding zero live documents.

---

## When Do Deleted Documents Become Fragmentation?

Not every update or delete fragments a shard. Each one leaves a deleted document, and each refresh with writes adds a small segment. Merges run in the background and clear both, since soft-deleted documents are cleaned up during regular segment merges ([Force merge API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge)). **Fragmentation** is the state you reach when deleted documents and small segments arrive faster than merges remove them.

![Animated diagram: six segments fill with deleted documents past 20%, then a merge leaves one clean segment](/blog/elasticsearch-shards-segments-fragmentation/fragmentation-merge.svg)

The merge policy is set per index. These are the values `GET orders/_settings?include_defaults=true` reported on a 9.5.5 node:

| Setting | Default on 9.5.5 | What it controls |
|---|---|---|
| `index.merge.policy.segments_per_tier` | 8.0 | How many similar-sized segments can pile up before a merge starts |
| `index.merge.policy.floor_segment` | 16mb | Segments smaller than this are treated as this size when merges are picked |
| `index.merge.policy.deletes_pct_allowed` | 20.0 | Share of all documents, live plus deleted, that may be deleted before the policy prioritises cleanup |
| `index.merge.policy.expunge_deletes_allowed` | 10.0 | Deleted share a segment must exceed before `only_expunge_deletes` rewrites it |

The Elastic docs list the merge scheduler settings but not these policy settings, so the values come from `GET orders/_settings?include_defaults=true&flat_settings=true` on 9.5.5:

```text
index.merge.policy.deletes_pct_allowed 20.0
index.merge.policy.expunge_deletes_allowed 10.0
index.merge.policy.floor_segment 16mb
index.merge.policy.segments_per_tier 8.0
```

They match the defaults in the Lucene [`TieredMergePolicy` javadoc](https://lucene.apache.org/core/10_5_0/core/org/apache/lucene/index/TieredMergePolicy.html) (the 9.5.5 node reports Lucene 10.5.1), which defines the `deletes_pct_allowed` share as deleted documents divided by live plus deleted documents. By that rule a segment with 500 deleted and 4,500 live documents is 10% deleted, not 11%. Defaults change between releases, so read yours with `include_defaults=true` before you tune anything.

Three patterns generate churn fast: a status column updated on every order, a queue index that deletes consumed items, and an `_update_by_query` that rewrites millions of documents.

---

## What Does Fragmentation Cost?

Fragmentation costs disk, heap, and search work. Shard count does not reveal any of them. The lab measured disk. The heap effect comes from the docs. The cache and search effects are my reasoning from how Lucene works, and I did not measure them.

### Disk

While deleted documents were present, the 27,027 live documents in the lab took 1.27 MB. After a merge, the same live documents plus one extra write took 0.79 MB, a 38% reduction. Sizes in the prose are decimal megabytes computed from bytes, while `_cat` prints binary units, so its numbers look slightly smaller. The reduction mixes dropped deleted documents with the effect of consolidating the segments into one, and I did not separate the two. The ratio also depends on your churn. For mapping and ILM savings beyond segments, see the [storage optimization guide](/blog/elasticsearch-stack-storage-optimization).

![Animated bar chart: fragmented shard uses 1.27 MB, merged shard 0.79 MB for the same live data, a 38% reduction](/blog/elasticsearch-shards-segments-fragmentation/footprint.svg)

### Heap

Every segment carries metadata in memory, and each segment pays a small per-field cost on top. The docs note this is usually unnoticeable, but it matters when both segment counts and field counts are high ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)).

### Filesystem cache

Search speed depends on how much live data the filesystem cache holds. Deleted documents sit in the same files, so they can take cache space that live data would otherwise use. That is my reasoning, not something the docs state.

### Search work

Each shard runs a search on a single CPU thread ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)). Lucene visits a shard segment by segment, so I expect more segments to mean more per-segment lookups and a check to skip deleted hits. That is my reasoning from how Lucene works, not something the docs state.

### The document limit

A shard cannot exceed 2,147,483,519 documents. That limit applies to `docs.count` plus `docs.deleted` ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)). Deleted documents count against you, so watch `docs.count + docs.deleted` as it approaches the limit. The [Stack Monitoring guide](/blog/elasticsearch-stack-monitoring) covers large-shard detection and alert rules.

---

## How Do You Spot Fragmented Elasticsearch Segments Early?

Compare `docs.deleted` with `docs.count` in `_cat/segments`: a deleted share above 20% of all documents marks a shard worth merging. Three calls show it. Run them against a suspect index.

```bash
# Segment-level view: watch docs.deleted next to docs.count
curl -s "localhost:9200/_cat/segments/orders?v&h=segment,docs.count,docs.deleted,size"

# Index-level totals for live and deleted documents, and the segment count
curl -s "localhost:9200/orders/_stats/docs,segments?filter_path=_all.primaries.docs,_all.primaries.segments.count"

# Shard size and document count, to compare with the sizing guidance
curl -s "localhost:9200/_cat/shards/orders?v&h=index,shard,prirep,docs,store"
```

The cat segments API is meant for people, not applications. For automation, use the [index segments API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-segments) instead.

What to watch:

- A deleted share above 20%, where share is `docs.deleted / (docs.count + docs.deleted)`. That is the 9.5.5 default of `deletes_pct_allowed`, so a shard can sit near it by design. Alert on a sustained excess, not one reading.
- A segment count that keeps growing between merges.
- A `store` size well above what the live documents should need.
- `docs.count` plus `docs.deleted` approaching the 200 million documents per shard guideline ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)).

---

## Reproduce It: A Short Lab

Run this on a throwaway container. It needs Docker, curl, and python3. It uses port 9201 so it cannot collide with a local node, and it removes the container when it finishes. The base lab took three to four minutes on my laptop because of the waits in step 4. The writer extension below adds about two more.

### The script

```bash
#!/usr/bin/env bash
# Throwaway lab: watch segments fragment under updates and deletes.
set -euo pipefail
ES=http://localhost:9201
H='Content-Type: application/json'

docker run -d --name es-segments-lab -p 127.0.0.1:9201:9200 \
  -e discovery.type=single-node -e xpack.security.enabled=false \
  -e ES_JAVA_OPTS="-Xms1g -Xmx1g" -m 2g \
  docker.elastic.co/elasticsearch/elasticsearch:9.5.5 >/dev/null
trap 'docker rm -fv es-segments-lab >/dev/null' EXIT
until curl -sf "$ES/_cluster/health?wait_for_status=yellow&timeout=5s" >/dev/null; do sleep 3; done

segments() { curl -s "$ES/_cat/segments/$1?v&h=segment,docs.count,docs.deleted,size"; }

# 1. One shard, no automatic refresh, so every bulk call is a refresh we control.
curl -s -H "$H" -X PUT "$ES/orders" -d '{
  "settings": {"number_of_shards": 1, "number_of_replicas": 0, "refresh_interval": "-1"},
  "mappings": {"properties": {"status": {"type": "keyword"}, "total": {"type": "float"}}}
}' >/dev/null

# 2. Six bulk loads of 5,000 documents, refreshed after each: six segments.
for b in 0 1 2 3 4 5; do
  python3 -c "
import json
for i in range($b*5000, ($b+1)*5000):
    print(json.dumps({'index': {'_id': str(i)}}))
    print(json.dumps({'status': 'paid', 'total': round(i*0.37 % 500, 2)}))
" | curl -s -H 'Content-Type: application/x-ndjson' -X POST "$ES/orders/_bulk?refresh=true" --data-binary @- >/dev/null
done
echo "--- after load"; segments orders

# 3. Churn: update about 40% of the documents, delete about 10%.
curl -s -H "$H" -X POST "$ES/orders/_update_by_query?refresh=true&conflicts=proceed" -d '{
  "query": {"range": {"total": {"lt": 200}}},
  "script": {"source": "ctx._source.status = \"shipped\""}
}' >/dev/null
curl -s -H "$H" -X POST "$ES/orders/_delete_by_query?refresh=true&conflicts=proceed" -d '{
  "query": {"range": {"total": {"gte": 450}}}
}' >/dev/null
echo "--- after churn"; segments orders
curl -s "$ES/orders/_stats/docs,segments?filter_path=_all.primaries.docs,_all.primaries.segments.count"; echo

# 4. Expunge only the segments above expunge_deletes_allowed (default 10).
#    In my runs a merge right after the churn freed nothing, probably because of
#    soft-delete retention (not isolated). This sequence worked: wait 45 seconds,
#    write once, wait 35 more, then merge.
sleep 45
curl -s -H "$H" -X POST "$ES/orders/_doc/settle?refresh=true" -d '{"status":"paid","total":1}' >/dev/null
sleep 35
curl -s -X POST "$ES/orders/_flush?force=true" >/dev/null
curl -s -X POST "$ES/orders/_forcemerge?only_expunge_deletes=true&flush=true" >/dev/null
echo "--- after only_expunge_deletes"; segments orders
curl -s "$ES/orders/_stats/docs,segments?filter_path=_all.primaries.docs,_all.primaries.segments.count"; echo
```

### The result

On 9.5.5 the final step printed this:

```text
--- after only_expunge_deletes
segment docs.count docs.deleted    size
_a           27028            0 773.3kb
{"_all":{"primaries":{"docs":{"count":27028,"deleted":0,"total_size_in_bytes":791921},"segments":{"count":1}}}}
```

Nine segments (the eight from the churn plus the `settle` write) became one, `docs.deleted` went from 18,107 to zero, and total size fell from 1,272,082 to 791,921 bytes. The extra live document is the `settle` write from step 4.

Every original segment in this lab was between 46% and 54% deleted, far above the 10% trigger. That is why the merge rewrote nearly the whole shard. The scaled-down test further down shows what happens when only some segments are over the delete threshold.

### What the wait does and does not show

<!-- [PERSONAL EXPERIENCE] -->
A merge issued right after the deletes freed nothing in my runs. In an exploratory run, `docs.deleted` stayed at 18,107 after a merge to one segment. In an earlier scripted run, I slept 80 seconds, wrote one document, and merged straight away. That also changed nothing. The writer test below adds a third failure: a merge shortly after a writer started.

The sequence in the script worked in both no-writer runs of the published scripts: wait about 45 seconds, write one document, wait about 35 more, then merge. What separates the failures from the successes is not clear from these runs. I did not test each wait separately or find the minimum. A likely cause is retained soft-delete history, which the cat segments docs describe, but I did not isolate it.

If a merge appears to do nothing, repeat the sequence above before you conclude it failed.

---

## Is only_expunge_deletes a Safer Fit for a Write Index?

A full force merge belongs on read-only indices. `only_expunge_deletes=true` is the better candidate when the index still takes writes, because it skips clean segments. A small writer test (see "What Happens When Writes Keep Arriving?") found no write errors. It also showed that the first merge can free nothing.

### Why a full force merge is the risk

The [Force merge API docs](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge) recommend force merging only an index that no longer receives writes. A force merge can produce segments larger than 5GB. Those are not eligible for regular merges, so soft-deleted documents inside them can pile up and cost more disk and search time.

The same page warns that regularly force merging an index that receives writes makes snapshots more expensive, because the new documents cannot be backed up incrementally ([Force merge API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge)). A merge to one segment can need free space up to three times the shard size while it runs ([Force merge API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge)).

### What only_expunge_deletes does differently

`only_expunge_deletes=true` is listed on the same page. It rewrites segments whose deleted share is above `expunge_deletes_allowed` and leaves the rest alone. The Lucene javadoc describes the rule as merging away a segment only if its delete percentage is over the threshold ([`TieredMergePolicy`](https://lucene.apache.org/core/10_5_0/core/org/apache/lucene/index/TieredMergePolicy.html)). The shard-sizing guide uses it as the mitigation when a shard approaches the document limit, and adds that it helps only if a meaningful portion of the shard is deleted documents ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)).

---

## Does a Scaled-Down Test Show the Difference?

Partly. It shows how segments are selected. It does not show soft-deleted documents piling up inside oversized segments, which is the harm the docs describe. The stand-in cap is 400kb in place of the 5GB figure in the docs.

### The script

This second script builds two identical indices, each with six data segments plus a delete-marker segment: one data segment 80% deleted, one exactly 10% deleted, and four with no deletes. It sets `index.merge.policy.max_merged_segment` to 400kb, then runs a full merge on one index and `only_expunge_deletes` on the other.

```bash
#!/usr/bin/env bash
# Scaled-down cap test: full force merge vs only_expunge_deletes with a 400kb segment cap.
set -euo pipefail
ES=http://localhost:9201
H='Content-Type: application/json'

docker run -d --name es-cap-lab -p 127.0.0.1:9201:9200 \
  -e discovery.type=single-node -e xpack.security.enabled=false \
  -e ES_JAVA_OPTS="-Xms1g -Xmx1g" -m 2g \
  docker.elastic.co/elasticsearch/elasticsearch:9.5.5 >/dev/null
trap 'docker rm -fv es-cap-lab >/dev/null' EXIT
until curl -sf "$ES/_cluster/health?wait_for_status=yellow&timeout=5s" >/dev/null; do sleep 3; done

segments() { curl -s "$ES/_cat/segments/$1?v&h=segment,docs.count,docs.deleted,size"; }

# Two identical indices: six segments of 5,000 documents, a 400kb stand-in for the 5GB cap.
for idx in full expunge; do
  curl -s -H "$H" -X PUT "$ES/$idx" -d '{"settings": {"number_of_shards": 1, "number_of_replicas": 0,
    "refresh_interval": "-1", "index.merge.policy.max_merged_segment": "400kb",
    "index.merge.policy.segments_per_tier": 50}}' >/dev/null
  for b in 0 1 2 3 4 5; do
    python3 -c "
import json
for i in range($b*5000, ($b+1)*5000):
    print(json.dumps({'index': {'_id': str(i)}}))
    print(json.dumps({'status': 'paid', 'n': i}))
" | curl -s -H 'Content-Type: application/x-ndjson' -X POST "$ES/$idx/_bulk?refresh=true" --data-binary @- >/dev/null
  done
  # Delete 80% of segment 0 (ids 0-3999) and exactly 10% of segment 1 (ids 5000-5499).
  python3 -c "
import json
ids = [str(i) for i in range(0, 4000)] + [str(i) for i in range(5000, 5500)]
print(json.dumps({'query': {'ids': {'values': ids}}}))
" | curl -s -H "$H" -X POST "$ES/$idx/_delete_by_query?refresh=true&conflicts=proceed" --data-binary @- >/dev/null
done
echo "--- before (identical on both)"; segments full

# Let the soft-delete history settle: one write, then wait.
sleep 45
for idx in full expunge; do
  curl -s -H "$H" -X POST "$ES/$idx/_doc/settle?refresh=true" -d '{"status":"paid","n":-1}' >/dev/null
done
sleep 35
for idx in full expunge; do curl -s -X POST "$ES/$idx/_flush?force=true" >/dev/null; done

curl -s -X POST "$ES/full/_forcemerge?max_num_segments=1&flush=true" >/dev/null
echo "--- full: max_num_segments=1"; segments full
curl -s -X POST "$ES/expunge/_forcemerge?only_expunge_deletes=true&flush=true" >/dev/null
echo "--- expunge: only_expunge_deletes=true"; segments expunge
```

### The result

On 9.5.5 it printed:

```text
--- before (identical on both)
segment docs.count docs.deleted    size
_0            1000         4000 111.1kb
_1            4500          500   100kb
_2            5000            0 102.5kb
_3            5000            0 102.5kb
_4            5000            0 102.5kb
_5            5000            0 102.5kb
_6               0         4500  55.3kb
--- full: max_num_segments=1
segment docs.count docs.deleted    size
_8           25501            0 509.9kb
--- expunge: only_expunge_deletes=true
segment docs.count docs.deleted    size
_1            4500          500   100kb
_2            5000            0 102.5kb
_3            5000            0 102.5kb
_4            5000            0 102.5kb
_5            5000            0 102.5kb
_7               1            0   5.6kb
_8            1000            0  23.8kb
```

| Command | Result |
|---|---|
| `_forcemerge?max_num_segments=1` | One 509.9kb segment, above the 400kb cap |
| `_forcemerge?only_expunge_deletes=true` | `_0` (80% deleted) was rewritten into `_8` with its 1,000 live documents. The marker segment `_6` was dropped, and `_7` is the `settle` write. The four clean segments and the 10% segment `_1` were untouched |

Segment `_1` held 500 deleted documents out of 5,000 and was left alone, which is consistent with an "above 10%" trigger. I raised `segments_per_tier` to 50 so no automatic merge ran during setup. The cap is a 400kb stand-in for the 5GB figure, it was one run, and nothing wrote to the indices while the merge ran. The 23.8kb output confirms segment selection, not cap behaviour.

<!-- [UNIQUE INSIGHT] -->
The same table shows how the threshold is counted. Segment `_1` has 500 deleted and 4,500 live documents. That is 10.0% of all documents but 11.1% of live documents, and it was skipped. The javadoc states the total-based denominator for `deletes_pct_allowed`. For the expunge threshold, this run is consistent with the same rule, from one data point. Either way, reading `docs.deleted` against `docs.count` alone overstates the share.

---

## What Happens When Writes Keep Arriving?

A writer that ran before and after the merge caused no errors. The first merge still freed nothing, and a repeat freed everything while the writer was still running. By logged start time plus duration, no bulk overlapped the first merge, so this does not show what a merge does to writes that arrive during it.

### The change to the lab

I extended the lab with a background writer that sends a 200-document insert bulk, then pauses 0.5 seconds, in a loop. The writer logs to `writer.log` in the current directory. The index still has `refresh_interval` set to `-1`, so no scheduled refresh runs apart from the explicit refresh on each `settle` write, and the writer only inserts. `_cat/segments` still lists the writer's documents, likely because the flush in the merge call writes them into segments, though I did not check whether they were searchable, so there are no new updates or deletes.

In the lab script, keep everything up to and including the `sleep 35` line in step 4. Replace every line after it with this:

```bash
curl -s -X POST "$ES/orders/_flush?force=true" >/dev/null

now() { python3 -c 'import time; print(f"{time.time():.3f}")'; }
merge() { curl -s -X POST "$ES/orders/_forcemerge?only_expunge_deletes=true&flush=true" >/dev/null; }
report() { echo "--- $1"; segments orders; }

# Background writer: a 200-document insert bulk every 0.5 seconds.
# Each log line is: start-epoch http-status seconds. The index still has refresh_interval -1.
: > writer.log
(
  n=0
  while :; do
    n=$((n+1))
    S=$(now)
    python3 -c "
import json
for i in range(200):
    print(json.dumps({'index': {'_id': 'w$n-%d' % i}}))
    print(json.dumps({'status': 'new', 'total': 600 + i}))
" | curl -s -o /dev/null -w "$S %{http_code} %{time_total}\n" -H 'Content-Type: application/x-ndjson' \
        -X POST "$ES/orders/_bulk" --data-binary @- >> writer.log
    sleep 0.5
  done
) &
WRITER=$!
sleep 5

# Attempt 1: merge with the writer running.
T0=$(now); merge; T1=$(now)
report "attempt 1, writer running (merge took $(python3 -c "print(round($T1-$T0,2))")s)"
awk -v a="$T0" -v b="$T1" '{ if ($1+$3 >= a && $1 <= b) o++ ; if ($2 != 200) bad++ } END { printf "bulks overlapping the merge: %d, non-200 responses: %d, total bulks: %d\n", o, bad, NR }' writer.log

# Attempt 2: same sequence again, writer still running.
sleep 45
curl -s -H "$H" -X POST "$ES/orders/_doc/settle2?refresh=true" -d '{"status":"paid","total":1}' >/dev/null
sleep 35
curl -s -X POST "$ES/orders/_flush?force=true" >/dev/null
merge
report "attempt 2, writer still running"

# Attempt 3: stop the writer, then repeat the sequence.
kill $WRITER 2>/dev/null || true; wait $WRITER 2>/dev/null || true
sleep 45
curl -s -H "$H" -X POST "$ES/orders/_doc/settle3?refresh=true" -d '{"status":"paid","total":1}' >/dev/null
sleep 35
curl -s -X POST "$ES/orders/_flush?force=true" >/dev/null
merge
report "attempt 3, writer stopped"
curl -s "$ES/orders/_stats/docs,segments?filter_path=_all.primaries.docs,_all.primaries.segments.count"; echo
awk '{n++; if ($2 != 200) bad++; if ($3 > m) m = $3} END {printf "all bulks: %d, non-200: %d, slowest: %.3fs\n", n, bad+0, m}' writer.log
```

## What Did the Writer Test Show?

Here is what one run printed on 9.5.5:

```text
--- attempt 1, writer running (merge took 0.07s)
segment docs.count docs.deleted   size
_9           27028        18107  1.1mb
_a            1800            0 42.8kb
bulks overlapping the merge: 0, non-200 responses: 0, total bulks: 9
--- attempt 2, writer still running
segment docs.count docs.deleted   size
_b           28828            0 820.4kb
_c           15001            0 330.1kb
_d            5200            0 114.6kb
_e            6600            0 141.6kb
--- attempt 3, writer stopped
segment docs.count docs.deleted   size
_b           28828            0 820.4kb
_c           15001            0 330.1kb
_d            5200            0 114.6kb
_e            6600            0 141.6kb
_f               1            0   4.9kb
all bulks: 143, non-200: 0, slowest: 0.025s
```

| Step | Writer | `docs.deleted` afterwards | Runs |
|---|---|---|---|
| Attempt 1: merge about 5 seconds after the writer started | Running | 18,107 | 3 of 3 (one printed above) |
| Attempt 2: wait 45s, write one document, wait 35s, merge | Still running | 0 | 1 |
| Attempt 3: stop the writer, repeat the same sequence (nothing left to reclaim) | Stopped | 0 | 1 |

The writer sent 143 bulk requests across the whole run. All returned HTTP 200, and the slowest took 0.025 seconds. In the plain lab, with no writer, the same merge issued after the same wait freed everything on the first try. The only difference I can see is that the writer had just started, and I did not test that. A writer that had been running for a while did not block reclaim in attempt 2. Attempt 3 only shows that nothing regressed, because attempt 2 had already cleared the deleted documents.

<!-- [UNIQUE INSIGHT] -->
So do not conclude that `only_expunge_deletes` failed because the first call left `docs.deleted` unchanged. Repeat the wait, write, wait, merge sequence and check again. Retained soft-delete history is the likely cause of the first failure, but this test cannot separate it from other timing effects.

## What Does the Writer Test Miss?

- **Overlap.** The first merge took 0.07 seconds and no bulk overlapped it by logged start time plus request duration. The start time is taken before the request body is generated, so the estimate is approximate. I did not measure overlap for attempts 2 and 3.
- **Sample size.** Attempt 1 behaved the same way in three runs. Attempts 2 and 3 were each run once.
- **Realism.** The writer only inserts, nothing refreshes, and the dataset is tiny, so it says nothing about production latency or about writers that also update and delete.
- **Cause.** I did not isolate why the first attempt falls short.

---

## What Are the Limits of only_expunge_deletes?

Four limits apply before you schedule it:

- **It targets deleted documents, not segment count.** A shard with hundreds of tiny, clean segments needs rollover and sensible refresh settings instead. Segment count drops only when segments with deletes are rewritten.
- **It rewrites files.** Rewritten segments are new files, so check free disk first. Schedule it off-peak: the shard-sizing guide advises that because force merges are resource-intensive ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)).
- **A merge right after deletes freed nothing in my runs.** Follow the lab's sequence: wait, write one document, wait again, then merge. Then check `docs.deleted` and repeat if it did not drop.
- **My write-load test was small.** It used one node, 143 insert bulks, and a tiny dataset, and no write overlapped the first merge, so it says nothing about production latency. The case for the command rests on how it selects segments, on the docs using it as a mitigation, and on that test. Try it on a staging copy of a busy index first.

`index.merge.policy.expunge_deletes_allowed` is an index-level setting (it appears in the index settings output earlier), so the trigger is set per index. Lowering it should make the merge rewrite segments with fewer deletes.

```bash
curl -s -X POST "localhost:9200/orders/_forcemerge?only_expunge_deletes=true&wait_for_completion=false"
```

With `wait_for_completion=false`, Elasticsearch returns a task ID you can poll. The task cannot be canceled and Elasticsearch records it as a document in `_tasks/<task_id>` ([Force merge API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge)).

---

## Prevent It by Design

Prevent the churn first, because a merge only reclaims space after the fact. These are the pieces that matter for segments:

1. **Delete indices, not documents.** Elasticsearch removes a deleted index directly from the file system and frees its resources immediately ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)). Use data streams and ILM so old data leaves by rollover and delete phase, not by `_delete_by_query` ([Index rollover](https://www.elastic.co/docs/manage-data/lifecycle/index-lifecycle-management/rollover)).
2. **Size by rollover.** Set the rollover `max_primary_shard_size` to 50gb and `min_primary_shard_size` to 10gb, and keep shards under about 200 million documents ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)).
3. **Prefer append-only data.** Where the model allows it, write a new document instead of updating an old one. Batch partial updates so a document is rewritten once, not several times.
4. **Raise the refresh interval during bulk loads.** The indexing-speed docs suggest `-1` for large loads, and a larger value such as `30s` when you can accept the delay ([Tune for indexing speed](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/indexing-speed)). Fewer refreshes should mean fewer small segments to merge later.
5. **Force merge after rollover, not during writes.** Once an index is no longer written to, merging it down is the documented good use of the API ([Force merge API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge)).

[Elasticsearch at Scale](/blog/elasticsearch-at-scale) covers the sizing patterns when churn becomes a platform-wide cost.

---

## Frequently Asked Questions

### Does every update or delete fragment a shard?

No. Merges clear deleted documents and small segments in the background ([Force merge API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge)). A shard fragments only when they arrive faster than merges clear them, usually under sustained updates or `_delete_by_query`.

### Is only_expunge_deletes safe on an index that is still receiving writes?

It is a better candidate than a full force merge, but test it on a staging copy first. It rewrites only segments above the `expunge_deletes_allowed` threshold (10.0 on 9.5.5) and leaves clean segments alone, so it does not build one large segment from clean data. A scaled-down test (one run) showed which segments each command selects, not how either behaves at the real 5GB cap. A small writer test found no write errors, though no write overlapped the first merge.

### Why does docs.deleted stay the same after a force merge?

Likely because of retained soft-delete history. In my no-writer runs, a merge right after heavy deletes freed nothing, and the sequence of a write plus a 35-second wait freed everything. In the writer test, the first merge after that sequence still freed nothing and a repeat freed it, so repeat the sequence and check `docs.deleted` before you assume the merge failed. I did not isolate the cause or the minimum wait.

### How many segments should a shard have?

There is no fixed target. Segments are merged into fewer, larger ones as the shard grows, so the count should stay bounded. The sizing guidance caps a shard at about 200 million documents ([Size your shards](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)). Worry when it keeps rising between merges, or when the deleted share stays above 20% of all documents.

### Should I force merge old indices to one segment?

Yes, after rollover, once the index is read-only. The docs describe this as a good use of force merge, and single-segment shards can sometimes use simpler and more efficient data structures for search ([Force merge API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-forcemerge)). Avoid it on indices that still take writes.

---

## What Should You Check First on Your Elasticsearch Segments?

1. Run `_cat/segments/<index>?v&h=segment,docs.count,docs.deleted,size` on your three most-updated indices.
2. If the deleted share, `docs.deleted / (docs.count + docs.deleted)`, stays above 20%, find the writer: an `_update_by_query` job, a queue pattern, or a status column updated on every event.
3. Move time-based data to data streams with rollover, so deletion becomes dropping an index.
4. For indices that must stay writable, schedule `only_expunge_deletes=true` off-peak and re-check `docs.deleted` a few minutes later.
5. Add the deleted-document ratio to the monitoring dashboards you already use.
