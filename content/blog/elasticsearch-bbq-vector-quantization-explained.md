---
slug: "elasticsearch-bbq-vector-quantization-explained"
title: "Elasticsearch BBQ Vector Quantization: The Mona Lisa Test"
excerpt: "Vector quantization in Elasticsearch: BBQ cut search RAM from 311 MB to 15 MB on a synthetic 100,000-vector dataset in 9.5.6, with 0.935 default recall@10."
date: "2026-11-17"
tags: ["Elasticsearch", "Vector Search", "BBQ", "Quantization"]
author: "Ade A."
imageUrl: "/blog/elasticsearch-bbq-vector-quantization-explained/hero.webp"
imageAlt: "Portrait dissolving into pixel blocks and a 1-bit black-and-white grid, with vector arrows on navy"
---

**BBQ (Better Binary Quantization)** is an Elasticsearch `dense_vector` quantization method that stores each dimension of an embedding as one bit instead of 32, then rescores the top candidates with the original floats. In Elasticsearch 9.5.6, this cuts the RAM needed for fast search from 311 MB to 15 MB on 100,000 vectors, with recall@10 of 0.935 at the default settings and 0.979 at 5x oversampling. Disk usage did not fall. It rose by about 3%.

That last point surprises people. Platform teams worry that vectorizing data will double their storage. BBQ answers a different problem: how much of the index has to sit in memory for search to stay fast.

> **Key Takeaways**
> - BBQ keeps the original dimensionality and reduces each value to a single bit, which is a 32x reduction in the quantized copy, plus 14 bytes of corrective data per vector ([Elastic docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/bbq)).
> - Elasticsearch keeps the raw float vectors on disk for rescoring, so disk use rises about 3.1% for BBQ, 12.5% for int4 and 25% for int8 ([dense_vector docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector)). The test measured +3.5%, +12.9% and +25.2%.
> - The saving is RAM: 15 MB for `bbq_hnsw` against 311 MB for float32 HNSW on 100,000 vectors of 768 dimensions (Elasticsearch 9.5.6).
> - Recall is the price. BBQ needs oversampling and rescoring to recover it. In the test, `bbq_hnsw` moved from 0.77 at 1.5x to 0.9945 at 10x.
> - For text embeddings, Elastic recommends BBQ, and `bbq_hnsw` is the default from 384 dimensions ([vector storage docs](https://www.elastic.co/docs/solutions/search/vector/vector-storage-for-semantic-search)). Below 384 dimensions the docs warn of lower accuracy, so int8 or int4 is the safer start ([BBQ docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/bbq)). Voice and image embeddings were not tested here.

---

## Why Does Vector Quantization Work With Less Precision?

A vector is a list of numbers. An embedding model turns a sentence into, say, 768 of them. Two sentences with similar meaning produce lists that point in nearly the same direction.

Search compares directions. Cosine similarity measures the angle between two vectors. Elasticsearch normalizes cosine vectors to unit length at index time, then uses the cheaper dot product internally ([dense_vector docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector)).

Each number is a float32 by default, which costs 4 bytes ([dense_vector docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector)). One 768-dimension vector is 3,072 bytes. A hundred thousand of them is 307.2 MB, exactly what the raw `.vec` file measured.

The comparison only needs the direction, not the fifth decimal place. That is the opening quantization uses.

---

## What Is the Mona Lisa Test for Vectors?

Take a famous portrait at full resolution. Reduce it, then reduce it again. You can still tell who it is. In this analogy, going from, for example, 10,000 pixels to 500 loses detail but not identity.

<!-- [PERSONAL EXPERIENCE] -->

BBQ applies the same trade to vectors. Most of the time the approximate score still ranks the right documents near the top. The accuracy you give up is small for most text workloads, and you pay for it with a lot less memory.

<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animated four-panel illustration of one portrait shown at 32-bit, 8-bit, 4-bit and 1-bit precision. The face stays recognisable at every level, which is the Mona Lisa analogy for BBQ." viewBox="0 0 760 330" width="100%" style="max-width:760px;height:auto" font-family="system-ui, sans-serif"><title>The Mona Lisa test: same image, fewer bits</title><style>.a1p{opacity:0;animation:a1in 12s infinite}.a1p0{animation-delay:0.0s}.a1p1{animation-delay:1.4s}.a1p2{animation-delay:2.8s}.a1p3{animation-delay:4.199999999999999s}@keyframes a1in{0%{opacity:0}6%,88%{opacity:1}96%,100%{opacity:0}}.a1ar{animation:a1pulse 3s infinite}@keyframes a1pulse{50%{opacity:.35}}@media (prefers-reduced-motion: reduce){*{animation:none!important}}.a1p{opacity:1}</style><rect width="760" height="330" rx="8" fill="#1e293b"/><text x="20" y="30" font-size="15" font-weight="700" fill="#e2e8f0">The Mona Lisa test: same picture, fewer bits</text><text x="20" y="50" font-size="12" fill="#94a3b8">Each panel keeps the same 24 x 24 grid. Only the precision of every value changes.</text><g class="a1p a1p0"><g transform="translate(24.0 70) scale(6.2)" shape-rendering="crispEdges"><path fill="#c0c0c9" d="M0 0h24v1h-24z"/><path fill="#bdbdc6" d="M0 1h10v1h-10zM14 1h10v1h-10z"/><path fill="#2f2f31" d="M10 1h4v1h-4zM8 2h8v1h-8zM7 3h10v1h-10zM7 4h3v1h-3zM14 4h3v1h-3zM6 5h3v1h-3zM15 5h3v1h-3zM6 6h2v1h-2zM16 6h2v1h-2zM6 7h2v1h-2zM16 7h2v1h-2zM6 8h2v1h-2zM16 8h2v1h-2zM6 9h2v1h-2zM16 9h2v1h-2zM6 10h2v1h-2zM16 10h2v1h-2zM6 11h2v1h-2zM16 11h2v1h-2zM7 12h2v1h-2zM15 12h2v1h-2zM8 13h2v1h-2zM14 13h2v1h-2zM9 14h1v1h-1zM14 14h1v1h-1z"/><path fill="#bbbbc4" d="M0 2h8v1h-8zM16 2h8v1h-8z"/><path fill="#b9b9c2" d="M0 3h7v1h-7zM17 3h7v1h-7z"/><path fill="#b7b7c0" d="M0 4h7v1h-7zM17 4h7v1h-7z"/><path fill="#c5c5ce" d="M10 4h4v1h-4zM9 5h6v1h-6zM8 6h8v1h-8zM8 7h8v1h-8zM8 8h2v1h-2zM11 8h2v1h-2zM14 8h2v1h-2zM8 9h8v1h-8zM8 10h8v1h-8zM8 11h3v1h-3zM13 11h3v1h-3zM9 12h6v1h-6z"/><path fill="#b4b4bd" d="M0 5h6v1h-6zM18 5h6v1h-6zM10 13h4v1h-4zM10 14h4v1h-4zM10 15h4v1h-4zM10 16h4v1h-4zM10 17h4v1h-4z"/><path fill="#b2b2ba" d="M0 6h6v1h-6zM18 6h6v1h-6zM18 11h1v1h-1z"/><path fill="#b0b0b8" d="M0 7h6v1h-6zM18 7h6v1h-6zM1 11h1v1h-1z"/><path fill="#adadb5" d="M0 8h6v1h-6zM18 8h6v1h-6z"/><path fill="#333335" d="M10 8h1v1h-1zM13 8h1v1h-1z"/><path fill="#acacb4" d="M0 9h6v1h-6zM18 9h6v1h-6z"/><path fill="#a9a9b1" d="M0 10h6v1h-6zM18 10h6v1h-6z"/><path fill="#aaaab2" d="M0 11h1v1h-1z"/><path fill="#b5b5be" d="M2 11h1v1h-1zM22 11h1v1h-1z"/><path fill="#b8b8c1" d="M3 11h1v1h-1zM4 11h1v1h-1zM20 11h2v1h-2z"/><path fill="#b6b6bf" d="M5 11h1v1h-1zM19 11h1v1h-1z"/><path fill="#555559" d="M11 11h2v1h-2z"/><path fill="#b1b1b9" d="M23 11h1v1h-1z"/><path fill="#8b8b91" d="M0 12h1v1h-1zM3 12h1v1h-1zM0 13h1v1h-1zM3 13h1v1h-1zM0 14h1v1h-1zM3 14h1v1h-1zM0 15h1v1h-1zM3 15h1v1h-1zM0 16h1v1h-1zM3 16h1v1h-1zM0 17h1v1h-1zM0 18h1v1h-1z"/><path fill="#8d8d94" d="M1 12h2v1h-2zM23 12h1v1h-1zM1 13h2v1h-2zM23 13h1v1h-1zM1 14h2v1h-2zM23 14h1v1h-1zM1 15h2v1h-2zM23 15h1v1h-1zM1 16h2v1h-2zM23 16h1v1h-1zM1 17h2v1h-2zM23 17h1v1h-1zM1 18h2v1h-2zM23 18h1v1h-1z"/><path fill="#87878d" d="M4 12h1v1h-1zM4 13h1v1h-1zM4 14h1v1h-1zM4 15h1v1h-1zM4 16h1v1h-1z"/><path fill="#818187" d="M5 12h1v1h-1zM5 13h1v1h-1zM5 14h1v1h-1zM5 15h1v1h-1zM5 16h1v1h-1z"/><path fill="#7a7a80" d="M6 12h1v1h-1zM6 13h1v1h-1zM6 14h1v1h-1zM6 15h1v1h-1zM6 16h1v1h-1z"/><path fill="#6f6f74" d="M17 12h1v1h-1zM17 13h1v1h-1zM17 14h1v1h-1zM17 15h1v1h-1zM17 16h1v1h-1z"/><path fill="#77777c" d="M18 12h1v1h-1zM18 13h1v1h-1zM18 14h1v1h-1zM18 15h1v1h-1zM18 16h1v1h-1z"/><path fill="#7d7d83" d="M19 12h1v1h-1zM19 13h1v1h-1zM19 14h1v1h-1zM19 15h1v1h-1zM19 16h1v1h-1z"/><path fill="#84848a" d="M20 12h1v1h-1zM20 13h1v1h-1zM20 14h1v1h-1zM20 15h1v1h-1zM20 16h1v1h-1z"/><path fill="#89898f" d="M21 12h1v1h-1zM21 13h1v1h-1zM21 14h1v1h-1zM21 15h1v1h-1zM21 16h1v1h-1zM21 17h1v1h-1zM21 18h1v1h-1z"/><path fill="#8c8c93" d="M22 12h1v1h-1zM22 13h1v1h-1zM22 14h1v1h-1zM22 15h1v1h-1zM22 16h1v1h-1zM22 17h1v1h-1zM22 18h1v1h-1z"/><path fill="#727277" d="M7 13h1v1h-1zM7 14h1v1h-1zM7 15h1v1h-1zM7 16h1v1h-1z"/><path fill="#67676c" d="M16 13h1v1h-1zM16 14h1v1h-1zM16 15h1v1h-1zM16 16h1v1h-1z"/><path fill="#6b6b70" d="M8 14h1v1h-1zM8 15h1v1h-1zM8 16h1v1h-1z"/><path fill="#626266" d="M15 14h1v1h-1zM15 15h1v1h-1zM15 16h1v1h-1z"/><path fill="#646469" d="M9 15h1v1h-1zM9 16h1v1h-1z"/><path fill="#5c5c60" d="M14 15h1v1h-1zM14 16h1v1h-1z"/><path fill="#404043" d="M3 17h7v1h-7zM14 17h7v1h-7zM3 18h18v1h-18zM0 19h24v1h-24zM0 20h24v1h-24zM0 21h24v1h-24zM0 22h24v1h-24zM0 23h24v1h-24z"/></g><text x="98.4" y="240.8" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle">float32</text><text x="98.4" y="258.8" font-size="11" fill="#94a3b8" text-anchor="middle">32 bits per dimension</text><text x="98.4" y="274.8" font-size="11" fill="#94a3b8" text-anchor="middle">original</text></g><g class="a1p a1p1"><g transform="translate(194.8 70) scale(6.2)" shape-rendering="crispEdges"><path fill="#c0c0c9" d="M0 0h24v1h-24z"/><path fill="#bdbdc6" d="M0 1h10v1h-10zM14 1h10v1h-10z"/><path fill="#2f2f31" d="M10 1h4v1h-4zM8 2h8v1h-8zM7 3h10v1h-10zM7 4h3v1h-3zM14 4h3v1h-3zM6 5h3v1h-3zM15 5h3v1h-3zM6 6h2v1h-2zM16 6h2v1h-2zM6 7h2v1h-2zM16 7h2v1h-2zM6 8h2v1h-2zM16 8h2v1h-2zM6 9h2v1h-2zM16 9h2v1h-2zM6 10h2v1h-2zM16 10h2v1h-2zM6 11h2v1h-2zM16 11h2v1h-2zM7 12h2v1h-2zM15 12h2v1h-2zM8 13h2v1h-2zM14 13h2v1h-2zM9 14h1v1h-1zM14 14h1v1h-1z"/><path fill="#bbbbc4" d="M0 2h8v1h-8zM16 2h8v1h-8z"/><path fill="#b9b9c2" d="M0 3h7v1h-7zM17 3h7v1h-7z"/><path fill="#b7b7c0" d="M0 4h7v1h-7zM17 4h7v1h-7z"/><path fill="#c5c5ce" d="M10 4h4v1h-4zM9 5h6v1h-6zM8 6h8v1h-8zM8 7h8v1h-8zM8 8h2v1h-2zM11 8h2v1h-2zM14 8h2v1h-2zM8 9h8v1h-8zM8 10h8v1h-8zM8 11h3v1h-3zM13 11h3v1h-3zM9 12h6v1h-6z"/><path fill="#b4b4bd" d="M0 5h6v1h-6zM18 5h6v1h-6zM10 13h4v1h-4zM10 14h4v1h-4zM10 15h4v1h-4zM10 16h4v1h-4zM10 17h4v1h-4z"/><path fill="#b2b2ba" d="M0 6h6v1h-6zM18 6h6v1h-6zM18 11h1v1h-1z"/><path fill="#b0b0b8" d="M0 7h6v1h-6zM18 7h6v1h-6zM1 11h1v1h-1z"/><path fill="#adadb5" d="M0 8h6v1h-6zM18 8h6v1h-6z"/><path fill="#333335" d="M10 8h1v1h-1zM13 8h1v1h-1z"/><path fill="#acacb4" d="M0 9h6v1h-6zM18 9h6v1h-6z"/><path fill="#a9a9b1" d="M0 10h6v1h-6zM18 10h6v1h-6z"/><path fill="#aaaab2" d="M0 11h1v1h-1z"/><path fill="#b5b5be" d="M2 11h1v1h-1zM22 11h1v1h-1z"/><path fill="#b8b8c1" d="M3 11h1v1h-1zM4 11h1v1h-1zM20 11h2v1h-2z"/><path fill="#b6b6bf" d="M5 11h1v1h-1zM19 11h1v1h-1z"/><path fill="#555559" d="M11 11h2v1h-2z"/><path fill="#b1b1b9" d="M23 11h1v1h-1z"/><path fill="#8b8b91" d="M0 12h1v1h-1zM3 12h1v1h-1zM0 13h1v1h-1zM3 13h1v1h-1zM0 14h1v1h-1zM3 14h1v1h-1zM0 15h1v1h-1zM3 15h1v1h-1zM0 16h1v1h-1zM3 16h1v1h-1zM0 17h1v1h-1zM0 18h1v1h-1z"/><path fill="#8d8d94" d="M1 12h2v1h-2zM23 12h1v1h-1zM1 13h2v1h-2zM23 13h1v1h-1zM1 14h2v1h-2zM23 14h1v1h-1zM1 15h2v1h-2zM23 15h1v1h-1zM1 16h2v1h-2zM23 16h1v1h-1zM1 17h2v1h-2zM23 17h1v1h-1zM1 18h2v1h-2zM23 18h1v1h-1z"/><path fill="#87878d" d="M4 12h1v1h-1zM4 13h1v1h-1zM4 14h1v1h-1zM4 15h1v1h-1zM4 16h1v1h-1z"/><path fill="#818187" d="M5 12h1v1h-1zM5 13h1v1h-1zM5 14h1v1h-1zM5 15h1v1h-1zM5 16h1v1h-1z"/><path fill="#7a7a80" d="M6 12h1v1h-1zM6 13h1v1h-1zM6 14h1v1h-1zM6 15h1v1h-1zM6 16h1v1h-1z"/><path fill="#6f6f74" d="M17 12h1v1h-1zM17 13h1v1h-1zM17 14h1v1h-1zM17 15h1v1h-1zM17 16h1v1h-1z"/><path fill="#77777c" d="M18 12h1v1h-1zM18 13h1v1h-1zM18 14h1v1h-1zM18 15h1v1h-1zM18 16h1v1h-1z"/><path fill="#7d7d83" d="M19 12h1v1h-1zM19 13h1v1h-1zM19 14h1v1h-1zM19 15h1v1h-1zM19 16h1v1h-1z"/><path fill="#84848a" d="M20 12h1v1h-1zM20 13h1v1h-1zM20 14h1v1h-1zM20 15h1v1h-1zM20 16h1v1h-1z"/><path fill="#89898f" d="M21 12h1v1h-1zM21 13h1v1h-1zM21 14h1v1h-1zM21 15h1v1h-1zM21 16h1v1h-1zM21 17h1v1h-1zM21 18h1v1h-1z"/><path fill="#8c8c93" d="M22 12h1v1h-1zM22 13h1v1h-1zM22 14h1v1h-1zM22 15h1v1h-1zM22 16h1v1h-1zM22 17h1v1h-1zM22 18h1v1h-1z"/><path fill="#727277" d="M7 13h1v1h-1zM7 14h1v1h-1zM7 15h1v1h-1zM7 16h1v1h-1z"/><path fill="#67676c" d="M16 13h1v1h-1zM16 14h1v1h-1zM16 15h1v1h-1zM16 16h1v1h-1z"/><path fill="#6b6b70" d="M8 14h1v1h-1zM8 15h1v1h-1zM8 16h1v1h-1z"/><path fill="#626266" d="M15 14h1v1h-1zM15 15h1v1h-1zM15 16h1v1h-1z"/><path fill="#646469" d="M9 15h1v1h-1zM9 16h1v1h-1z"/><path fill="#5c5c60" d="M14 15h1v1h-1zM14 16h1v1h-1z"/><path fill="#404043" d="M3 17h7v1h-7zM14 17h7v1h-7zM3 18h18v1h-18zM0 19h24v1h-24zM0 20h24v1h-24zM0 21h24v1h-24zM0 22h24v1h-24zM0 23h24v1h-24z"/></g><text x="269.20000000000005" y="240.8" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle">int8</text><text x="269.20000000000005" y="258.8" font-size="11" fill="#94a3b8" text-anchor="middle">8 bits</text><text x="269.20000000000005" y="274.8" font-size="11" fill="#94a3b8" text-anchor="middle">about 4x smaller</text></g><g class="a1p a1p2"><g transform="translate(365.6 70) scale(6.2)" shape-rendering="crispEdges"><path fill="#c5c5ce" d="M0 0h24v1h-24zM10 4h4v1h-4zM9 5h6v1h-6zM8 6h8v1h-8zM8 7h8v1h-8zM8 8h2v1h-2zM11 8h2v1h-2zM14 8h2v1h-2zM8 9h8v1h-8zM8 10h8v1h-8zM8 11h3v1h-3zM13 11h3v1h-3zM9 12h6v1h-6z"/><path fill="#b7b7c0" d="M0 1h10v1h-10zM14 1h10v1h-10zM0 2h8v1h-8zM16 2h8v1h-8zM0 3h7v1h-7zM17 3h7v1h-7zM0 4h7v1h-7zM17 4h7v1h-7zM0 5h6v1h-6zM18 5h6v1h-6zM0 6h6v1h-6zM18 6h6v1h-6zM0 7h6v1h-6zM18 7h6v1h-6zM1 11h5v1h-5zM18 11h6v1h-6zM10 13h4v1h-4zM10 14h4v1h-4zM10 15h4v1h-4zM10 16h4v1h-4zM10 17h4v1h-4z"/><path fill="#363638" d="M10 1h4v1h-4zM8 2h8v1h-8zM7 3h10v1h-10zM7 4h3v1h-3zM14 4h3v1h-3zM6 5h3v1h-3zM15 5h3v1h-3zM6 6h2v1h-2zM16 6h2v1h-2zM6 7h2v1h-2zM16 7h2v1h-2zM6 8h2v1h-2zM10 8h1v1h-1zM13 8h1v1h-1zM16 8h2v1h-2zM6 9h2v1h-2zM16 9h2v1h-2zM6 10h2v1h-2zM16 10h2v1h-2zM6 11h2v1h-2zM16 11h2v1h-2zM7 12h2v1h-2zM15 12h2v1h-2zM8 13h2v1h-2zM14 13h2v1h-2zM9 14h1v1h-1zM14 14h1v1h-1z"/><path fill="#a8a8b0" d="M0 8h6v1h-6zM18 8h6v1h-6zM0 9h6v1h-6zM18 9h6v1h-6zM0 10h6v1h-6zM18 10h6v1h-6zM0 11h1v1h-1z"/><path fill="#525256" d="M11 11h2v1h-2z"/><path fill="#8c8c93" d="M0 12h5v1h-5zM21 12h3v1h-3zM0 13h5v1h-5zM21 13h3v1h-3zM0 14h5v1h-5zM21 14h3v1h-3zM0 15h5v1h-5zM21 15h3v1h-3zM0 16h5v1h-5zM21 16h3v1h-3zM0 17h3v1h-3zM21 17h3v1h-3zM0 18h3v1h-3zM21 18h3v1h-3z"/><path fill="#7d7d83" d="M5 12h2v1h-2zM18 12h3v1h-3zM5 13h2v1h-2zM18 13h3v1h-3zM5 14h2v1h-2zM18 14h3v1h-3zM5 15h2v1h-2zM18 15h3v1h-3zM5 16h2v1h-2zM18 16h3v1h-3z"/><path fill="#6f6f74" d="M17 12h1v1h-1zM7 13h1v1h-1zM17 13h1v1h-1zM7 14h2v1h-2zM17 14h1v1h-1zM7 15h2v1h-2zM17 15h1v1h-1zM7 16h2v1h-2zM17 16h1v1h-1z"/><path fill="#616165" d="M16 13h1v1h-1zM15 14h2v1h-2zM9 15h1v1h-1zM14 15h3v1h-3zM9 16h1v1h-1zM14 16h3v1h-3z"/><path fill="#444447" d="M3 17h7v1h-7zM14 17h7v1h-7zM3 18h18v1h-18zM0 19h24v1h-24zM0 20h24v1h-24zM0 21h24v1h-24zM0 22h24v1h-24zM0 23h24v1h-24z"/></g><text x="440.0" y="240.8" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle">int4</text><text x="440.0" y="258.8" font-size="11" fill="#94a3b8" text-anchor="middle">4 bits</text><text x="440.0" y="274.8" font-size="11" fill="#94a3b8" text-anchor="middle">about 8x smaller</text></g><g class="a1p a1p3"><g transform="translate(536.4000000000001 70) scale(6.2)" shape-rendering="crispEdges"><path fill="#f0f0fc" d="M0 0h24v1h-24zM0 1h10v1h-10zM14 1h10v1h-10zM0 2h8v1h-8zM16 2h8v1h-8zM0 3h7v1h-7zM17 3h7v1h-7zM0 4h7v1h-7zM10 4h4v1h-4zM17 4h7v1h-7zM0 5h6v1h-6zM9 5h6v1h-6zM18 5h6v1h-6zM0 6h6v1h-6zM8 6h8v1h-8zM18 6h6v1h-6zM0 7h6v1h-6zM8 7h8v1h-8zM18 7h6v1h-6zM0 8h6v1h-6zM8 8h2v1h-2zM11 8h2v1h-2zM14 8h2v1h-2zM18 8h6v1h-6zM0 9h6v1h-6zM8 9h8v1h-8zM18 9h6v1h-6zM0 10h6v1h-6zM8 10h8v1h-8zM18 10h6v1h-6zM0 11h6v1h-6zM8 11h3v1h-3zM13 11h3v1h-3zM18 11h6v1h-6zM0 12h6v1h-6zM9 12h6v1h-6zM20 12h4v1h-4zM0 13h6v1h-6zM10 13h4v1h-4zM20 13h4v1h-4zM0 14h6v1h-6zM10 14h4v1h-4zM20 14h4v1h-4zM0 15h6v1h-6zM10 15h4v1h-4zM20 15h4v1h-4zM0 16h6v1h-6zM10 16h4v1h-4zM20 16h4v1h-4zM0 17h3v1h-3zM10 17h4v1h-4zM21 17h3v1h-3zM0 18h3v1h-3zM21 18h3v1h-3z"/><path fill="#19191a" d="M10 1h4v1h-4zM8 2h8v1h-8zM7 3h10v1h-10zM7 4h3v1h-3zM14 4h3v1h-3zM6 5h3v1h-3zM15 5h3v1h-3zM6 6h2v1h-2zM16 6h2v1h-2zM6 7h2v1h-2zM16 7h2v1h-2zM6 8h2v1h-2zM10 8h1v1h-1zM13 8h1v1h-1zM16 8h2v1h-2zM6 9h2v1h-2zM16 9h2v1h-2zM6 10h2v1h-2zM16 10h2v1h-2zM6 11h2v1h-2zM11 11h2v1h-2zM16 11h2v1h-2zM6 12h3v1h-3zM15 12h5v1h-5zM6 13h4v1h-4zM14 13h6v1h-6zM6 14h4v1h-4zM14 14h6v1h-6zM6 15h4v1h-4zM14 15h6v1h-6zM6 16h4v1h-4zM14 16h6v1h-6zM3 17h7v1h-7zM14 17h7v1h-7zM3 18h18v1h-18zM0 19h24v1h-24zM0 20h24v1h-24zM0 21h24v1h-24zM0 22h24v1h-24zM0 23h24v1h-24z"/></g><text x="610.8000000000001" y="240.8" font-size="14" font-weight="700" fill="#00BFB3" text-anchor="middle">bbq</text><text x="610.8000000000001" y="258.8" font-size="11" fill="#94a3b8" text-anchor="middle">1 bit</text><text x="610.8000000000001" y="274.8" font-size="11" fill="#94a3b8" text-anchor="middle">about 32x smaller</text></g><text x="20" y="318" font-size="10" fill="#64748b">Illustration only: a procedurally drawn portrait, not a measurement. The 1-bit panel thresholds around the mean, as BBQ does around a centroid.</text></svg>

The panels above keep the grid size fixed. Only the precision of each value changes. That matches what BBQ does: the vector keeps all of its dimensions, and each dimension shrinks from 32 bits to 1.

<!-- [UNIQUE INSIGHT] -->

In conversation, BBQ is often described as "reducing the dimensions". The docs say otherwise: it "retains the original vector's dimensionality" and changes the datatype of each dimension ([Elastic docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/bbq)). The vector count and the dimension count stay the same. Only the bits per dimension drop.

---

## Vector Quantization at Index Time and Query Time

BBQ rests on four ideas.

1. **Centre, then keep one bit.** Vectors are normalised around a centroid, and each value becomes a single bit: above the centre or below it. Elastic's engineering write-up describes this centroid step ([Search Labs](https://www.elastic.co/search-labs/blog/better-binary-quantization-lucene-elasticsearch)).
2. **Corrective factors.** Each vector stores 14 extra bytes. Elasticsearch uses them as partial distance calculations to claw back accuracy ([Elastic docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/bbq)).
3. **Asymmetric precision.** Indexed vectors get 1 bit per dimension. The query vector gets 4 bits, so the comparison is sharper on the query side ([Elastic docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/bbq)).
4. **Oversample and rescore.** BBQ fields default to a 3x oversample. For `k: 10`, Elasticsearch fetches 30 candidates, then rescores them with the original float vectors and returns the best 10 ([Elastic docs](https://www.elastic.co/docs/solutions/search/vector/knn/optimize-performance-accuracy)).

<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animation of an 8-dimension vector. Eight float values are centred, then each is reduced to one bit. The query vector is kept at 4 bits per dimension, and the two are compared." viewBox="0 0 760 360" width="100%" style="max-width:760px;height:auto" font-family="system-ui, sans-serif"><title>From floats to bits: how one vector is stored</title><style>.a2f{animation:a2fade 10s infinite}.a2b{opacity:0;animation:a2show 10s infinite}.a2q{opacity:0;animation:a2show 10s infinite;animation-delay:.2s}.a2b0{animation-delay:2.0s}.a2b1{animation-delay:2.3s}.a2b2{animation-delay:2.6s}.a2b3{animation-delay:2.9s}.a2b4{animation-delay:3.2s}.a2b5{animation-delay:3.5s}.a2b6{animation-delay:3.8s}.a2b7{animation-delay:4.1s}@keyframes a2fade{0%,20%{opacity:1}35%,92%{opacity:.35}100%{opacity:1}}@keyframes a2show{0%,2%{opacity:0}12%,90%{opacity:1}98%,100%{opacity:0}}.a2sc{opacity:0;animation:a2show 10s infinite;animation-delay:5.4s}@media (prefers-reduced-motion: reduce){*{animation:none!important}}.a2b,.a2q,.a2sc{opacity:1}</style><rect width="760" height="360" rx="8" fill="#1e293b"/><text x="20" y="30" font-size="15" font-weight="700" fill="#e2e8f0">From floats to bits: one vector, two precisions</text><text x="20" y="50" font-size="12" fill="#94a3b8">Eight dimensions shown. Elasticsearch supports up to 4096.</text><text x="20" y="99" font-size="12" font-weight="600" fill="#e2e8f0">Stored: float32</text><text x="20" y="115" font-size="10" fill="#94a3b8">32 bits x 8 = 32 bytes</text><g class="a2f"><rect x="130" y="72" width="68" height="34" rx="5" fill="#334155"/><text x="164.0" y="94" font-size="13" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">+0.42</text><rect x="206" y="72" width="68" height="34" rx="5" fill="#334155"/><text x="240.0" y="94" font-size="13" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">-0.17</text><rect x="282" y="72" width="68" height="34" rx="5" fill="#334155"/><text x="316.0" y="94" font-size="13" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">-0.08</text><rect x="358" y="72" width="68" height="34" rx="5" fill="#334155"/><text x="392.0" y="94" font-size="13" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">-0.55</text><rect x="434" y="72" width="68" height="34" rx="5" fill="#334155"/><text x="468.0" y="94" font-size="13" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">+0.31</text><rect x="510" y="72" width="68" height="34" rx="5" fill="#334155"/><text x="544.0" y="94" font-size="13" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">+0.02</text><rect x="586" y="72" width="68" height="34" rx="5" fill="#334155"/><text x="620.0" y="94" font-size="13" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">+0.66</text><rect x="662" y="72" width="68" height="34" rx="5" fill="#334155"/><text x="696.0" y="94" font-size="13" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">-0.29</text></g><text x="380.0" y="136" font-size="11" fill="#FEC514" text-anchor="middle">centre on the mean, keep only the side: above (1) or below (0)</text><text x="20" y="184" font-size="12" font-weight="600" fill="#e2e8f0">Stored: bbq</text><text x="20" y="200" font-size="10" fill="#94a3b8">1 bit x 8 = 1 byte + 14 B</text><g class="a2b a2b0"><rect x="130" y="157" width="68" height="34" rx="5" fill="#00BFB3"/><text x="164.0" y="180" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle" font-family="ui-monospace,monospace">1</text></g><g class="a2b a2b1"><rect x="206" y="157" width="68" height="34" rx="5" fill="#475569"/><text x="240.0" y="180" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle" font-family="ui-monospace,monospace">0</text></g><g class="a2b a2b2"><rect x="282" y="157" width="68" height="34" rx="5" fill="#475569"/><text x="316.0" y="180" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle" font-family="ui-monospace,monospace">0</text></g><g class="a2b a2b3"><rect x="358" y="157" width="68" height="34" rx="5" fill="#475569"/><text x="392.0" y="180" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle" font-family="ui-monospace,monospace">0</text></g><g class="a2b a2b4"><rect x="434" y="157" width="68" height="34" rx="5" fill="#00BFB3"/><text x="468.0" y="180" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle" font-family="ui-monospace,monospace">1</text></g><g class="a2b a2b5"><rect x="510" y="157" width="68" height="34" rx="5" fill="#00BFB3"/><text x="544.0" y="180" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle" font-family="ui-monospace,monospace">1</text></g><g class="a2b a2b6"><rect x="586" y="157" width="68" height="34" rx="5" fill="#00BFB3"/><text x="620.0" y="180" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle" font-family="ui-monospace,monospace">1</text></g><g class="a2b a2b7"><rect x="662" y="157" width="68" height="34" rx="5" fill="#475569"/><text x="696.0" y="180" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle" font-family="ui-monospace,monospace">0</text></g><text x="20" y="254" font-size="12" font-weight="600" fill="#e2e8f0">Query: 4 bits</text><text x="20" y="270" font-size="10" fill="#94a3b8">kept sharper on purpose</text><g class="a2q"><rect x="130" y="227" width="68" height="34" rx="5" fill="#0077CC"/><text x="164.0" y="250" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">11</text></g><g class="a2q"><rect x="206" y="227" width="68" height="34" rx="5" fill="#0077CC"/><text x="240.0" y="250" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace"> 4</text></g><g class="a2q"><rect x="282" y="227" width="68" height="34" rx="5" fill="#0077CC"/><text x="316.0" y="250" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace"> 6</text></g><g class="a2q"><rect x="358" y="227" width="68" height="34" rx="5" fill="#0077CC"/><text x="392.0" y="250" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace"> 2</text></g><g class="a2q"><rect x="434" y="227" width="68" height="34" rx="5" fill="#0077CC"/><text x="468.0" y="250" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace"> 9</text></g><g class="a2q"><rect x="510" y="227" width="68" height="34" rx="5" fill="#0077CC"/><text x="544.0" y="250" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace"> 8</text></g><g class="a2q"><rect x="586" y="227" width="68" height="34" rx="5" fill="#0077CC"/><text x="620.0" y="250" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace">13</text></g><g class="a2q"><rect x="662" y="227" width="68" height="34" rx="5" fill="#0077CC"/><text x="696.0" y="250" font-size="14" font-weight="700" fill="#e2e8f0" text-anchor="middle" font-family="ui-monospace,monospace"> 5</text></g><g class="a2sc"><rect x="130" y="290" width="600" height="44" rx="8" fill="none" stroke="#F04E98" stroke-width="1.5" stroke-dasharray="5 4"/><text x="430.0" y="310" font-size="12" font-weight="600" fill="#e2e8f0" text-anchor="middle">Score the stored bits against the 4-bit query,</text><text x="430.0" y="326" font-size="12" fill="#94a3b8" text-anchor="middle">then apply the stored corrective factors</text></g></svg>

<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animated pipeline: a kNN query scans quantized vectors, keeps k times oversample candidates, rescores those with the original float vectors, and returns the top k." viewBox="0 0 760 250" width="100%" style="max-width:760px;height:auto" font-family="system-ui, sans-serif"><title>Query path: scan cheap, rescore precise</title><style>.a3s0{animation:a3p 8s infinite;animation-delay:0.0s}.a3s1{animation:a3p 8s infinite;animation-delay:1.6s}.a3s2{animation:a3p 8s infinite;animation-delay:3.2s}.a3s3{animation:a3p 8s infinite;animation-delay:4.800000000000001s}@keyframes a3p{0%{opacity:.35}6%,22%{opacity:1}30%,100%{opacity:.35}}@media (prefers-reduced-motion: reduce){*{animation:none!important}}.a3s0,.a3s1,.a3s2,.a3s3{opacity:1}</style><rect width="760" height="250" rx="8" fill="#1e293b"/><text x="20" y="30" font-size="15" font-weight="700" fill="#e2e8f0">Query path: scan cheap, rescore precise</text><text x="20" y="50" font-size="12" fill="#94a3b8">Example: k = 10 with the default 3x oversample.</text><g class="a3s0"><rect x="20" y="80" width="158" height="100" rx="10" fill="#0f172a" stroke="#00BFB3" stroke-width="2"/><text x="99.0" y="122" font-size="13" font-weight="700" fill="#e2e8f0" text-anchor="middle">1. Search quantized</text><text x="99.0" y="146" font-size="11" fill="#94a3b8" text-anchor="middle">1-bit vectors in RAM</text></g><text x="193.0" y="136" font-size="20" fill="#94a3b8" text-anchor="middle">&#8594;</text><g class="a3s1"><rect x="208" y="80" width="158" height="100" rx="10" fill="#0f172a" stroke="#0077CC" stroke-width="2"/><text x="287.0" y="122" font-size="13" font-weight="700" fill="#e2e8f0" text-anchor="middle">2. Keep 30 candidates</text><text x="287.0" y="146" font-size="11" fill="#94a3b8" text-anchor="middle">k x oversample = 10 x 3</text></g><text x="381.0" y="136" font-size="20" fill="#94a3b8" text-anchor="middle">&#8594;</text><g class="a3s2"><rect x="396" y="80" width="158" height="100" rx="10" fill="#0f172a" stroke="#F04E98" stroke-width="2"/><text x="475.0" y="122" font-size="13" font-weight="700" fill="#e2e8f0" text-anchor="middle">3. Rescore with floats</text><text x="475.0" y="146" font-size="11" fill="#94a3b8" text-anchor="middle">raw vectors, read from disk</text></g><text x="569.0" y="136" font-size="20" fill="#94a3b8" text-anchor="middle">&#8594;</text><g class="a3s3"><rect x="584" y="80" width="158" height="100" rx="10" fill="#0f172a" stroke="#FEC514" stroke-width="2"/><text x="663.0" y="122" font-size="13" font-weight="700" fill="#e2e8f0" text-anchor="middle">4. Return top 10</text><text x="663.0" y="146" font-size="11" fill="#94a3b8" text-anchor="middle">best k after rescoring</text></g><text x="20" y="216" font-size="11" fill="#94a3b8">Raising oversample trades a little latency for recall. The test below measures how much.</text></svg>

Cheaper comparisons also mean HNSW can consider more candidates for the same compute. The docs say so directly: "much less computing effort, allowing more candidates to be considered" ([Elastic docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/bbq)).

The size of a BBQ vector follows `ceil(dims / 64) x 8 + 14` bytes ([tuning docs](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/approximate-knn-search)). For 768 dimensions that is 110 bytes. Across 100,000 vectors it is 11.0 MB, which is the `.veb` file the test produced.

---

## How Do Seven Formats Compare on RAM, Disk and Recall?

Elasticsearch has a ladder of `index_options.type` values on `dense_vector`. The `flat` variants search by brute force. The `hnsw` variants add a graph. `bbq_disk` uses a different index structure altogether.

| Type | Stored precision | Quantized bytes per vector (768 dims) | Search structure | Docs guidance |
|---|---|---|---|---|
| `hnsw` | float32 | 3,072 | HNSW graph | Baseline, no quantization |
| `int8_hnsw` | 8 bits | 784 | HNSW graph | High accuracy retention, lower compression |
| `int4_hnsw` | 4 bits | 400 | HNSW graph | Balance of compression and accuracy |
| `bbq_hnsw` | 1 bit | 110 | HNSW graph | Most production use, default for 384+ dims |
| `bbq_flat` | 1 bit | 110 | Brute force | Smaller datasets that need maximum accuracy |
| `bbq_disk` | 1 bit (default) | 110 plus cluster overhead | Clustered, read from disk | Large datasets with constrained RAM |

Bytes follow the formulas in the [tuning docs](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/approximate-knn-search): int8 is `dims + 16`, int4 is `ceil(dims / 2) + 16`. The guidance column paraphrases the [vector storage docs](https://www.elastic.co/docs/solutions/search/vector/vector-storage-for-semantic-search).

Two things changed over the 9.x line. Since 9.1, float vectors of 384 or more dimensions default to `bbq_hnsw`, and below that to `int8_hnsw`. From 9.4, the docs state the default is `bbq_disk` when the licence allows it ([dense_vector docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector)). The docs disagree on one detail: the BBQ page lists a default of 1 bit for `bbq_disk`, while the optimization page says the default uses 4-bit quantization below 384 dimensions ([optimization docs](https://www.elastic.co/docs/solutions/search/vector/knn/optimize-performance-accuracy)). Check your mapping. The year-by-year history is in [BBQ and DiskBBQ: How Elasticsearch Compresses Vectors](/blog/elasticsearch-bbq-diskbbq-vector-search). This post stays on the mechanics and the measurements.

### DiskBBQ and the `vectordb_document` mode

`bbq_disk` is not HNSW. It groups vectors into clusters with hierarchical k-means, finds the nearest centroids for a query, and compares only the vectors in those clusters. Its docs say it "typically performs well for recall levels up to around 95%", and that for very high recall (99% or higher) HNSW-based formats deliver better performance, depending on memory availability ([Elastic docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/bbq)). It needs an Enterprise subscription.

Elasticsearch 9.5 added the `vectordb_document` index mode. It is set at index creation, cannot change later, and defaults the vector `element_type` to `bfloat16`, which halves the raw vector storage ([dense_vector docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector)). The 9.5 changes are covered in [What's New in Elasticsearch 9.5](/blog/elasticsearch-whats-new-9-5).

---

## How Was BBQ Validated on a Small Dataset?

The setup is deliberately small. For the wider platform context, see [Elasticsearch AI: Vector Search, RAG, and Agent Builder](/blog/elasticsearch-ai-platform). A single-node Elasticsearch 9.5.6 container, trial licence, one index per format, one shard, no replicas, force-merged to a single segment. The data is 100,000 synthetic 768-dimension vectors drawn from 200 clusters, plus 200 query vectors. Ground truth is exact cosine nearest neighbours computed in NumPy.

```bash
docker run -d --name bbq-lab -p 9200:9200 -m 6g \
  -e discovery.type=single-node -e xpack.security.enabled=false \
  -e xpack.license.self_generated.type=trial \
  -e ES_JAVA_OPTS="-Xms2g -Xmx2g" \
  docker.elastic.co/elasticsearch/elasticsearch:9.5.6
```

Every index differs in one line, the `index_options.type`:

```console
PUT bbq-lab-bbq-hnsw
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "refresh_interval": "-1",
    "index.compound_format": false
  },
  "mappings": {
    "properties": {
      "vec": {
        "type": "dense_vector",
        "dims": 768,
        "similarity": "cosine",
        "index_options": { "type": "bbq_hnsw" }
      }
    }
  }
}
```

The `vectordb_document` index drops `index_options` and sets the index mode instead. Compound files were disabled in every index so each format's files could be measured separately.

```console
PUT bbq-lab-vectordb-document
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "refresh_interval": "-1",
    "index.compound_format": false,
    "index.mode": "vectordb_document"
  },
  "mappings": {
    "properties": {
      "vec": { "type": "dense_vector", "dims": 768, "similarity": "cosine" }
    }
  }
}
```

The data, ground truth, bulk load and recall check fit in one script. It targets the `bbq-lab-bbq-hnsw` index above and needs `numpy` and `requests`:

```python
import numpy as np, requests, json

ES, INDEX, DIM, K = "http://localhost:9200", "bbq-lab-bbq-hnsw", 768, 10
rng = np.random.default_rng(42)
LAT, CL = 48, 200
centers = rng.normal(size=(CL, LAT))
proj = rng.normal(size=(LAT, DIM)) / np.sqrt(LAT)

def gen(n):
    c = rng.integers(0, CL, n)
    x = (centers[c] + 0.6 * rng.normal(size=(n, LAT))) @ proj + 0.15 * rng.normal(size=(n, DIM))
    return (x / np.linalg.norm(x, axis=1, keepdims=True)).astype(np.float32)

docs, queries = gen(100_000), gen(200)
truth = np.argsort(-(queries @ docs.T), axis=1)[:, :K]   # exact cosine neighbours

for i in range(0, len(docs), 2000):
    lines = []
    for j in range(i, min(i + 2000, len(docs))):
        lines += [json.dumps({"index": {"_id": str(j)}}), json.dumps({"vec": docs[j].tolist()})]
    requests.post(f"{ES}/{INDEX}/_bulk", data="\n".join(lines) + "\n",
                  headers={"Content-Type": "application/x-ndjson"}).raise_for_status()
requests.post(f"{ES}/{INDEX}/_refresh")
requests.post(f"{ES}/{INDEX}/_forcemerge?max_num_segments=1", timeout=3600)

def recall(oversample):
    hits = 0
    for qi, q in enumerate(queries):
        knn = {"field": "vec", "query_vector": q.tolist(), "k": K, "num_candidates": 100,
               "rescore_vector": {"oversample": oversample}}
        r = requests.post(f"{ES}/{INDEX}/_search", json={"knn": knn, "size": K, "_source": False}).json()
        hits += len({int(h["_id"]) for h in r["hits"]["hits"]} & set(truth[qi].tolist()))
    return hits / (len(queries) * K)

for o in (1.5, 3.0, 5.0, 10.0):
    print(o, recall(o))
```

Run the script against a freshly created index. Loading the same documents into an index that already holds them leaves deleted copies behind, and recall at 10x fell to 0.9265 in my test. On a clean index the script reproduced the sweep within 0.001.

Sizes came from the [analyze index disk usage API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-indices-disk-usage), and the RAM-resident figures from the `.veq`, `.veb` and `.vex` segment files:

```bash
curl -s -XPOST "localhost:9200/bbq-lab-bbq-hnsw/_disk_usage?run_expensive_tasks=true"
```

## Does BBQ Shrink the Index on Disk?

<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Grouped bar chart from the test: RAM needed for fast search versus total vector field size on disk for seven dense_vector formats on 100,000 vectors of 768 dimensions. BBQ formats need 11 to 25 megabytes of RAM against 311 for float32, while disk size stays near or above float32." viewBox="0 0 760 406" width="100%" style="max-width:760px;height:auto" font-family="system-ui, sans-serif"><title>Test result: RAM for fast search vs size on disk</title><style>.a4b{transform-origin:0 0;transform:scaleX(0);animation:a4g 1.4s ease-out forwards}.a4b0{animation-delay:0.0s}.a4b1{animation-delay:0.12s}.a4b2{animation-delay:0.24s}.a4b3{animation-delay:0.36s}.a4b4{animation-delay:0.48s}.a4b5{animation-delay:0.6s}.a4b6{animation-delay:0.72s}.a4b7{animation-delay:0.84s}.a4b8{animation-delay:0.96s}.a4b9{animation-delay:1.08s}.a4b10{animation-delay:1.2s}.a4b11{animation-delay:1.3199999999999998s}.a4b12{animation-delay:1.44s}.a4b13{animation-delay:1.56s}@keyframes a4g{to{transform:scaleX(1)}}@media (prefers-reduced-motion: reduce){*{animation:none!important}}.a4b{transform:none}</style><rect width="760" height="406" rx="8" fill="#1e293b"/><text x="20" y="30" font-size="15" font-weight="700" fill="#e2e8f0">RAM for fast search vs size on disk (MB)</text><text x="20" y="50" font-size="12" fill="#94a3b8">100,000 vectors x 768 dims, Elasticsearch 9.5.6. Lower is better for RAM.</text><text x="165" y="86" font-size="12" fill="#e2e8f0" text-anchor="end">hnsw (float32)</text><rect class="a4b a4b0" x="175" y="72" width="326.55" height="14" rx="3" fill="#00BFB3"/><text x="507.55" y="83" font-size="11" fill="#e2e8f0">311 RAM</text><rect class="a4b a4b1" x="175" y="89" width="326.55" height="12" rx="3" fill="#64748b"/><text x="507.55" y="99" font-size="11" fill="#94a3b8">311 disk</text><text x="165" y="124" font-size="12" fill="#e2e8f0" text-anchor="end">int8_hnsw</text><rect class="a4b a4b2" x="175" y="110" width="87.15" height="14" rx="3" fill="#00BFB3"/><text x="268.15" y="121" font-size="11" fill="#e2e8f0">83 RAM</text><rect class="a4b a4b3" x="175" y="127" width="409.5" height="12" rx="3" fill="#64748b"/><text x="590.5" y="137" font-size="11" fill="#94a3b8">390 disk</text><text x="165" y="162" font-size="12" fill="#e2e8f0" text-anchor="end">int4_hnsw</text><rect class="a4b a4b4" x="175" y="148" width="46.2" height="14" rx="3" fill="#00BFB3"/><text x="227.2" y="159" font-size="11" fill="#e2e8f0">44 RAM</text><rect class="a4b a4b5" x="175" y="165" width="368.55" height="12" rx="3" fill="#64748b"/><text x="549.55" y="175" font-size="11" fill="#94a3b8">351 disk</text><text x="165" y="200" font-size="12" fill="#e2e8f0" text-anchor="end">bbq_hnsw</text><rect class="a4b a4b6" x="175" y="186" width="15.75" height="14" rx="3" fill="#00BFB3"/><text x="196.75" y="197" font-size="11" fill="#e2e8f0">15 RAM</text><rect class="a4b a4b7" x="175" y="203" width="338.1" height="12" rx="3" fill="#64748b"/><text x="519.1" y="213" font-size="11" fill="#94a3b8">322 disk</text><text x="165" y="238" font-size="12" fill="#e2e8f0" text-anchor="end">bbq_flat</text><rect class="a4b a4b8" x="175" y="224" width="11.55" height="14" rx="3" fill="#00BFB3"/><text x="192.55" y="235" font-size="11" fill="#e2e8f0">11 RAM</text><rect class="a4b a4b9" x="175" y="241" width="333.90000000000003" height="12" rx="3" fill="#64748b"/><text x="514.9000000000001" y="251" font-size="11" fill="#94a3b8">318 disk</text><text x="165" y="276" font-size="12" fill="#e2e8f0" text-anchor="end">bbq_disk</text><rect class="a4b a4b10" x="175" y="262" width="26.25" height="14" rx="3" fill="#00BFB3"/><text x="207.25" y="273" font-size="11" fill="#e2e8f0">25 RAM</text><rect class="a4b a4b11" x="175" y="279" width="348.6" height="12" rx="3" fill="#64748b"/><text x="529.6" y="289" font-size="11" fill="#94a3b8">332 disk</text><text x="165" y="314" font-size="12" fill="#e2e8f0" text-anchor="end">vectordb_document</text><rect class="a4b a4b12" x="175" y="300" width="16.8" height="14" rx="3" fill="#00BFB3"/><text x="197.8" y="311" font-size="11" fill="#e2e8f0">16 RAM</text><rect class="a4b a4b13" x="175" y="317" width="177.45000000000002" height="12" rx="3" fill="#64748b"/><text x="358.45000000000005" y="327" font-size="11" fill="#94a3b8">169 disk</text><text x="20" y="380" font-size="10" fill="#64748b">RAM = quantized vectors + HNSW graph (.veq/.veb/.vex), read from segment files. bbq_disk = field total minus raw .vec, includes centroids.</text><text x="20" y="394" font-size="10" fill="#64748b">Disk = _disk_usage field total. vectordb_document stores raw vectors as bfloat16. Synthetic clustered vectors, single shard, force-merged to 1 segment.</text></svg>

| Type | RAM for fast search (MB) | Field size on disk (MB) | Recall@10 | p50 latency (ms) | Ingest / merge (s) |
|---|---|---|---|---|---|
| `hnsw` | 311 | 311 | 0.998 | 3.4 | 57 / 11 |
| `int8_hnsw` | 83 | 390 | 0.981 | 3.3 | 59 / 9 |
| `int4_hnsw` | 44 | 351 | 0.875 | 3.0 | 59 / 8 |
| `bbq_hnsw` | 15 | 322 | 0.935 | 3.3 | 60 / 7 |
| `bbq_flat` | 11 | 318 | 0.940 | 5.0 | 36 / 1 |
| `bbq_disk` | 25 | 332 | 0.969 | 2.9 | 36 / 4 |
| `vectordb_document` | 16 | 169 | 0.938 | 3.3 | 59 / 4 |

Recall uses default rescoring for each type: 3x for the BBQ types, none for `int8_hnsw` and `int4_hnsw`. The disk overhead matches the docs: +3.5% for BBQ against a documented 3.1%, +12.9% for int4 against 12.5%, and +25.2% for int8 against 25%. Percentages come from unrounded sizes.

`vectordb_document` is the only format that shrank disk, by 46%, because the raw vectors are stored as `bfloat16`. If the concern is "will vectors double my storage", that mode addresses it. BBQ alone addresses memory.

<!-- [UNIQUE INSIGHT] -->

One observation to verify on your version. On 9.5.6 with a trial licence, the `vectordb_document` index resolved its mapping to `bbq_hnsw` (with a 3.0 oversample), not `bbq_disk`. The docs describe `bbq_disk` as the default when the licence allows it. Run `GET <index>/_mapping` and check what you actually got before you plan around it.

## How Much Recall Does Oversampling Recover?

<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Line chart of recall at 10 versus rescore oversample factor from the test. bbq_hnsw rises from 0.77 at 1.5x to 0.9945 at 10x, bbq_disk from 0.83 to 0.9985, int4_hnsw stays near 0.99 from 3x." viewBox="0 0 760 360" width="100%" style="max-width:760px;height:auto" font-family="system-ui, sans-serif"><title>Test result: recall@10 vs oversample</title><style>.a5l{stroke-dasharray:700;stroke-dashoffset:700;animation:a5d 2.2s ease-out forwards}.a5l1{animation-delay:.5s}.a5l2{animation-delay:1s}@keyframes a5d{to{stroke-dashoffset:0}}@media (prefers-reduced-motion: reduce){*{animation:none!important}}.a5l{stroke-dashoffset:0}</style><rect width="760" height="360" rx="8" fill="#1e293b"/><text x="20" y="30" font-size="15" font-weight="700" fill="#e2e8f0">Recall@10 vs rescore oversample</text><text x="20" y="50" font-size="12" fill="#94a3b8">num_candidates = 100, 200 queries, exact brute-force truth. Higher is better.</text><line x1="110" x2="680" y1="300.0" y2="300.0" stroke="#334155"/><text x="100" y="304.0" font-size="10" fill="#94a3b8" text-anchor="end">0.75</text><line x1="110" x2="680" y1="255.99999999999994" y2="255.99999999999994" stroke="#334155"/><text x="100" y="259.99999999999994" font-size="10" fill="#94a3b8" text-anchor="end">0.80</text><line x1="110" x2="680" y1="212.0" y2="212.0" stroke="#334155"/><text x="100" y="216.0" font-size="10" fill="#94a3b8" text-anchor="end">0.85</text><line x1="110" x2="680" y1="167.99999999999997" y2="167.99999999999997" stroke="#334155"/><text x="100" y="171.99999999999997" font-size="10" fill="#94a3b8" text-anchor="end">0.90</text><line x1="110" x2="680" y1="124.00000000000003" y2="124.00000000000003" stroke="#334155"/><text x="100" y="128.00000000000003" font-size="10" fill="#94a3b8" text-anchor="end">0.95</text><line x1="110" x2="680" y1="80.0" y2="80.0" stroke="#334155"/><text x="100" y="84.0" font-size="10" fill="#94a3b8" text-anchor="end">1.00</text><text x="110" y="322" font-size="11" fill="#94a3b8" text-anchor="middle">1.5x</text><text x="300" y="322" font-size="11" fill="#94a3b8" text-anchor="middle">3x</text><text x="490" y="322" font-size="11" fill="#94a3b8" text-anchor="middle">5x</text><text x="680" y="322" font-size="11" fill="#94a3b8" text-anchor="middle">10x</text><text x="395" y="340" font-size="11" fill="#94a3b8" text-anchor="middle">rescore_vector.oversample</text><polyline class="a5l a5l0" points="110,282.4 300,137.2 490,98.5 680,84.8" fill="none" stroke="#00BFB3" stroke-width="2.5" stroke-linejoin="round"/><circle cx="110" cy="282.4" r="3.5" fill="#00BFB3"/><circle cx="300" cy="137.2" r="3.5" fill="#00BFB3"/><circle cx="490" cy="98.5" r="3.5" fill="#00BFB3"/><circle cx="680" cy="84.8" r="3.5" fill="#00BFB3"/><text x="696" y="88.8" font-size="11" font-weight="600" fill="#00BFB3">bbq_hnsw</text><polyline class="a5l a5l1" points="110,226.1 300,107.3 490,87.9 680,81.3" fill="none" stroke="#0077CC" stroke-width="2.5" stroke-linejoin="round"/><circle cx="110" cy="226.1" r="3.5" fill="#0077CC"/><circle cx="300" cy="107.3" r="3.5" fill="#0077CC"/><circle cx="490" cy="87.9" r="3.5" fill="#0077CC"/><circle cx="680" cy="81.3" r="3.5" fill="#0077CC"/><text x="696" y="85.3" font-size="11" font-weight="600" fill="#0077CC">bbq_disk</text><polyline class="a5l a5l2" points="110,102.4 300,86.6 490,86.6 680,86.6" fill="none" stroke="#F04E98" stroke-width="2.5" stroke-linejoin="round"/><circle cx="110" cy="102.4" r="3.5" fill="#F04E98"/><circle cx="300" cy="86.6" r="3.5" fill="#F04E98"/><circle cx="490" cy="86.6" r="3.5" fill="#F04E98"/><circle cx="680" cy="86.6" r="3.5" fill="#F04E98"/><text x="696" y="90.6" font-size="11" font-weight="600" fill="#F04E98">int4_hnsw</text></svg>

Default BBQ recall of 0.935 looks low next to float32 at 0.998. It is not the ceiling. At 5x oversampling `bbq_hnsw` reached 0.979 and `bbq_disk` reached 0.991. At 10x they reached 0.9945 and 0.9985. The latency cost was small, as the table below shows.

| Oversample | `bbq_hnsw` recall / p50 (ms) | `bbq_disk` recall / p50 (ms) | `int4_hnsw` recall / p50 (ms) |
|---|---|---|---|
| 1.5x | 0.770 / 3.4 | 0.834 / 3.9 | 0.975 / 3.2 |
| 3x | 0.935 / 3.2 | 0.969 / 3.4 | 0.993 / 3.9 |
| 5x | 0.979 / 3.8 | 0.991 / 3.5 | 0.993 / 3.8 |
| 10x | 0.995 / 4.0 | 0.999 / 3.5 | 0.993 / 3.9 |

Latency moved by under a millisecond across the sweep, within the run-to-run noise of a laptop container. In this single run, raising `num_candidates` from 100 to 500 moved `bbq_hnsw` only from 0.935 to 0.9395, which suggests the rescored pool was the limit. I did not isolate that. Tune `oversample` first.

`int4_hnsw` at the default (no rescoring) scored 0.875 and jumped to 0.9925 at 3x. Quantization without rescoring is the wrong comparison to make.

## What Did This Validation Not Show?

- **Latency separation.** Every index fit in RAM, so p50 latencies sit within noise of each other (2.9 to 3.4 ms). The benefit of quantization appears when the float index no longer fits in memory. `bbq_flat` was the slowest at 5.0 ms because it scans every vector, and that cost grows with the dataset.
- **Real embeddings.** The vectors are synthetic and clustered. Recall on a real model will differ. Elastic reports above 90% recall with 3x oversampling on a 1M-vector, 1024-dimension Cohere dataset, with memory dropping from 4,162 MB to 208 MB ([Search Labs](https://www.elastic.co/search-labs/blog/better-binary-quantization-lucene-elasticsearch)). Treat these as Elastic's own results and reproduce them on your data.
- **Scale and indexing speed.** `bbq_disk` and `bbq_flat` took about 36 seconds to ingest against 57 to 60 for the HNSW types, a gap partly hidden because client-side JSON encoding was part of the wall clock. Elastic's own 1M-vector test shows a much larger indexing gap, 94 seconds for DiskBBQ against 1,054 seconds for HNSW with BBQ, with recall of 91% and 92% respectively ([Search Labs](https://www.elastic.co/search-labs/blog/diskbbq-elasticsearch-introduction)).

---

## When Should You Use BBQ, and When Not?

**Benefits of BBQ:** RAM for fast search drops about 20x against float32 in this test (15 MB against 311 MB). Distance computation is cheaper. Larger datasets fit on fewer nodes. Raw vectors stay on disk, so you can re-quantize or rescore later.

**Trade-offs:** recall at default settings is lower than float32 and needs oversampling to recover. Disk use rises slightly. Dimensions under 384 see less accuracy benefit and more corrective-factor overhead ([Elastic docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/bbq)). Rescoring reads raw vectors from disk, which is where slow storage shows up. For where quantization fits among the other search layers, see [AI Search: An Elasticsearch Perspective](/blog/ai-search-elasticsearch-perspective).

| If your workload is... | Start with | Why |
|---|---|---|
| Text embeddings, 384+ dimensions, a shared cluster | `bbq_hnsw` | Docs recommend BBQ for text; smallest HNSW footprint |
| Large index, RAM is the constraint, recall around 95% is fine | `bbq_disk` | Reads clusters from disk; needs Enterprise licence |
| Small dataset, accuracy first | `bbq_flat` or `int8_flat` | Exact-style scan, no graph to tune |
| Under 384 dimensions | `int8_hnsw` or `int4_hnsw` | Corrective-factor overhead hurts BBQ at low dimensions |
| Distinguishing similar voices or fine image detail | `int8_hnsw` and measure | Practitioner guidance; the docs only say BBQ works best on text |
| Need 99%+ recall | An HNSW-based format | DiskBBQ docs point here for very high recall; raise `oversample` if recall falls short (practitioner advice) |

The voice and image row is guidance from field conversations, not from the docs. The docs say BBQ "works best with text embeddings" ([vector storage docs](https://www.elastic.co/docs/solutions/search/vector/vector-storage-for-semantic-search)) and are silent on other modalities.

---

## What Should You Benchmark First?

If you are about to enable dense vectors on existing clusters, the decision that matters most is `bbq_hnsw` against `bbq_disk`. Measure both on your own embeddings:

1. Index the same sample into both, force-merge to one segment, and record `_disk_usage`.
2. Compute exact nearest neighbours for 200 or more real queries as ground truth.
3. Sweep `oversample` over 1.5, 3, 5 and 10 and record recall@10 and p50 and p95 latency.
4. Repeat with the page cache constrained to what production will have. That is the only run where the two formats separate on latency.
5. Check `GET <index>/_mapping` if you use `vectordb_document`, and confirm which type it chose.

For the embedding model decision that comes before all this, see [Air-Gapped Semantic Search with Elasticsearch and Jina AI](/blog/elasticsearch-jina-airgapped-semantic-search).

---

## Bottom Line

BBQ is a RAM decision, not a disk decision. It shrinks the data that must stay hot by about 20x (95%) in this test and costs about 3% more disk. Recall at the default 3x oversample is lower than float32, and oversampling recovers most of it for a small latency cost. Start with `bbq_hnsw` for text embeddings of 384 or more dimensions, benchmark `bbq_disk` if RAM is tight, and verify on your own embeddings before you commit.

---

## FAQ

### Does BBQ reduce disk usage?

No. Elasticsearch keeps the raw float vectors on disk, so BBQ adds about 3.1% for the quantized copy. The saving is the RAM needed for fast search. In the test, `bbq_hnsw` needed 15 MB of hot data against 311 MB for float32, while the field grew from 311 MB to 322 MB on disk.

### How much recall does BBQ lose?

At the default 3x oversample, the test measured 0.935 recall@10 for `bbq_hnsw` and 0.969 for `bbq_disk`, against 0.998 for float32. At 10x oversample they reached 0.9945 and 0.9985. These are synthetic vectors, so measure on your own embeddings before setting a target.

### Should I use bbq_hnsw or bbq_disk?

Use `bbq_hnsw` when the quantized index and graph fit in RAM and you want the lowest latency. Use `bbq_disk` when RAM is the constraint and around 95% recall is acceptable. DiskBBQ requires an Enterprise subscription. Benchmark both on your data.

### Is BBQ good enough for image or voice embeddings?

The docs say BBQ works best with text embeddings ([vector storage docs](https://www.elastic.co/docs/solutions/search/vector/vector-storage-for-semantic-search)) and give no guidance for other modalities. For tasks that depend on fine differences, such as telling two voices apart, start with `int8_hnsw` and compare recall before moving to BBQ.

### What does the vectordb_document mode change?

It sets vector defaults for vector database workloads: `bfloat16` storage, source vectors excluded, and a preload list for the vector files ([dense_vector docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector)). In the test it cut the vector field from 311 MB to 169 MB. Verify the resolved `index_options.type` on your version.
