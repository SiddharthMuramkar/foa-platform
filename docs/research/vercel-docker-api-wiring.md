# Research: Wiring Vercel web to the Docker API (#10)

Date: 2026-11-16 · Ticket: [#10](https://github.com/SiddharthMuramkar/foa-platform/issues/10) · Map: [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2) · SPEC §3.3, §3.4, §3.6, §3.7, §8.1, NFR-01/02/05/09

## Answer

- The SPEC §3.3–§3.4 wiring works unchanged on Vercel + a VPS. You need four things: the API on `api.foaglobal.org` behind a TLS reverse proxy, an exact-origin CORS list plus Clerk `authorizedParties` in production, a secret-guarded `POST /api/revalidate` called from the worker, and raw-body webhook routes that store an event once and hand processing to a queue.
- Previews are the hard part. Clerk production keys do not work on `*.vercel.app`, and preview URLs change on every deploy. So previews talk to **one shared staging API** that uses the Clerk development instance and Razorpay test mode. That API matches preview origins with a regex, which works for both CORS and `azp`.
- Latency: set the Vercel function region to **`bom1` (Mumbai)**, because the default `iad1` is in Washington DC. Put the VPS in the Mumbai metro too. Cache public reads in Vercel. Keep-alive is on by default.

## Findings

### 1. Domain, TLS, CORS

- **Domain/TLS.** Point an A/AAAA record for `api.foaglobal.org` at the VPS. Caddy gives automatic HTTPS. Its `reverse_proxy` sets `X-Forwarded-For/Proto/Host` and ignores client-supplied values by default, which helps with spoofing. HSTS (NFR-05) is one `header` line. Razorpay only delivers webhooks to ports 80/443 and needs a modern TLS version ([Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), [Caddy header](https://caddyserver.com/docs/caddyfile/directives/header); [Razorpay webhooks](https://razorpay.com/docs/webhooks), [best practices](https://razorpay.com/docs/webhooks/best-practices)). Host hardening belongs to #11.
- **Express behind the proxy.** Set `app.set('trust proxy', 'loopback')`, or the proxy's Docker subnet. `req.ip`, and so the per-IP rate limits in §8.1, then see the client's IP rather than the proxy's ([Express 5 trust proxy](https://github.com/expressjs/express/blob/v5.1.0/History.md)).
- **Why a Bearer header is needed.** Clerk's `__session` cookie is scoped strictly to the app domain and never shared with subdomains. For `foaglobal.org` → `api.foaglobal.org`, Clerk says to send the token in the `Authorization` header. This matches §3.3 ([Clerk: how Clerk works](https://github.com/clerk/clerk-docs/blob/main/docs/guides/how-clerk-works/overview.mdx), [making requests](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/making-requests.mdx)).
- **Preview URLs are dynamic.** Commit URLs look like `<project>-<9-char-hash>-<scope-slug>.vercel.app`. Branch URLs look like `<project>-git-<branch>-<scope-slug>.vercel.app`. Labels longer than 63 characters are truncated, and anti-phishing rules can shorten them further. Previews can use your own domain only through a **Preview Deployment Suffix**, which needs a Pro or Enterprise plan ([Vercel generated URLs](https://vercel.com/docs/deployments/generated-urls), updated 2026-09-08).
- **Clerk and previews.** Clerk production keys cannot be used on the host's preview domain, so previews must use **development** keys. Sharing production users with previews needs the same root domain, which again means a Preview Deployment Suffix ([Clerk: managing environments](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/managing-environments.mdx), [Clerk on Vercel](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/deployment/vercel.mdx)). As a result, preview traffic and production traffic cannot share one API instance: each instance verifies tokens with a different JWT key.
- **The `cors` package.** `origin` accepts an array of strings and RegExps, and reflects the request origin on a match with `Vary: Origin`. It also takes `allowedHeaders`, `exposedHeaders`, `credentials` and `maxAge` ([expressjs/cors](https://github.com/expressjs/cors/blob/master/_autodocs/configuration.md)).
- **Preflight caching.** Browsers cap `Access-Control-Max-Age`: Chromium 76+ at 7200 s, Firefox at 86400 s. The default is 5 s ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Max-Age)). Any request with `Authorization`, `Idempotency-Key` or `X-Request-Id` is preflighted. The preflight cache is keyed per URL. A plain public GET with no custom headers needs no preflight, which matters for the 5 s auction poll.
- **Proposed config.**
  - Production: `origin: ['https://foaglobal.org', 'https://www.foaglobal.org']`.
  - Staging: the staging origin, plus `/^https:\/\/<project>-(git-[a-z0-9-]+|[a-z0-9]{9})-<scope>\.vercel\.app$/`.
  - Both:
    - `credentials: false`: Bearer only, no cookies.
    - `allowedHeaders: Authorization, Content-Type, Idempotency-Key, X-Request-Id`.
    - `exposedHeaders: X-Request-Id`.
    - `maxAge: 7200`.

### 2. Auth (Clerk ↔ Express)

- **Getting the token.** In the browser, `useAuth().getToken()` returns a token to send as `Authorization: Bearer`. On the server, `(await auth()).getToken()` does the same ([Clerk useAuth](https://github.com/clerk/clerk-docs/blob/main/clerk-typedoc/react/use-auth.mdx)). Session tokens expire after **60 s**, so fetch one per request and never store it in a `'use cache'` scope ([Clerk session token](https://github.com/clerk/clerk-docs/blob/main/docs/guides/how-clerk-works/overview.mdx)).
- **Verifying without a network call.** Use `clerkMiddleware({ authorizedParties, jwtKey })` and pass `jwtKey` = the PEM public key, or set `CLERK_JWT_KEY` instead. Without `jwtKey`, `verifyToken` fetches the JWKS from Clerk's Backend API ([clerkMiddleware options](https://github.com/clerk/clerk-docs/blob/main/docs/_partials/clerk-middleware-options.mdx), [verifyToken](https://github.com/clerk/clerk-docs/blob/main/clerk-typedoc/backend/verify-token.mdx)). Just-in-time `User` creation (§3.4) still calls `clerkClient.users.getUser` once per new user, so `CLERK_SECRET_KEY` stays. The SDK convention also expects `CLERK_PUBLISHABLE_KEY` on the backend ([Clerk SDK env conventions](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/sdk-development/conventions.mdx)).
- **`authorizedParties` is an exact-match `includes()` on the token's `azp` claim.** Since `@clerk/backend` 3.11.1 (merged 2026-07-07), a token with no `azp` is **rejected** whenever `authorizedParties` is set ([source: assertions.ts](https://github.com/clerk/javascript/blob/1e139174c8b84162261ed54c99cc88e03288aedf/packages/backend/src/jwt/assertions.ts), [PR #8877](https://github.com/clerk/javascript/issues/8877), [issue #9249](https://github.com/clerk/javascript/issues/9249)). Browser-minted tokens carry `azp` = the page origin (example in [verifyToken docs](https://clerk.com/docs/reference/backend/verify-token)).
  - Production: list the exact web origins.
  - Staging: a list cannot hold regexes. Omit `authorizedParties` there and check `getAuth(req).sessionClaims.azp` against the same regex used for CORS.
- **Clerk webhooks.** Use `verifyWebhook(req)` from `@clerk/express/webhooks` behind `express.raw({ type: 'application/json' })`, reading `CLERK_WEBHOOK_SIGNING_SECRET`. Svix delivers them on its retry schedule (see §5) ([Clerk syncing](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/webhooks/syncing.mdx), [overview](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/webhooks/overview.mdx)). The development instance sends to the staging API and the production instance to the production API, each with its own secret.

### 3. Revalidation

- **Which call to use.** `updateTag` **throws outside Server Actions**. A route handler must use `revalidateTag(tag, 'max')`, which serves stale content while refreshing in the background, or `revalidateTag(tag, { expire: 0 })`, which expires immediately. Next's docs name `{ expire: 0 }` for webhooks and third-party callers that need instant updates. Calling it with no second argument is deprecated ([Next 16.2 revalidateTag](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/04-functions/revalidateTag.mdx), [updateTag](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/04-functions/updateTag.mdx)).
- **What a purge does on Vercel** ([Vercel purge](https://vercel.com/docs/caching/cdn-cache/purge), updated 2026-09-03).
  - `revalidateTag(tag,'max')` maps to *invalidate*. A tag purge clears the CDN, Runtime and Data caches, and ISR-cached routes get 300 ms global purges.
  - **Tags are scoped to the project and environment** (production or preview).
  - Purge calls are rate-limited: Hobby 50/s per team, Pro 200/s. `next/cache` **does not throw** when limited. It only logs a warning, so the API cannot detect a dropped purge.
- **Preview protection.** Standard Deployment Protection (`all_except_custom_domains`) protects preview and generated URLs but not the production custom domain. The staging API must send `x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET` ([Vercel protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication), [bypass for automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)).
- **Alternative.** Vercel's REST `invalidate-by-tag` takes a target environment and needs no route in the web app. It does mean storing a Vercel access token on the VPS (same purge doc).

### 4. Latency (India; NFR-01, NFR-02)

- **Regions.** Vercel functions run in `iad1` (Washington DC) by default. Change this with project settings or `vercel.json` `"regions": ["bom1"]`. `bom1` = Mumbai, AWS `ap-south-1`. Hobby allows a single region, Pro up to 5. Vercel's advice is to put functions close to their data source ([function regions](https://vercel.com/docs/functions/configuring-functions/region), [regions list](https://vercel.com/docs/regions), both updated 2026-08-11). With the default, every sequential server fetch makes a US↔India round trip, and the first one on a connection also pays for TLS setup. That spends the LCP < 2.5 s budget fast.
- **Keep-alive.** Node 24's `fetch` uses undici, which keeps sockets alive by default: a 4 s idle timeout, which server `Keep-Alive` hints can raise to 600 s, and 100 cached TLS sessions ([undici Client](https://github.com/nodejs/undici/blob/main/docs/docs/api/Client.md)). Next only polyfills and configures keep-alive itself on Node < 18 (`httpAgentOptions`) ([Next httpAgentOptions](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/05-config/01-next-config-js/httpAgentOptions.mdx)). Fluid compute shares one instance across invocations, so warm sockets get reused ([Fluid compute](https://vercel.com/docs/fluid-compute)). Raising undici's idle timeout via `setGlobalDispatcher` is optional. Measure before adding it.
- **Caching.** Plain `'use cache'` is **in-memory per instance**, so in serverless it may re-run on every request. Shared, durable caching needs `'use cache: remote'`, which on Vercel is Runtime Cache and can be purged by tag ([Next caching](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/01-getting-started/08-caching.mdx), [use cache: remote](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/01-directives/use-cache-remote.mdx); Vercel purge doc).
  - Public data in the static shell: `'use cache'` + `cacheTag`.
  - Public data under dynamic boundaries: `'use cache: remote'` + `cacheTag`.
  - Signed-in reads: never cached.
- **Browser → API.** Browser calls go straight to the VPS, so a VPS in India is what keeps NFR-02's p95 meaningful for users. Preflights add one round trip per new URL, per `maxAge` window (§1).
- **Rate limits.** Server-side public fetches reach the API from Vercel's egress IPs, so the §8.1 per-IP limit of "general 300/min" would throttle all SSR together. Exempt requests that carry a server-only secret header.

### 5. Inbound webhooks (Razorpay, Resend)

- **Raw body.** Mount `/api/v1/webhooks/*` with `express.raw({ type: 'application/json' })` **before** the global `express.json()`, matching §8.1.
- **Razorpay.**
  - **Verify:** `validateWebhookSignature(rawBody, X-Razorpay-Signature, secret)` takes the **raw body string** ([razorpay-node wiki](https://github.com/razorpay/razorpay-node/wiki/Home)). The SDK's own example uses `JSON.stringify(payload)`. Do not copy that: Razorpay says not to parse the body.
  - **Delivery:** a 2xx is required **within 5 s**. Delivery is at-least-once and may arrive out of order. Failures are retried with exponential backoff for **24 h from event creation**. After that the webhook is **disabled** and an alert email is sent.
  - **Dedupe and test mode:** deduplicate on `x-razorpay-event-id`. Test-mode and live-mode webhooks are configured separately ([best practices](https://razorpay.com/docs/webhooks/best-practices), [FAQs](https://razorpay.com/docs/webhooks/faqs), [recurring webhooks](https://razorpay.com/docs/us/api/payments/recurring-payments/webhooks)).
  - **IP allowlist:** Razorpay publishes webhook IPs but still recommends signature checks ([whitelists](https://razorpay.com/docs/security/whitelists)).
- **Resend (and Clerk), both via Svix.**
  - **Verify:** check the `svix-id`, `svix-timestamp` and `svix-signature` headers over the **raw** body with `resend.webhooks.verify(...)` or svix `Webhook.verify` ([Resend verify](https://resend.com/docs/webhooks/verify-webhooks-requests)).
  - **Retry schedule:** immediately, then 5 s, 5 min, 30 min, 2 h, 5 h, 10 h and 10 h, about 27.6 h in total. After 5 days of failures Svix disables the endpoint ([Resend retries](https://resend.com/docs/webhooks/retries-and-replays), [Svix retries](https://docs.svix.com/retries)).
  - **Response window:** Svix allows 30 s for a 2xx.
  - **Dedupe:** `webhook-id`/`svix-id` stays the same across retries, so deduplicate on it ([Svix idempotency](https://docs.svix.com/idempotency)).
  - **Clock:** timestamp tolerance is **5 min** ([svix tests](https://github.com/svix/svix-webhooks/blob/main/javascript/src/webhook.test.ts)), so the VPS clock must be NTP-synced.
- **Pattern for all providers.** Verify, then insert into `WebhookEvent` (unique provider + event id, `ON CONFLICT DO NOTHING`), then enqueue a pg-boss job, then return 200. This stays inside Razorpay's 5 s window and fits §3.6. Downtime shorter than the retry windows heals itself. The §3.6 reconciliation job covers longer Razorpay gaps.

## Recommendation

1. **Topology.** Run two API instances on the VPS. Production `api.foaglobal.org` uses Clerk prod, Razorpay live and the prod DB. **Staging** (e.g. `api-staging.foaglobal.org`) uses Clerk dev, Razorpay test and a staging DB. All Vercel previews point at staging. This replaces "Railway PR environment / Neon branch per PR" in §3.7, and the DB shape is decided in #3/#7. Keep the default `*.vercel.app` previews; a Preview Deployment Suffix is only needed if previews need production Clerk.
2. **Region.** Add `vercel.json` `"regions": ["bom1"]` and put the VPS in Mumbai. Measure SSR→API round-trip time once the host is chosen (#7/#11).
3. **API middleware order:**
   1. helmet
   2. cors (exact list in prod; list + preview regex in staging; `maxAge: 7200`, `credentials: false`)
   3. webhooks router with `express.raw`
   4. `express.json()`
   5. `clerkMiddleware({ jwtKey, authorizedParties })` (staging: an `azp` regex check instead of `authorizedParties`)
   6. rate limiter keyed on `req.ip`, with `trust proxy` set and the server-key exemption
4. **Revalidation.** The web's `POST /api/revalidate` checks a constant-time `Authorization: Bearer REVALIDATE_SECRET`, validates `{ tags: string[] }` with Zod, and calls `revalidateTag(t, 'max')`. Use `{ expire: 0 }` for safeguarding takedowns (SG-05, consent withdrawal), which must never serve stale content. The API sends it from the **worker** as a retried pg-boss job and batches tags. Staging adds the Vercel bypass header and targets one stable preview URL.
5. **Webhooks.** Use the verify → store-once → enqueue → 200 pattern from §5 for Clerk, Razorpay and Resend, with a separate secret per environment.
6. **SPEC env additions (§3.7).**
   - API: `CLERK_JWT_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_AUTHORIZED_PARTIES`, `CORS_ORIGIN_PATTERN` (staging only), `WEB_REVALIDATE_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET` (staging only), `API_SERVER_KEY`.
   - Web: `API_SERVER_KEY`, server-only and never `NEXT_PUBLIC_`.

## Open risks

- **The preview-origin regex can be spoofed.** A Vercel team whose slug ends in `-<scope>` would match it. The impact is low because previews only reach staging, auth is Bearer-only and no cookies are involved. Truncating labels over 63 characters can also stop long branch names from matching.
- **Unverified purge scope.** "Tags scoped per environment" suggests one preview purge clears every preview deployment. Test this before relying on it.
- **Silent purge drops.** `next/cache` purges that hit the rate limit fail silently, so log the purge in the web's route handler.
- **Clerk `azp` enforcement (3.11.1+).** Tokens without `azp` get a 401. Check that tokens forwarded from server components carry `azp`, and re-test on every `@clerk/*` upgrade.
- **One VPS is a single point of failure.** Webhook retries cover about 24 h (Razorpay) and about 27.6 h (Svix). After that, Razorpay disables the webhook and needs re-enabling by hand.
- **Unmeasured latency.** VPS ↔ `bom1` latency is not measured yet. Raising the keep-alive idle timeout is still an unmeasured option.
- **Plan-gated features.** Preview Deployment Suffix and multi-region need Pro. Not needed if previews stay on `*.vercel.app`.
- **Map is out of sync.** §3.1 and §3.7 still say Railway and Neon, which the map has ruled out. The `docs:` PR for #7 should change them along with this ticket's env additions.

## Sources (accessed 2026-11-16)

- Vercel: [generated URLs](https://vercel.com/docs/deployments/generated-urls) (2026-09-08) · [function regions](https://vercel.com/docs/functions/configuring-functions/region) (2026-08-11) · [regions](https://vercel.com/docs/regions) (2026-08-11) · [CDN purge](https://vercel.com/docs/caching/cdn-cache/purge) (2026-09-03) · [protection bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) (2026-09-16) · [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication) · [Fluid compute](https://vercel.com/docs/fluid-compute) (2026-08-24)
- Next.js v16.2.9 docs: [revalidateTag](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/04-functions/revalidateTag.mdx) · [updateTag](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/04-functions/updateTag.mdx) · [caching](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/01-getting-started/08-caching.mdx) · [use cache: remote](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/01-directives/use-cache-remote.mdx) · [httpAgentOptions](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/05-config/01-next-config-js/httpAgentOptions.mdx)
- Clerk: [clerk-docs (main)](https://github.com/clerk/clerk-docs) pages linked above · [assertions.ts](https://github.com/clerk/javascript/blob/1e139174c8b84162261ed54c99cc88e03288aedf/packages/backend/src/jwt/assertions.ts) · [PR #8877](https://github.com/clerk/javascript/issues/8877) (2026-07-07) · [issue #9249](https://github.com/clerk/javascript/issues/9249)
- Razorpay: [webhook best practices](https://razorpay.com/docs/webhooks/best-practices) · [FAQs](https://razorpay.com/docs/webhooks/faqs) · [IP whitelists](https://razorpay.com/docs/security/whitelists) · [razorpay-node wiki](https://github.com/razorpay/razorpay-node/wiki/Home)
- Resend / Svix: [verify](https://resend.com/docs/webhooks/verify-webhooks-requests) · [retries](https://resend.com/docs/webhooks/retries-and-replays) · [Svix retries](https://docs.svix.com/retries) · [Svix idempotency](https://docs.svix.com/idempotency) · [svix tests](https://github.com/svix/svix-webhooks/blob/main/javascript/src/webhook.test.ts)
- Other: [expressjs/cors](https://github.com/expressjs/cors) · [Express 5 History](https://github.com/expressjs/express/blob/v5.1.0/History.md) · [undici Client](https://github.com/nodejs/undici/blob/main/docs/docs/api/Client.md) · [Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) · [MDN Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Max-Age) (2025-11-21)
