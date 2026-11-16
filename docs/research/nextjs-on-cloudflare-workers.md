# Next.js on Cloudflare Workers via OpenNext

Research for [#15](https://github.com/SiddharthMuramkar/foa-platform/issues/15) (map [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2), feeds [#7](https://github.com/SiddharthMuramkar/foa-platform/issues/7)). Date: 2026-11-16. Scope: SPEC §3.1, §3.3, §3.5 (SG-05), §3.7, NFR-01. Builds on #3, #4, #10 (non-Vercel parts), #11, #12. Origin connection and placement are #16; analytics and monitoring are #17; media buckets and backups are #18.

Versions checked: `@opennextjs/cloudflare` 1.20.17 (2026-11-12; peers `next >=16.4.5`, `wrangler ^4.148.0`), Next.js 16.4.6, React 19.3.1, wrangler 4.162.0, `@clerk/nextjs` 7.10.0.

## Answer

- FOA's web shape runs on Workers through OpenNext: SSR, route handlers, streaming, `after()`, on-demand tag revalidation, `next/image` through Cloudflare Images, `next/og`, and Clerk. Server rendering needs the Workers Paid plan, because the Free plan's 10 ms CPU limit is too low.
- Two parts of the SPEC are **not production-safe on Workers today**:
  - **Cache Components** (`cacheComponents`, `'use cache'`, PPR). Responses differ from `next start`, and the core fix (OpenNext PR #1318) has been open since 2026-08-01. One open bug makes a route return 500 after `revalidateTag(tag, { expire: 0 })`, which is exactly the SG-05 takedown call.
  - **`proxy.ts`**. Node middleware is "experimental and not supported by the OpenNext maintainers".
- SG-05 can be met end to end: a tag expiry in the Durable Object tag cache, plus a zone purge of the `media.foaglobal.org` original. That purge also clears every `/cdn-cgi/image` variant. A verification fetch then confirms the item is gone.
- Per-PR previews work with Cloudflare **Worker Previews** on `workers.dev`, using a Clerk development instance and Turnstile test keys. OpenNext does not document this path yet, so it needs a prototype.

## Findings

### 1. Support (Next.js 16 features)

| Feature | Status on OpenNext 1.20.17 | Notes |
|---|---|---|
| App Router, RSC, SSR, route handlers, streaming, `after()` | Supported | Listed by OpenNext and by Cloudflare's OpenNext guide. Open edge case: a route whose body stream errors before the first chunk hangs the request (#1468). `after()` runs on `ctx.waitUntil`, which is capped at 30 s after the response. |
| Cache Components (`'use cache'`, `cacheTag`, `cacheLife`, PPR) | Listed as supported, **with open correctness bugs** | See the list after this table. |
| `revalidateTag` from an external caller (route handler) | Supported | Next 16.4: route handlers use `revalidateTag(tag, 'max')` for stale-while-revalidate or `revalidateTag(tag, { expire: 0 })` for "stale content is never served". `updateTag` works only in Server Actions. |
| `proxy.ts` | **Experimental** since 1.20.3 (2026-08-26) | Next 16 always compiles `proxy.ts` for the Node runtime; you cannot opt out. The adapter re-bundles Next's internal middleware output; the source says it "is not supported by the OpenNext maintainers". A no-op proxy used to weigh ~4.6 MB (#1373). PR #1489 (merged 2026-11-13, after 1.20.17, so not yet released) cuts a Clerk proxy to ~1.33 MB (374 KB gzipped). |
| `middleware.ts` (Edge) | Supported (the mature path) | Next 16 deprecates the file name and the Edge runtime, but still runs it: "If you want to continue using the `edge` runtime, keep using `middleware`". Clerk: the contents are identical to `proxy.ts`. |
| React 19 `<ViewTransition>` | Works (client-side) | No server dependency. Next 16.4 supports it with no config (#4). Not covered by OpenNext's own tests. |
| Node.js APIs | Broad | Compatibility dates ≥ 2026-08-04 turn on `nodejs_compat` by default. OpenNext's template still sets `nodejs_compat` plus `global_fetch_strictly_public`. `fs`, `crypto`, `stream`, `zlib`, `http(s)`, `net`, `AsyncLocalStorage`, `Buffer` and timers are native. `child_process`, `worker_threads`, `vm` and `v8` are non-functional stubs. The web app needs none of the stubbed modules: `sharp`, `ffmpeg` and Prisma stay in the API/worker image. |

Open Cache Components bugs:

- workerd runs `process.nextTick` as a microtask (cloudflare/workerd#7687, open). Next's staged renders therefore end early, and documents, navigations and runtime prefetches come out different from `next start` (PR #1318).
- A PPR shell built with `'use cache'` never resumes its holes, so the browser logs React #419 on every load (#1369).
- After `revalidateTag(tag, { expire: 0 })`, every request to the route returns 500 with "used `Date.now()`" (#1458). The cause is `Date.now()` calls in the DO tag cache and the regional cache.
- Cross-request `'use cache'` deduplication can hang requests (#1464).
- HTTP 500s and hangs under concurrent requests (#1450). On 2026-10-13 a maintainer gave a ~2-week ETA for a fix; #1318 was still open on 2026-11-16.
- Cache interception does not work with PPR.

### 2. Caching and the SG-05 purge

- **Components** (configured in `open-next.config.ts`):
  - **Incremental cache**: R2 is the recommended store. KV is "not recommended because it is eventually consistent". Static assets are read-only.
  - **Regional cache**: optional, built on the per-colo Cache API. `long-lived` mode reuses fetch entries until they are revalidated, and ISR entries for up to 30 min.
  - **Queue** (time-based revalidation only): a Durable Object queue (`DOQueueHandler`) that deduplicates revalidations. By default it runs 10 instances × 5 at a time.
  - **Tag cache** (needed for `revalidateTag`): `D1NextModeTagCache` (small sites) or `doShardedTagCache` (higher load).
  - **`cachePurge`**: purges the zone cache by tag through the Cloudflare API, either directly or buffered through the `BucketCachePurge` DO (5 s window). It needs `CACHE_PURGE_API_TOKEN` and `CACHE_PURGE_ZONE_ID`, and works only on a zone (custom domain).
- **Where the HTML lives**: Workers responses are not cached by the zone CDN. HTML and fetch data live only in the R2 incremental cache and the optional regional Cache API layer. Both are checked against the tag cache unless `bypassTagCacheOnCacheHit: true` is set. With that flag, correctness depends on `cachePurge`.
- **Do not turn on Workers Cache** (the cache in front of a Worker, launched 2026-07-06). OpenNext does not support it (#1311, open). A maintainer says it would break middleware, `revalidateTag` and PPR. Zone-level purges also do not reach Workers Cache entries.
- **Tag writes**:
  - `doShardedTagCache` writes to the shard DOs and deletes the regional tag-cache entry only in the writing colo. Other colos keep their copy for up to `regionalCacheTtlSec` (default 5 s).
  - Without `regionalReplication`, a DO is placed near its first caller. With it, replicas follow DO location hints. The default region is `enam`; `apac` and the newer `apac-se` exist.
  - High DO request volume has been reported on large ISR sites (#1103, open).
- **SG-05 flow on Cloudflare** (replaces #10's `@vercel/functions` design):
  1. The API deletes the derivatives from `foa-public` (§3.5 step 5).
  2. The API purges the `media.foaglobal.org/<path>` URLs from the zone cache. Purging an original also purges every `/cdn-cgi/image/...` variant, and `/cdn-cgi/` URLs cannot be purged directly. Cloudflare keeps optimised variants for at least 1 h, so this purge is required.
  3. The API calls `POST /api/revalidate`. The route calls `revalidateTag(tag, { expire: 0 })` for each tag, never `'max'`. With `'max'`, the first visitor after a takedown would still be served the withdrawn page, possibly days later.
  4. The API **verifies** the takedown: it fetches the affected public pages and media URLs and checks that the item is absent and the media returns 404. If verification fails, it retries through a pg-boss job and alerts by 5 min.
- **Why step 4 is needed**: `revalidateTag` returns nothing and does not throw. Next applies pending revalidations when the handler returns and passes them on as `pendingWaitUntil` (next.js#99566). On Workers that becomes `ctx.waitUntil`, so the 200 can arrive before the tag write lands. Not yet tested on Workers; this is the S0 gate test.
- **Browser and router caches**: give `foa-public` objects a short browser `max-age` (≤ 300 s), never `immutable`. Otherwise both the browser and OpenNext's `/_next/image` path cache them "forever". Next's client router cache also holds static segments for up to 5 min by default.

### 3. Images and OG

| Option | How it works | AVIF/WebP | Caching / SG-05 | Notes |
|---|---|---|---|---|
| **Custom loader** (`/cdn-cgi/image/width=…,quality=…,format=auto/<src>`) | Cloudflare Image Transformations on the zone. Requests skip the Worker and middleware. | `format=auto` serves the best format the browser accepts. AVIF falls back to WebP/JPEG for large images. | Variants are edge-cached for ≥ 1 h and billed once per unique variant per month. Purging the original URL purges all variants. | The loader ignores `remotePatterns`, so restrict source origins in the dashboard to `media.foaglobal.org`. On `workers.dev` the request reaches the Worker, which (OpenNext's dev fallback) returns the **untransformed original**. |
| **`IMAGES` binding** (default `/_next/image`) | The Worker fetches the source and transforms it with the binding **on every request**. | Negotiated from `Accept`. Since 1.20.10 the `Content-Type` matches the actual output. | No server-side cache of the output. `Cache-Control: max-age=315360000, immutable` is added only if the source is static or `immutable`; otherwise there is no `Cache-Control`. | `minimumCacheTTL` is not supported. Works on `workers.dev` and locally. Pays the transform latency on every view of an LCP image. |

- **OG images**: `next/og` (satori + resvg wasm) is supported. The adapter patches `@vercel/og` for workerd and bundles it only when the app uses it: ~800 KiB of JS plus a 1.4 MiB wasm file.
  - Next 16.2.0–16.3.5 carry the `next/og` remote code execution vulnerability CVE-2026-94545. OpenNext's version floor (16.4.5) excludes them.
  - Fonts must be static TTFs (#12: `packages/brand/fonts`).
  - FOA's per-Artwork OG image is already a worker-made `og` derivative in R2 (§3.5), so `next/og` is needed only for generated cards (Competition, page).

### 4. Auth (Clerk)

- **Middleware**: `clerkMiddleware()` runs on Workers in both forms.
  - Edge `middleware.ts` is the long-standing path; OpenNext's own example uses it.
  - `proxy.ts` goes through the experimental Node bundling. With Clerk, the proxy bundles React's runtime, so it gains less from #1489.
  - Clerk says the file contents are identical, so switching between them is a rename.
- **Earlier failures**:
  - "auth() was called but Clerk can't detect clerkMiddleware()" (#524).
  - Decrypt errors (#281).
  - A Clerk import crash with `cacheComponents` (#1062).
  - SSR 500 when `NEXT_PUBLIC_CLERK_PROXY_URL` is relative (clerk/javascript#8304).
  - All are closed. FOA does not need the Frontend API proxy.
- **`auth().getToken()`**: works. `@clerk/backend` verifies with Web Crypto. Set `CLERK_JWT_KEY` (`jwtKey`) on the web as well as on the API, so a fresh isolate does not fetch JWKS (#10). Runtime secrets reach `process.env` from Worker vars and secrets. `NEXT_PUBLIC_*` values are inlined at build time.
- **With Cache Components**:
  - `ClerkProvider` goes inside `<body>`.
  - Wrap the code that reads auth in `<Suspense>`.
  - Calling `auth()` inside `'use cache'` is a build error.
  - Without Cache Components, `ClerkProvider` keeps pages static unless `dynamic` is set.
- **Still standing from #10**: the `azp` check instead of `authorizedParties`.

### 5. Limits and NFR-01

| Limit (Workers Paid) | Value | FOA impact |
|---|---|---|
| CPU per request | 30 s default, up to 5 min (Free: 10 ms) | SSR "typically 10–20 ms". The Paid plan is required. |
| Memory | 128 MB per isolate, shared by concurrent requests | Exceeding it returns Error 1102 and recycles the isolate. Open leak: runtime-prerendered ISR pages keep ~1.4 MB of RSC payload per render (#1455). |
| Worker size | **64 MiB uncompressed; no compressed limit** since 2026-09-04 | OpenNext's docs still quote the old 3/10 MiB gzip limits, which are obsolete. |
| Startup | Global scope must run in ≤ 1 s (`startup_time_ms` printed on deploy) | OpenNext lazy-loads route chunks. 1.2 cut the startup of medium apps by ~100 ms. |
| Subrequests | 10,000 per request (configurable); **6 connections waiting for headers at once** | A page that fetches more than 6 API calls in parallel queues the rest. Prefer one aggregate API call per page. |
| Static assets | 100,000 files, 25 MiB each; served without invoking the Worker (unless `run_worker_first`) | Add `/_next/static/*` immutable headers via `public/_headers`. `next.config` headers do not apply to assets. |
| `waitUntil` | 30 s after the response | Bounds `after()` and tag writes. |

What threatens NFR-01:

- The client route-JS budget (170 KB) is **unchanged**: OpenNext ships the same `next build` client output.
- **TTFB** depends on:
  - regional cache hits;
  - tag-cache DO round trips (place shards in `apac`);
  - the R2 location (create the cache bucket with location hint `apac`);
  - the round trip to the Mumbai API on a miss (#16).
- **LCP images**: per-request binding transforms versus edge-cached `/cdn-cgi/image` variants.
- **PPR bugs** that fall back to client rendering (React #419), which hurts LCP and INP.

### 6. Previews

- **Version URLs** (`opennextjs-cloudflare upload` → `wrangler versions upload`) are a poor fit:
  - They run on production configuration and resources.
  - They are **not generated for a Worker that exports a Durable Object**, and OpenNext's `worker.js` exports `DOQueueHandler`, `DOShardedTagCache` and `BucketCachePurge`.
  - Skew protection uses them, but needs the DOs moved into a separate Worker.
- **Worker Previews** (`wrangler preview`, wrangler ≥ 4.135.0, docs from 2026-09-24) fit:
  - Each branch gets its own preview under the same Worker, with its own vars, secrets and bindings (`previews` block).
  - A **new DO namespace is created automatically** for each preview.
  - URLs are `<preview>-<worker>.<subdomain>.workers.dev`, with an `X-Robots-Tag: noindex` header.
  - Up to 500 previews per Worker; delete them on PR close with `wrangler preview delete`.
- **Worker Previews gaps for OpenNext**:
  - OpenNext has no command for it, so the flow is `opennextjs-cloudflare build` → `populateCache remote` → `wrangler preview`.
  - **Service bindings from a preview call production**, so `WORKER_SELF_REFERENCE` (used by the DO queue for ISR) would revalidate production. Use OpenNext's memory queue in previews (its "staging" advice), or no time-based revalidation.
  - Bind a separate preview R2 cache bucket. Cache keys carry the build id.
  - Preview vars are static, so the preview URL must be derived from its predictable name.
- **Clerk**: use **development keys on the host's preview domain** (`*.workers.dev`). Production keys cannot be used there.
  - A dev or second instance on a *subdomain* of the production root domain "will not work"; it needs a separate root domain.
  - Dev instances are capped at 100 users.
- **Turnstile**: test site key `1x00000000000000000000AA` (passes) or `2x00000000000000000000AB` (fails); test secret `1x0000000000000000000000000000000AA`. They work on any domain and produce `XXXX.DUMMY.TOKEN.XXXX`.
- **Builds**: `NEXT_PUBLIC_*` values (Clerk publishable key, Turnstile site key, API URL) are inlined at build time, so previews and production need **separate builds**.

## Recommendation

1. **Adapter and plan**: `@opennextjs/cloudflare` on the Workers Paid plan. Pin the first release that includes #1489 (> 1.20.17). Use wrangler ≥ 4.148, Next ≥ 16.4.5 (the adapter's floor), and a current compatibility date. Deploy with `opennextjs-cloudflare deploy` from GitHub Actions.
2. **Caching (S0 default)**:
   - Do **not** enable `cacheComponents` yet.
   - Cache public pages with `fetch(url, { next: { tags, revalidate } })` and segment `revalidate`, the "caching without Cache Components" model that Next 16.4 still documents.
   - `open-next.config.ts`:
     - `withRegionalCache(r2IncrementalCache, { mode: "long-lived" })`, without `bypassTagCacheOnCacheHit`;
     - `doQueue`;
     - `doShardedTagCache` with `regionalCache: true` (5 s) and `regionalReplication: { defaultRegion: "apac" }`;
     - no `cachePurge`.
   - Create the R2 cache bucket with location hint `apac`. Leave Workers Cache off.
   - Re-evaluate Cache Components once #1318 and #1458 are released and the SG-05 gate passes on a preview.
3. **SG-05**: `/api/revalidate` takes `{ tags, mode }`. It uses `revalidateTag(tag, { expire: 0 })` for takedowns and `'max'` for ordinary edits. The API also purges the `media.foaglobal.org` original URLs from the zone (#18 owns the token and code), verifies by fetch, and falls back to a job and an alert by 5 min. `foa-public` objects get browser `max-age` ≤ 300 s and are never `immutable`.
4. **Images**: in production, use a custom loader on `/cdn-cgi/image` with `format=auto` and sources restricted to `media.foaglobal.org`. Previews on `workers.dev` serve originals, so run the Lighthouse CI image budgets on a host with transformations enabled (#7 decides which). Use `next/og` only for generated cards.
5. **Clerk**:
   - `clerkMiddleware({ jwtKey })` in `apps/web/middleware.ts` (Edge) while OpenNext's Node proxy is experimental. Rename it to `proxy.ts` once OpenNext declares Node middleware stable; the contents are the same.
   - Keep #10's `azp` check.
   - Previews use the Clerk dev instance on `workers.dev`.
6. **Previews**: a `preview` Wrangler environment (its own Worker, R2 cache bucket and secrets: Clerk dev keys, Turnstile test keys), with per-PR `wrangler preview --env preview --name pr-<n>`, the memory queue, and deletion on PR close. Prototype it in S0 before §3.7 is rewritten.
7. **S0 gate tests**:
   - After a tag expires, the page re-renders without the item and media returns 404, within 5 min.
   - Clerk SSR with a bearer token to the API.
   - A `wrangler deploy --dry-run` size and startup check in CI.
   - A Lighthouse run on `/` and `/gallery`.

## Open risks

- **Cache Components on workerd** (#1318, workerd#7687, #1369, #1458, #1464, #1450). Until these are fixed, the §3.3 wording (`'use cache'` + `cacheTag`/`cacheLife`) cannot be built as written. The fallback model above keeps the tag-based design.
- **Middleware path**. `middleware.ts` is deprecated by Next and may go in Next 17. `proxy.ts` is experimental on OpenNext. Either way a forced migration is ahead; track OpenNext releases.
- **SG-05 acknowledgement**. On Workers the tag write may land after the 200. The verification fetch is mandatory, not optional.
- **Previews path is undocumented for OpenNext** (populateCache target, service bindings to production, the DO queue). Needs a prototype. Fallback: one shared `preview` Worker without per-PR isolation.
- **Tag-cache DO latency and volume** from India (#1103). Measure TTFB on hits; tune `regionalCacheTtlSec` and replicas.
- **Memory leak** #1455 (ISR runtime prerender), and request hangs on body errors (#1468).
- **Platform direction**. Cloudflare's Next.js guide (2026-11-05) now recommends **vinext** (beta Vite reimplementation of Next.js; 96.1% overall pass rate on Next's deploy suite at v16.2.6) and frames OpenNext as the path for apps that "cannot yet migrate". Clerk compatibility with vinext is unverified. Revisit if OpenNext support slows.
- **Doc drift**:
  - OpenNext still cites the removed 3/10 MiB compressed limits.
  - Cloudflare's OpenNext page (2026-10-12) says Node middleware is "not yet supported", while OpenNext says experimental since 1.20.3.
  - Trust the changelogs and the source.

## SPEC passages affected

| SPEC | Change | Owner |
|---|---|---|
| §3.1 Web hosting | Vercel → Cloudflare Workers (Paid) via `@opennextjs/cloudflare`; R2 incremental cache, DO queue and sharded tag cache | #15 `docs:` PR |
| §3.1 Frontend | `next/image` via a Cloudflare Images custom loader (`format=auto`); Cache Components gated (see §3.3) | #15 |
| §3.1 Auth | `clerkMiddleware()` in `apps/web/middleware.ts` (Edge) until OpenNext's Node proxy is stable; `jwtKey` on the web | #15 |
| §3.1 Analytics | Vercel Web Analytics row needs a Cloudflare equivalent | #17 |
| §3.2 | `apps/web` adds `wrangler.jsonc`, `open-next.config.ts`, `image-loader.ts`, `public/_headers` | #15 |
| §3.3 | Public caching: fetch tags + segment `revalidate` until the Cache Components gate passes; `/api/revalidate` uses `revalidateTag(tag, { expire: 0 })` for SG-05 and `'max'` otherwise; SG-05 verified by fetch | #15 |
| §3.5 step 5 / SG-05 | "Purges the CDN path" = zone purge of the `media.foaglobal.org` original (clears `/cdn-cgi/image` variants); `foa-public` browser `max-age` ≤ 300 s, never `immutable` | #18 (media), #15 (web side) |
| §3.7 table + env vars | Preview = Worker Previews under a `preview` environment on `workers.dev`, Clerk dev keys, Turnstile test keys, separate builds; add `CLERK_JWT_KEY` (web); OpenNext bindings (`NEXT_INC_CACHE_R2_BUCKET`, `NEXT_TAG_CACHE_DO_SHARDED`, `NEXT_CACHE_DO_QUEUE`, `WORKER_SELF_REFERENCE`) | #7 |
| ADR list | `0003-hosting-vercel-railway-neon-r2` → `0003-hosting-cloudflare-workers-docker-vps-r2` | #7 |
| §11 CI | Add an OpenNext build, a `wrangler deploy --dry-run` size/startup check, the SG-05 E2E test (expire → re-render → media 404), and Lighthouse on a host with transformations | #15 |
| §12 S0 | Gate tests from Recommendation 7 | #15 |

## Sources

All accessed 2026-11-16; page dates in brackets.

- OpenNext Cloudflare overview: supported versions and features, `proxy.ts` experimental since 1.20.3 — https://opennext.js.org/cloudflare
- OpenNext caching: components, regional cache, queue, tag caches, cache purge — https://opennext.js.org/cloudflare/caching
- OpenNext image optimisation (binding vs custom loader, compatibility notes) — https://opennext.js.org/cloudflare/howtos/image
- OpenNext skew protection (Version URLs, DOs in a separate Worker) — https://opennext.js.org/cloudflare/howtos/skew
- OpenNext CLI (`populateCache`, `deploy`, `upload`, `preview`) — https://opennext.js.org/cloudflare/cli
- OpenNext perf tips and multi-worker — https://opennext.js.org/cloudflare/perf
- OpenNext CHANGELOG 1.20.3–1.20.17 — https://github.com/opennextjs/opennextjs-cloudflare/blob/main/packages/cloudflare/CHANGELOG.md
- OpenNext source: `images.ts`, `worker.ts`, `bundle-node-middleware.ts`, `nextjs-support.ts`, templates — https://github.com/opennextjs/opennextjs-cloudflare/tree/main/packages/cloudflare
- OpenNext issues and PRs:
  - #1318 (open, 2026-08-01): https://github.com/opennextjs/opennextjs-cloudflare/pull/1318
  - #1369: https://github.com/opennextjs/opennextjs-cloudflare/issues/1369
  - #1458: https://github.com/opennextjs/opennextjs-cloudflare/issues/1458
  - #1464: https://github.com/opennextjs/opennextjs-cloudflare/issues/1464
  - #1450: https://github.com/opennextjs/opennextjs-cloudflare/issues/1450
  - #1373 (closed 2026-11-13): https://github.com/opennextjs/opennextjs-cloudflare/issues/1373
  - PR #1489 (merged 2026-11-13): https://github.com/opennextjs/opennextjs-cloudflare/pull/1489
  - #1311: https://github.com/opennextjs/opennextjs-cloudflare/issues/1311
  - #1103: https://github.com/opennextjs/opennextjs-cloudflare/issues/1103
  - #1455: https://github.com/opennextjs/opennextjs-cloudflare/issues/1455
  - #1468: https://github.com/opennextjs/opennextjs-cloudflare/issues/1468
  - #524: https://github.com/opennextjs/opennextjs-cloudflare/issues/524
  - #281: https://github.com/opennextjs/opennextjs-cloudflare/issues/281
  - #1062: https://github.com/opennextjs/opennextjs-cloudflare/issues/1062
- workerd `process.nextTick` order (open, 2026-10-11) — https://github.com/cloudflare/workerd/issues/7687
- Next.js 16.4.5 docs:
  - revalidateTag: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/04-functions/revalidateTag.mdx
  - updateTag: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/04-functions/updateTag.mdx
  - proxy: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/03-file-conventions/proxy.mdx
  - upgrading to 16: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/upgrading/version-16.mdx
  - caching without Cache Components: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/caching-without-cache-components.mdx
- Next.js route handler revalidation timing — https://github.com/vercel/next.js/issues/99566
- Cloudflare Workers limits [2026-11-13] — https://developers.cloudflare.com/workers/platform/limits/
- Worker size 64 MiB changelog [2026-09-04] — https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/
- Node.js compatibility [2026-08-12] — https://developers.cloudflare.com/workers/runtime-apis/nodejs/
- Workers Cache [2026-10-30] — https://developers.cloudflare.com/workers/cache/
- Workers Cache purge [2026-10-12] — https://developers.cloudflare.com/workers/cache/purge/
- Workers Cache launch blog [2026-07-06] — https://blog.cloudflare.com/workers-cache
- Version URLs [2026-09-22] — https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/
- Previews [2026-09-24] — https://developers.cloudflare.com/workers/previews/
- Previews compared [2026-09-22] — https://developers.cloudflare.com/workers/previews/compare-workflows/
- Previews resources [2026-11-09] — https://developers.cloudflare.com/workers/previews/resources/
- Workers Builds [2026-10-28] — https://developers.cloudflare.com/workers/ci-cd/builds/
- wrangler `preview` command source — https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/src/preview
- Cloudflare Next.js guide, vinext [2026-11-05] — https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Cloudflare OpenNext guide [2026-10-12] — https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- vinext compatibility (run 2026-11-16) — https://vinext.dev/compatibility
- Images features and caching (`format=auto`, purge original purges variants, ≥ 1 h) [2026-06-16] — https://developers.cloudflare.com/images/optimization/features/
- Images transformations overview — https://developers.cloudflare.com/images/transform-images
- R2 data location hints [2026-08-19] — https://developers.cloudflare.com/r2/reference/data-location/
- DO `apac-ne` / `apac-se` hints [2026-06-19] — https://developers.cloudflare.com/changelog/post/2026-06-19-apac-ne-apac-se-location-hints/
- Turnstile testing keys [2026-11-05] — https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- Clerk docs:
  - quickstart (`proxy.ts`, ≤ 15 → `middleware.ts`, same contents): https://github.com/clerk/clerk-docs/blob/main/docs/_partials/nextjs/nextjs-15-callout.mdx
  - managing environments (preview domains, dev limits): https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/managing-environments.mdx
  - rendering modes / Cache Components: https://clerk.com/docs/guides/development/rendering-modes
- Clerk issue #8304 (closed) — https://github.com/clerk/javascript/issues/8304
- npm registry (versions and release dates): `@opennextjs/cloudflare`, `next`, `wrangler`, `@clerk/nextjs`, `react`
