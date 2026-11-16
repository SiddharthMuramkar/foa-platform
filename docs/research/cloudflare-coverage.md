# What Cloudflare can cover in the FOA stack

Research for [#17](https://github.com/SiddharthMuramkar/foa-platform/issues/17). Date: 2026-11-16. Scope: SPEC §3.1 (Email, Observability, Analytics, Bot protection, API hosting, File storage rows), §3.7, FR-NOTIF-03/04, NFR-05, NFR-09. Builds on #3 (R2 facts), #10 (non-Vercel parts), #11 (Sentry Uptime/Crons, host checks). Siblings own the details: #15 (Next.js on Workers), #16 (edge ↔ VPS, webhook paths, edge caching), #18 (backups, media protection, purge).

## Answer

Cloudflare covers the edge, not the backend. Use it for the web app (Workers, #15), R2 with `media.foaglobal.org`, DNS, Turnstile, and Web Analytics (replaces Vercel Web Analytics). Email Routing is optional, for inbound role addresses. `foaglobal.org` is already registered at Cloudflare Registrar and uses Cloudflare DNS. Keep **Resend**: Cloudflare Email Sending is in beta and allows transactional mail only, and FOA sends consent-gated newsletters and broadcasts. Keep **Sentry**: Cloudflare has no browser-error, Express or cron monitoring, and Health Checks need a Pro zone. Postgres 17 can't run on Cloudflare (there is no Postgres product, and Container disks are ephemeral), so the Mumbai VPS keeps api, worker and Postgres.

## 1. Email: Cloudflare Email Service vs Resend

| Need (SPEC) | Cloudflare Email Sending | Resend |
|---|---|---|
| Status, plan | **Public beta** since 2026-04-16; arbitrary recipients need Workers Paid [1][6] | GA |
| Send from the Express API on the VPS | REST `POST /accounts/{id}/email/sending/send`, SMTP, or a Workers binding [4] | REST/SDK; Node SDK accepts `react:` directly [11] |
| Non-transactional mail (FR-NOTIF-03 newsletters, invitations, campaigns; FR-NOTIF-07 broadcasts) | **Not allowed**: "Email Service supports transactional email only" [2] | Supported (Broadcasts, Topics with per-topic unsubscribe) [10] |
| One-click unsubscribe | `List-Unsubscribe` (https/mailto) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` allowlisted; any other non-`X-` header rejects the whole send [5] | Custom `headers` accepted [10] |
| Delivery events (FR-NOTIF-04) | Six event types (`delivered`, `deferred`, `bounced`, `failed`, `rejected`, `complained`), delivered **only through a Queues event subscription** per sending domain [6]. The VPS must pull over HTTP (`/messages/pull` plus `/ack`) or run a Worker consumer that forwards to the API [8] | Svix-signed webhooks (`email.delivered`, `email.bounced`, `email.complained`, …) POST straight to the API; same verification code as Clerk [9] |
| Suppression | Automatic for hard bounces and complaints; suppression-list API [3][6] | Automatic suppression, surfaced as bounce subtype `Suppressed` [9] |
| Idempotent retries | No idempotency key in the send API docs | `idempotencyKey`, 24 h window [10] |
| React Email (`packages/emails`) | Works: render with `render()` from `react-email`, then send `html`/`text` [12] | Works natively (`react:` prop, Node only) [11][12] |
| Quotas | New accounts start on a "conservative daily quota" that grows with reputation; 50 recipients per email [3]. Attachment limits conflict across the docs: 25 MiB on the limits page vs 5 MiB on the send/SMTP pages [3][4] | — |
| DNS | Onboarding adds MX/SPF/DKIM on `cf-bounce.<domain>` plus `_dmarc`; the domain must be a zone in the account [7] | MX + SPF on `send.<domain>`, DKIM `resend._domainkey`; Domain Connect auto-setup for Cloudflare DNS [13] |

**Email Routing (inbound)** runs on Free and Paid plans. It forwards to verified addresses or to a Worker, with 200 rules per domain [1][3]. It needs exclusive control of the apex MX records, and fails with error 2008 when another provider's MX exists [7]. `foaglobal.org` has no MX today (§6), so nothing conflicts. Resend's `send.` MX and Clerk's `clkmail` records sit on subdomains.

**Fit:** Email Sending can't carry FOA's non-transactional mail, so it would add a second provider, not replace Resend. **Gap list:** beta status, transactional-only policy, events only via Queues, no idempotency key, a reputation-gated quota.

## 2. Monitoring: Cloudflare vs Sentry (NFR-09)

| NFR-09 item | Cloudflare | Sentry (decided in #11) |
|---|---|---|
| Server errors, web Worker | **Workers Issues** (open beta): groups uncaught exceptions, failed invocations, 5xx and `console.error`, with source maps and automations [15] | `withSentry` from `@sentry/nextjs/cloudflare` wraps the OpenNext worker entry (needs `nodejs_compat`, compat date ≥ 2025-08-16) [17] |
| Browser errors | None (Web Analytics collects performance timings, not errors [19]) | `@sentry/nextjs` client |
| Errors/perf in Express api and pg-boss worker | None: they don't run on Workers | `@sentry/node` |
| Logs | Workers Logs: 7-day retention on Workers Paid (3 days on Free), 256 KB per invocation, JSON fields indexed [14]. Invocation logs capture request metadata and headers [14][16]; `invocation_logs: false` turns them off | pino + `pinoIntegration` (#11) |
| Traces | Workers automatic tracing (OTel); export logs and traces over OTLP to Sentry with `persist: false` [16] | Sentry tracing |
| Uptime on `/health` every minute | Standalone Health Checks: **not on Free**; Pro allows 10 checks [18]. Load Balancing monitor docs give a 60 s minimum interval on Pro [18]. Email alert after a majority of regions change state [18] | Sentry Uptime, 1 min (#11) |
| Cron / scheduled job check-ins | None for jobs outside Workers | Sentry Crons (#11) |
| Web Vitals (RUM) | Web Analytics, cookieless (§3) | Browser tracing |

**Bundle note (NFR-01):** Sentry's own size-limit CI lists `@sentry/nextjs (client)` at 52.25 kB compressed, about 31 % of the 170 KB public-route budget [17b]. The Web Analytics beacon is 10.3 kB gzip (measured, §3). Option: drop Sentry browser tracing, keep browser error capture, and take Web Vitals from Web Analytics.

**Sentry on OpenNext is supported but fragile:** `@sentry/nextjs` 10.75.2 and 10.75.3 returned 500 on every SSR page under OpenNext. The fix went into v10 (PR #25730), and v11 is not affected. Sentry CI now runs `nextjs-16` on Cloudflare Workers [17c].

**Fit:** Cloudflare can add zero-code Worker-side signals (Issues, Logs, OTLP export). It can't cover the browser, the api, the worker or crons. Sentry stays the NFR-09 system.

## 3. Analytics: Cloudflare Web Analytics (§3.1 Analytics row)

- Cookieless: no cookies or `localStorage`, and no fingerprinting by IP or user agent [19]. Proxied sites are unlimited; non-proxied sites are limited to 10 [19].
- Tracks page views, visits and Core Web Vitals. SPAs are handled through Soft Navigations, the Navigation API or a History API patch [19]. **No custom events** ("Not yet") [19].
- Data: unsampled for 7 days, then aggregated to about 10 %. Dashboard and GraphQL queries are sampled dynamically [19].
- Setup: automatic edge injection works on proxied HTML, but not when `Cache-Control: no-transform` is set [19]. Path rules (include or exclude) exist only for proxied sites [19]. The manual snippet loads `https://static.cloudflareinsights.com/beacon.min.js`, which posts to `cloudflareinsights.com` (or `/cdn-cgi/rum` when auto-injected) [19].
- CSP (NFR-05): `script-src` beacon URL; `connect-src cloudflareinsights.com` for the manual snippet, `'self'` for auto-injection [19]. Next.js nonce CSP uses `'strict-dynamic'` and applies nonces only on dynamically rendered pages [20]. So load the beacon with `next/script` in the public layout only: dashboards are then excluded by construction, and the script inherits nonce trust. Don't rely on edge injection.
- Size: `beacon.min.js` is 31,853 B raw and 10,278 B gzip (fetched 2026-11-16) [19b].

**Fit:** a direct replacement for "Vercel Web Analytics (cookieless) on public pages only". **Gaps:** no custom events or conversions, and long-term data is sampled. DB-derived KPIs (§7.12) are unaffected.

## 4. Bot protection

**Turnstile on public forms** (contact, guest donate, pledge, guest event registration, newsletter)
- Server-side `siteverify` is mandatory. Tokens are valid for 300 s and single use (`timeout-or-duplicate` on reuse). Pass `remoteip`, and check `hostname`/`action`. An `idempotency_key` makes retries safe [21].
- The Free plan allows 20 widgets and 10 hostnames per widget. A hostname covers its subdomains. "Any hostname" is Enterprise only [21]. Non-prod uses the test keys (`1x…AA` passes, `2x…AA` fails, `3x…AA` returns spent), as decided in #10 [21].
- CSP: `script-src` and `frame-src https://challenges.cloudflare.com` [21].

**Clerk Protect's own Turnstile**
- "Challenge suspicious sign-ups" runs Clerk's Turnstile, with Clerk-managed keys. It sits alongside Device Intelligence and the disposable-email and subaddress blocks: this matches SPEC §3.1 [22]. Nothing to configure in FOA's Cloudflare account.
- Custom flows must render `<div id="clerk-captcha">` before `signUp.create()`. Otherwise the SDK falls back to an invisible widget that blocks suspected bots without a challenge [22].
- Clerk's CSP adds `frame-src https://challenges.cloudflare.com https://*.protect.clerk.com` and `connect-src <FAPI> https://*.protect.clerk.com` [22].
- Clerk's Frontend API CNAME must be **DNS only** (grey cloud), or Clerk's DNS check fails [22]. Keep Clerk's email CNAMEs DNS-only as well: a proxied CNAME doesn't resolve to its target (our inference, not stated by Clerk). DNS-only hostnames bypass Cloudflare's proxy, bot and WAF features entirely.

**Zone bot settings vs webhooks, the API and Clerk**
- **Bot Fight Mode (Free)** can't be skipped by WAF custom rules or Page Rules, because it runs outside the Ruleset Engine. It "may challenge API or mobile app traffic" [23]. On a proxied `api.foaglobal.org`, that puts the Razorpay, Clerk/Svix and Resend webhooks, and the browser's `fetch` to the API, at risk. One escape: an IP Access rule that matches first stops BFM [23], and Razorpay publishes its webhook IPs [26]. Recommendation: leave BFM **off**.
- **Super Bot Fight Mode (Pro+)** runs after custom rules and supports a *Skip* rule. Exempt the webhook paths and `/health` there [23].
- **Browser Integrity Check** is on by default and can be skipped per path with a custom rule or a configuration rule. On `*.workers.dev` it can't be turned off [24].
- BFM/SBFM JavaScript Detections inject scripts under `/cdn-cgi/challenge-platform/`, and Cloudflare copies the CSP nonce from the response header [23].
- Edge rate limiting on Free: 1 rule, IP only, 10 s period. Pro: 2 rules, up to 1 min [25]. App-level `rate-limiter-flexible` stays.
- Path-level webhook rules (raw body, timeouts) are #16's job.

## 5. Compute and data: can the backend move to Cloudflare?

| FOA piece | Cloudflare option | Fit / gap |
|---|---|---|
| `api` (Express 5) | Workers: `node:http` servers via `httpServerHandler` (on by default with `nodejs_compat` from compat date 2025-09-01) [28]; or Containers | Runs, but Postgres stays on the VPS, so every Prisma query crosses edge → Mumbai (Hyperdrive pools connections; it is not a database) [29]. 128 MB per isolate [27]. No gain for NFR-02. |
| `worker` (pg-boss, `sharp`, `ffmpeg`) | Workers | **No**: no native add-ons, and `child_process` is a stub [28] |
|  | Containers (GA 2026-04-13) [30] | Full Linux, up to 4 vCPU / 12 GiB / 20 GB disk [30]. But Cloudflare "does not guarantee that any container instance will run for a set period". Containers stop on inactivity (timeout ≤ 6 h) [30]. Placement is region-level only (`APAC`, not a city) [30]. An always-on pg-boss poller doesn't fit. |
|  | Queues + Cron Triggers instead of pg-boss | Cron CPU limit is 30 s for intervals under 1 h; consumers get 15 min wall time [27]. A Cloudflare queue can't join a Postgres transaction, so #10's atomic "store `WebhookEvent` + enqueue job" would need an outbox. |
| Postgres 17, persistent | — | No Cloudflare Postgres. D1 and Durable Objects are SQLite. Hyperdrive only connects to an external Postgres [29]. The PlanetScale databases sold through Cloudflare billing are PlanetScale-hosted [29]. Container disks are ephemeral and wiped on sleep; snapshots are immutable, ≤ 20 GB and kept 30 days; FUSE → R2 is "not SSD-like" [30]. |

**What keeps the Docker VPS:**
1. Postgres needs a durable disk.
2. pg-boss needs an always-on process, with jobs enqueued inside the same DB transaction.
3. `sharp` and `ffmpeg` need native binaries.
4. api ↔ DB locality is required for NFR-02.

Containers remain a later option for offloading media transcodes only.

## 6. DNS and domains

**Current state** (observed 2026-11-16 via `dig`/`whois`) [31]:
- `foaglobal.org` has been registered at **Cloudflare Registrar** since 2026-07-23, expiring 2036-07-23.
- Nameservers are `cruz`/`dakota.ns.cloudflare.com`. **DNSSEC is unsigned.** No A, AAAA, MX or TXT records are published.
- Registrar domains must stay on Cloudflare full-setup DNS [31]. "Moving DNS" is therefore already done. What remains: enable DNSSEC (one click; DS published within 1–2 days) [31], then create the records.

| Host | Record | Note |
|---|---|---|
| apex, `www` | Workers Custom Domain (DNS and certificate created automatically) | Not allowed on a hostname with an existing CNAME [32] |
| `media` | R2 custom domain on `foa-public` (CNAME added automatically) | Zone and bucket must be in the **same account**. Custom domains enable caching, WAF and access rules; `r2.dev` does none of those, so disable it. Smart Tiered Cache recommended [33]. Presigned URLs work only on the S3 endpoint, not the custom domain (#3) |
| `api` | Tunnel or proxied record | #16 |
| Clerk FAPI and email CNAMEs | from the Clerk dashboard | **DNS only** [22] |
| `send` MX/TXT, `resend._domainkey` | Resend | DNS only [13] |
| `_dmarc` | TXT | Shared by all senders |
| apex MX (optional) | Email Routing | Only if inbound role addresses are wanted [7] |

**Purge:** all purge methods (URL, tag, prefix, hostname, everything) are available on every plan. Single-file purge runs at 800 URLs/s on Free [34]. SG-05 flow and tags: #18.

## Recommendation

1. **Email:** keep Resend for all outbound mail. Don't adopt Cloudflare Email Sending: it's transactional-only and beta. Optionally use Email Routing to forward role addresses (e.g. `safeguarding@`, `contact@`) to staff mailboxes; this needs no code.
2. **Monitoring:**
   - Keep Sentry on web, api and worker, plus Sentry Uptime and Crons (#11).
   - On the web Worker, enable `observability` (Logs + Issues). Optionally export OTLP to Sentry with `persist: false`, but first check for PII in the invocation logs.
   - Skip Cloudflare Health Checks: they need a Pro zone and duplicate Sentry Uptime.
   - Measure the Sentry client bundle in S0. If needed, drop browser tracing and use Web Analytics for Web Vitals.
3. **Analytics:** replace Vercel Web Analytics with Cloudflare Web Analytics. Load the manual beacon through `next/script` in the public layout only, and add its CSP entries.
4. **Bot protection:**
   - Turnstile as in SPEC, verified in Express (hostname, action, idempotency key), with test keys outside prod.
   - Clerk Protect unchanged; Clerk records DNS-only.
   - Zone: Bot Fight Mode **off**. If the zone moves to Pro: Super Bot Fight Mode plus a Skip rule for webhook paths and `/health`.
5. **Compute/data:** the VPS keeps api, worker and Postgres 17. Hyperdrive, D1, Durable Objects, Containers and Queues are not used.
6. **DNS:** enable DNSSEC now. Connect `media.foaglobal.org` to `foa-public` in the same account as the zone, and disable `r2.dev`. Keep the zone, Workers and media R2 in one account (backup buckets may live elsewhere, per #18).

## Open risks

- **#15 must weigh vinext.** Cloudflare's Next.js guide (2026-11-05) now recommends **vinext** (beta) as the default. OpenNext is positioned for apps that "cannot yet migrate" [35]. OpenNext's own source calls running Node.js `proxy.ts` middleware on workerd "experimental and not supported by the OpenNext maintainers" [36].
- **CSP vs caching:** nonces need dynamic rendering [20], while public pages use Cache Components. The CSP strategy for cached pages, which also covers the beacon, Turnstile and Clerk, is unresolved and belongs with #15.
- **Workers Logs and PII (NFR-06):** request headers are captured [14][16]. Whether Cookie and Authorization headers are redacted is unverified.
- **Bot Fight Mode** is a one-click toggle that can't be scoped. Turning it on later could silently break webhooks and API calls.
- **Web Analytics** has no custom events, and data older than 7 days is sampled.
- **Sentry on OpenNext** has regressed before [17c]. Pin versions and smoke-test SSR in CI.
- **Health Checks** require Pro if a Cloudflare-side origin check is ever wanted.
- **If single-vendor email is pursued later,** Cloudflare's transactional-only policy blocks FR-NOTIF-03/07 mail.

## SPEC passages affected

| Passage | Change | Owner |
|---|---|---|
| §3.1 Analytics row | "Vercel Web Analytics" → "Cloudflare Web Analytics (cookieless), manual beacon in the public layout only" | #17 |
| §3.1 Email row | Resend unchanged; add "optional Cloudflare Email Routing for inbound role addresses" | #17 |
| §3.1 Observability row, NFR-09 | Sentry unchanged; add Workers Logs/Issues on the web Worker (optional OTLP → Sentry) | #17 (with #11's PR) |
| §3.1 Bot protection row | Add: Clerk DNS records DNS-only; Bot Fight Mode off; Super Bot Fight Mode Skip rule for webhooks if Pro | #17 / #16 |
| §3.1 File storage row | `media.foaglobal.org` = R2 custom domain in the zone's account; `r2.dev` disabled | #17 / #18 |
| §3.1 Web hosting, API hosting rows; ADR `0003-hosting-…` | Cloudflare Workers + VPS; no Postgres on Cloudflare | #15, #7 |
| §3.7 | DNS record table above; DNSSEC on; Web Analytics token env (`NEXT_PUBLIC_CF_BEACON_TOKEN`); zone ID and purge token per #18 | #17 / #18 |
| NFR-05 | CSP additions: `challenges.cloudflare.com` (script, frame), `*.protect.clerk.com` (frame, connect), Clerk FAPI (connect), Web Analytics beacon (script) + `cloudflareinsights.com` (connect) | #17 / #15 |
| NFR-01 | Sentry client bundle check against the 170 KB budget | #17 note for S0 |

## Sources (accessed 2026-11-16; "upd." = page's last-updated date)

1. Cloudflare Email Service overview (upd. 2026-10-15): https://developers.cloudflare.com/email-service/. Plan availability: https://developers.cloudflare.com/email-service/platform/pricing/
2. Email Service FAQ, "transactional email only" (upd. 2026-10-15): https://developers.cloudflare.com/email-service/reference/faq/
3. Email Service limits (upd. 2026-10-30): https://developers.cloudflare.com/email-service/platform/limits/. Suppressions: https://developers.cloudflare.com/email-service/concepts/suppressions/
4. Email Service REST API, error codes, attachments (5 MiB): https://developers.cloudflare.com/email-service/api/send-emails/rest-api/. SMTP (5 MiB `SIZE`): https://developers.cloudflare.com/email-service/api/send-emails/smtp/
5. Email Service allowlisted headers: https://developers.cloudflare.com/email-service/reference/headers/
6. Email Service changelog (2026-04-16 public beta; 2026-07-15 Queues events): https://developers.cloudflare.com/email-service/platform/changelog/. Event subscriptions: https://developers.cloudflare.com/email-service/reference/event-subscriptions/
7. Email Service domains (onboarding, `cf-bounce`, Email Routing MX exclusivity): https://developers.cloudflare.com/email-service/configuration/domains/. Troubleshooting (error 2008): https://developers.cloudflare.com/email-service/reference/troubleshooting/
8. Queues pull consumers: https://developers.cloudflare.com/queues/configuration/pull-consumers/
9. Resend webhooks (`email.bounced`, `email.complained`, `email.delivered`): https://resend.com/docs/webhooks/emails/bounced. Verify with Svix: https://resend.com/docs/webhooks/verify-webhooks-requests
10. Resend Topics: https://resend.com/docs/dashboard/contacts/manage-topics. List-Unsubscribe: https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails. Idempotency keys: https://resend.com/docs/dashboard/emails/idempotency-keys
11. Resend `emails.send()` (`react` Node-only): https://resend.com/docs/send-with-cloudflare-workers
12. React Email `render()` with other providers: https://github.com/resend/react-email/blob/canary/apps/docs/integrations/aws-ses.mdx
13. Resend DNS on Cloudflare (Domain Connect, records, DNS-only): https://resend.com/docs/guides/dns/cloudflare. https://resend.com/docs/add-a-domain
14. Workers Logs (upd. 2026-11-12): https://developers.cloudflare.com/workers/observability/logs/workers-logs/
15. Workers Issues (upd. 2026-10-12): https://developers.cloudflare.com/workers/observability/issues/
16. Workers OpenTelemetry export: https://developers.cloudflare.com/workers/observability/opentelemetry-export/. Export to Sentry: https://developers.cloudflare.com/observability/export/opentelemetry/sentry/. Trace-events limit, "request metadata, and headers are automatically captured" (2025-04-07): https://developers.cloudflare.com/changelog/post/2025-04-07-increase-trace-events-limit/
17. Sentry, Next.js on Cloudflare: https://docs.sentry.io/platforms/javascript/guides/nextjs/cloudflare/
    - 17b. Sentry size-limit table (`@sentry/nextjs (client)` 52.25 kB) in PR #25730: https://github.com/getsentry/sentry-javascript/pull/25730
    - 17c. Issue #25683 (10.75.2/10.75.3 break OpenNext): https://github.com/getsentry/sentry-javascript/issues/25683. Fix PR #25730 (above). Cloudflare CI suite, PR #24999: https://github.com/getsentry/sentry-javascript/pull/24999
18. Cloudflare Health Checks, availability (upd. 2026-08-14): https://developers.cloudflare.com/health-checks/. Notifications: https://developers.cloudflare.com/health-checks/how-to/health-checks-notifications/. Monitor intervals (60 s Pro): https://developers.cloudflare.com/load-balancing/monitors/
19. Web Analytics FAQ (sampling, custom events, CSP, Workers RUM): https://developers.cloudflare.com/web-analytics/faq/. Get started: https://developers.cloudflare.com/web-analytics/get-started/. SPA: https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/. Limits: https://developers.cloudflare.com/web-analytics/limits/. Rules: https://developers.cloudflare.com/web-analytics/configuration-options/rules/. Data collection: https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/. Privacy: https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/
    - 19b. Beacon measured: https://static.cloudflareinsights.com/beacon.min.js (31,853 B; 10,278 B after `gzip -9`; fetched 2026-11-16)
20. Next.js 16.4 CSP guide (nonce, `strict-dynamic`, dynamic rendering required): https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/content-security-policy.mdx
21. Turnstile server-side validation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/. Hostname management: https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/. Plans: https://developers.cloudflare.com/turnstile/plans/. CSP: https://developers.cloudflare.com/turnstile/reference/content-security-policy/. Test keys: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
22. Clerk protections: https://clerk.com/docs/guides/protect/bot-protection. Custom-flow CAPTCHA: https://clerk.com/docs/guides/development/custom-flows/authentication/bot-sign-up-protection. CSP: https://clerk.com/docs/guides/secure/best-practices/csp-headers. Production DNS (Cloudflare "DNS only"): https://clerk.com/docs/guides/development/deployment/production. `SignUp.Captcha` renders Turnstile: https://clerk.com/docs/guides/customizing-clerk/elements/reference/sign-up
23. Bot Fight Mode (upd. 2026-08-03): https://developers.cloudflare.com/bots/get-started/bot-fight-mode/. Super Bot Fight Mode: https://developers.cloudflare.com/bots/get-started/super-bot-fight-mode/. Interoperability: https://developers.cloudflare.com/waf/feature-interoperability/
24. Browser Integrity Check: https://developers.cloudflare.com/waf/tools/browser-integrity-check/. `workers.dev` BIC (error 1010): https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/
25. Rate limiting rules by plan: https://developers.cloudflare.com/waf/rate-limiting-rules/
26. Razorpay webhook IPs: https://razorpay.com/docs/security/whitelists
27. Workers limits (CPU, memory, Cron, durations): https://developers.cloudflare.com/workers/platform/limits/
28. Workers `node:http` server, `httpServerHandler`: https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/. No native add-ons or child processes: https://developers.cloudflare.com/sandbox/concepts/. `child_process` stub flag: https://developers.cloudflare.com/workers/configuration/compatibility-flags/
29. Hyperdrive, connect to Postgres: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/. PlanetScale billed via Cloudflare (2026-06-18): https://developers.cloudflare.com/changelog/post/2026-06-18-planetscale-databases-cloudflare-billing/
30. Containers GA (2026-04-13): https://developers.cloudflare.com/changelog/post/2026-04-13-containers-sandbox-ga/. FAQ (ephemeral disk, no guaranteed runtime): https://developers.cloudflare.com/containers/faq/. Limits (upd. 2026-11-12): https://developers.cloudflare.com/containers/platform/limits/. Placement (upd. 2026-10-01): https://developers.cloudflare.com/containers/concepts/placement/. `setInactivityTimeout`: https://developers.cloudflare.com/containers/api/durable-object-container/
31. `whois foaglobal.org` / `dig NS|MX|TXT|A|DS foaglobal.org` (run 2026-11-16). Registrar requirements and DNSSEC: https://developers.cloudflare.com/registrar/
32. Workers Custom Domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
33. R2 public buckets and custom domains (upd. 2026-11-12): https://developers.cloudflare.com/r2/buckets/public-buckets/
34. Purge cache availability and limits: https://developers.cloudflare.com/cache/how-to/purge-cache/
35. Cloudflare Workers Next.js guide, vinext recommended (upd. 2026-11-05): https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
36. OpenNext `bundle-node-middleware.ts`: https://github.com/opennextjs/opennextjs-cloudflare/blob/main/packages/cloudflare/src/cli/build/open-next/bundle-node-middleware.ts
