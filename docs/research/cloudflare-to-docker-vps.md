# Research: Connecting Cloudflare to the Docker VPS (#16)

Date: 2026-11-16 · Ticket: [#16](https://github.com/SiddharthMuramkar/foa-platform/issues/16) · Map: [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2) · Builds on [#3](https://github.com/SiddharthMuramkar/foa-platform/issues/3), [#10](https://github.com/SiddharthMuramkar/foa-platform/issues/10) (non-Vercel parts), [#11](https://github.com/SiddharthMuramkar/foa-platform/issues/11) · SPEC §3.1–§3.3, §3.7, §8.1, NFR-01–05, NFR-09. Technical facts only; no cost.

## Answer

- **Use Cloudflare Tunnel.** `cloudflared` runs in Compose and dials out to Cloudflare, so the VPS opens **no inbound ports at all** (not 80/443, not 22). The tunnel takes over Caddy's TLS/ACME job, and Authenticated Origin Pulls becomes unnecessary.
- **Client IP:** Express `trust proxy = 'uniquelocal'` makes `req.ip` the IP that Cloudflare appends, for browser calls. SSR from the OpenNext Worker reaches the API from the Worker's IP, so #10's `API_SERVER_KEY` + forwarded-IP scheme stays.
- **Webhooks** arrive unchanged if Bot Fight Mode is off for the zone (no rule can skip it) and the first WAF rule skips the security products on `/api/v1/webhooks/*`.
- **Edge caching:** cache only an anonymous lot-state endpoint (`max-age=1`). Request collapsing and Smart Tiered Cache should turn ~200 req/s at the edge into a few req/s at the VPS; load-test to confirm. Every other API response is `private, no-store`.
- **Deploys and admin** use SSH over a second, host-level tunnel behind Cloudflare Access: a service token for GitHub Actions, Google login for people. **Placement:** none at first, never `mode: "smart"`, and `region: "aws:ap-south-1"` only if SSR waterfalls show up in measurements.

## Findings

### 1. Origin connection

| | Cloudflare Tunnel | Proxied DNS → Caddy + Authenticated Origin Pulls (AOP) |
|---|---|---|
| Inbound ports | None. `cloudflared` opens 4 outbound-only, post-quantum-encrypted connections to at least 2 data centers [T1] | 443 (and 80 for ACME) open, limited to Cloudflare IP ranges at the provider firewall (Docker-published ports bypass ufw, #11) |
| Firewall | Egress to port 7844 over UDP (QUIC) or TCP (HTTP/2); "block all ingress" [T2][T3] | Allowlist of Cloudflare IPs, kept up to date |
| Edge → origin TLS | Inside the tunnel; `cloudflared` → api is plain HTTP on the Compose network | Full (strict) needs a cert from a public CA or Cloudflare Origin CA whose CN/SAN matches the host [S1] |
| Origin authentication | Tunnel connector credentials. "AOP has no effect on hostnames routed through Cloudflare Tunnel" [T1] | Global AOP uses a certificate shared by all Cloudflare accounts, so it proves only "from Cloudflare". Zone-level or per-hostname AOP with your own cert proves "from your account" [S2]. Caddy: `tls { client_auth { mode require_and_verify; trust_pool file <ca.pem> } }` [C2] |
| Origin IP | Not reachable at all | Public. mTLS rejects foreign handshakes, but volumetric traffic still reaches the VPS |
| Redundancy | Replicas: up to 25 per tunnel (100 connections); traffic goes to the nearest replica [T1] | One listener |

- **Tunnel in Docker.** Run `cloudflare/cloudflared tunnel --no-autoupdate run --token …`. Docker updates are manual (pull the new image, recreate the container). Cloudflare supports versions released within one year of the latest release [T4]. The metrics server's `/ready` returns 200 when at least one edge connection is up and 503 otherwise [T5]. Inside containers the metrics server listens on `0.0.0.0`.
- **Routes.** A published application maps a hostname to a service URL, such as `http://api:3000` on the Compose network. A hostname with more than one subdomain level needs an Advanced Certificate [T6], so name staging `api-staging.foaglobal.org`, not `api.staging.foaglobal.org`.
- **What `cloudflared` does to requests.** It never sets or appends `X-Forwarded-For` or `CF-Connecting-IP`; the edge's values pass through untouched [T7][T8]. Over HTTP/1.1 it sends request bodies with chunked encoding by default (`disableChunkedEncoding: false`) [T9]. Default origin settings: `connectTimeout` 30 s, `keepAliveTimeout` 90 s, 100 keep-alive connections [T10].
- **Caddy behind the tunnel** (only if kept as an internal router for #3's rollouts). By default Caddy trusts no proxy, so it overwrites the incoming `X-Forwarded-For`. Set `trusted_proxies static private_ranges` + `trusted_proxies_strict` (right-to-left parsing, recommended behind Cloudflare) [C1].
- **Real client IP.** Cloudflare sets `CF-Connecting-IP` and appends the connecting IP to the right of `X-Forwarded-For`. It recommends reading `CF-Connecting-IP` [H1]. With a subnet list, Express walks `X-Forwarded-For` from right to left and takes the first untrusted address as `req.ip` [E1]. `'uniquelocal'` (10/8, 172.16/12, 192.168/16, fc00::/7) covers Docker networks, so the result is correct for cloudflared → api and for cloudflared → caddy → api without counting hops. This replaces #10's `trust proxy = 1`, which assumed exactly one hop. It is safe only because nothing reaches the api except through Cloudflare.
- **SSR from the Worker does not carry the user's IP.**
  - OpenNext's `wrangler.jsonc` template sets `global_fetch_strictly_public`, and the build checks for it [O1][O2].
  - With that flag, a same-zone `fetch()` "loop[s] back to the 'front door' … treated like a request from the Internet" [W1].
  - One project reports that its origin then sees the Worker IP `2a06:98c0:3600::103` [G4]. That is also the documented value for cross-zone subrequests, which covers `*.workers.dev` previews calling `api-staging` [H1]. Cloudflare documents that same-zone subrequests carry the client IP (via `x-real-ip`) and skip WAF custom and managed rules [H1][W2]. How that combines with the flag is not documented.
  - So keep #10's scheme. SSR sends the end user's IP (the incoming `CF-Connecting-IP`) in a header that the API trusts only alongside a valid `API_SERVER_KEY`.
  - `'use cache'` scopes cannot read `headers()` [N1]. Their API calls carry no user IP, so they use the server bucket, as in #10.
- **WAF rules and SSR.** Same-zone Worker subrequests can count against zone rate-limiting rules. Exclude them with `cf.worker.upstream_zone` [W3].
- **Workers VPC** binds a Worker privately to a tunnel service [W4]. SSR would then skip the edge cache, and browsers still need the public hostname. Not needed.

### 2. Webhooks (Razorpay, Clerk/Svix, Resend/Svix)

- **Path and caching.** Webhooks are `POST /api/v1/webhooks/{razorpay,clerk,resend}` (§8.2) on the api host; they never touch the Worker. Non-GET requests are never cached [K1].
- **Bot Fight Mode cannot be skipped.** WAF Skip/Bypass/Allow and Page Rules do not reach it, because it runs outside the Ruleset Engine. Super Bot Fight Mode can be skipped [B1][B2]. So keep Bot Fight Mode **off** for `foaglobal.org`, or use Super Bot Fight Mode with a skip rule.
- **Skip rule.** Make the first WAF custom rule match the webhook paths with action Skip for: the remaining custom rules, rate limiting rules, managed rules, Super Bot Fight Mode, and the legacy products `bic`, `securityLevel`, `uaBlock`, `zoneLockdown` [B3][B4]. HTTP DDoS rules still run. Keep "I'm Under Attack" and high security levels off the api host, because server callers cannot solve challenges.
- **Optional IP check.** Match the Razorpay path to Razorpay's published webhook IPs (#10). The signature stays the real control.
- **Raw body.** The bytes pass through unchanged, but `cloudflared` may re-frame them as chunked with no `Content-Length` [T9]. `express.raw` reads chunked bodies. Verify over the raw Buffer and never require `Content-Length`. cloudflared#1485 (a streamed body dropped when `Content-Length` is missing) affects streamed `PATCH` uploads, not provider POSTs. Still, prove it with a signed test event from each provider [G2].
- **Timeouts.** Cloudflare → origin limits: TCP connect 19 s, Proxy Read 125 s (configurable on Enterprise only), Proxy Write 30 s [L1, updated 2026-11-13]. The providers are tighter: Razorpay wants a 2xx within 5 s, Svix within 30 s (#10). #10's verify → store + enqueue in one transaction → 200 pattern remains the binding constraint. If the tunnel or api is down, Cloudflare returns a 5xx and the providers retry (Razorpay 24 h, Svix about 27.6 h; #10).

### 3. Caching at the edge

- **Defaults.** Cloudflare caches by file extension, so JSON is not cached unless a Cache Rule marks it "Eligible for cache". It never caches `private`, `no-store`, `no-cache` or `max-age=0` responses, responses with `Set-Cookie`, or non-GET requests [K1][K2].
- **The Authorization trap.**
  - With Origin Cache Control (the default on Free, Pro and Business), a request carrying `Authorization` is cached if the response has `public`, `s-maxage` or `must-revalidate` [K3].
  - The default cache key is scheme, host, URI + query, the **`Origin` header** (for CORS), and a few method-override and forwarding headers. **`Authorization` is not in it** [K4]. Free to Business plans cannot add headers or cookies to the key (Enterprise only) [K4].
  - So a `public` response to a bearer request would be served to everyone. The cached endpoint must never read the token.
- **TTL.** The minimum Edge TTL for a rule override is 2 h on Free, 1 h on Pro and 1 s on Business [K5]. Short TTLs therefore come from the origin header, with the rule's Edge TTL mode set to "use cache-control header if present" (`respect_origin`) [K6]. Inference to check in S0: the plan minimum applies only to overrides.
- **Headers.** Precedence is `Cloudflare-CDN-Cache-Control` > `CDN-Cache-Control` > `Cache-Control` [K7]. `s-maxage`, `must-revalidate` and `proxy-revalidate` disable stale-while-revalidate [K8]. Cache Rules can match on `http.request.headers` and the URI path [K6].
- **Collapsing and tiering.**
  - **Request collapsing:** when several requests miss at one data center at the same time, a cache lock sends one request to the origin and streams the response to the rest [K1].
  - **Smart Tiered Cache** (all plans) funnels misses through one upper tier close to the origin [K9]. How it picks that tier for a Tunnel origin is not documented.
- **Load (inference, to load-test).**
  - NFR-03 is 1,000 viewers polling every 5 s, about 200 req/s at the edge.
  - With `max-age=1` and collapsing, each serving data center sends about 1 req/s per lot upstream. With tiering, the VPS sees about one upper tier's ~1 req/s. Cloudflare lists 22+ Indian cities [N2], so even without tiering the bound is tens of req/s, not 200.
  - Hits never reach the API's per-IP limiter. That removes #10's problem of ~25 pollers behind one NAT IP for cached hits.
- **Purge.** Every purge method has been available on every plan since 2025-04-01. Limits are per **account**:
  - Tag, prefix, hostname or everything: 5 requests/min on Free (bucket 25), 5/s on Pro, 10/s on Business.
  - Single URL: 800 URLs/s on Free, 1,500/s on Pro and Business [K10].
  - OpenNext's purge (#15) draws on the same account budget.
- **SG-05.** A response that holds no media and lives for at most 1–60 s at the edge expires well inside the 5-minute takedown window, so it needs no purge.

### 4. Deploys and admin access

| Option | Facts | Fit |
|---|---|---|
| **Access-protected SSH over Tunnel, service token** | Runner uses `ProxyCommand cloudflared access ssh --hostname %h` [A1]. Token via `--service-token-id/--service-token-secret` or `TUNNEL_SERVICE_TOKEN_ID/SECRET` [T11][G3]. Access policy action must be **Service Auth** [A2]. Tokens have a set duration (extend via API), and policies can match token tags (2026-11-02) [A2][A3] | Keeps #3's push-based release script; no open port |
| Browser-rendered SSH / Access for Infrastructure | Browser terminal needs only `cloudflared` on the server. Access for Infrastructure needs the Cloudflare One Client [A4] | People, not CI |
| Pull-based (VPS timer polls GHCR, or an Access-protected deploy hook) | No shell credential in GitHub | Custom code; no deploy result shown in Actions |
| Tailscale / WireGuard | #11's alternative | Second vendor, against the map's direction |
| Self-hosted runner on the VPS | GitHub recommends self-hosted runners only for private repos, because forks can run code [GH1] | Repo is public: rejected |

- **Where the SSH connector runs.** A Compose `cloudflared` can reach the host's sshd through `extra_hosts: host.docker.internal:host-gateway` [D1], but then admin access depends on Docker. A **host-level** `cloudflared` (systemd) routing `ssh.foaglobal.org → ssh://localhost:22` lets sshd listen on `127.0.0.1` only and survives a Docker failure. Break-glass access is the provider's out-of-band console.
- **Limit the CI key.** Use `restrict,command="/opt/foa/bin/release"` in `authorized_keys`, so the key can run only the #3 release sequence (pull SHA tag → `migrate deploy` → `docker rollout api` → recreate worker) [X1].
- **Provider firewall becomes:** no inbound rules. Egress: 7844 TCP/UDP, 443 (GHCR, R2, Clerk, Razorpay, Resend, Sentry), plus DNS and NTP. This replaces #11's "22 from admin IPs, 80/443".

### 5. Placement and latency

- **Paths.**
  - Browser → api: TLS ends at the nearest edge, then traffic crosses Cloudflare's network to the tunnel's data center and on to `cloudflared` → api.
  - SSR: the Worker runs at the nearest edge [P1], and **every sequential** API call pays the round trip from that edge to the Mumbai tunnel. A Worker invocation can have only 6 connections waiting for headers at once; more are queued [W5].
  - Cached poll: answered at the nearest edge.
- **India coverage.** Cloudflare lists 22+ Indian cities, including Mumbai, New Delhi, Chennai, Bangalore, Hyderabad, Kolkata, Pune and Ahmedabad [N2]. Which data centers the tunnel connects to from a Mumbai VPS, and the edge → Mumbai round-trip time, are unmeasured.
- **Placement options.** `mode: "smart"`, `region`, `host` and `hostname` are mutually exclusive and inherited per environment [P1][W6]. Placement moves the whole fetch handler (middleware, cache hits, SSR). Static assets are always served from the nearest location [P1].
  - `host` and `hostname` probes come from public IPs and "do not work correctly for … anycast" [P1]. With Tunnel, `api.foaglobal.org` is anycast and the VPS has no open port, so **`region: "aws:ap-south-1"`** (AWS Mumbai) is the usable hint.
- **Smart Placement problems.** It needs steady traffic from several locations and up to 15 min of analysis [P1]. opennextjs-cloudflare#1382: prerendered routes hang for hours on Smart Placement-forwarded invocations. It was closed as not planned on 2026-11-13, and the maintainer called it a platform issue. A plain-Worker repro is reported, and one user moved to a region hint [G1]. #162 notes that one Worker cannot keep routing and cache at the edge while placing SSR [G5].
- **Measure in S0 on a Cloudflare preview** (the map's prototype flow):
  - the `cf-ray` suffix (data center) and, when placement is on, the `cf-placement` header [P1];
  - an API `Server-Timing` header, to split API time from network time;
  - Sentry web → api traces (#11).

  NFR-02's p95 is measured at the API; the edge adds the network legs.

## Recommendation

1. **Tunnel for app traffic.** Add a `cloudflared` service to the production Compose file:
   - pinned image tag, `tunnel --no-autoupdate run`, token from a root-only secret file (#11), `restart: unless-stopped`;
   - `--metrics 0.0.0.0:2000` on the internal network, probed at `/ready` by #11's host check;
   - route `api.foaglobal.org → http://api:3000`;
   - no published ports on any service; upgrade `cloudflared` inside the one-year support window.
2. **Caddy loses its TLS/ACME role.** Keep it as an internal router (`http://caddy:80`, with `trusted_proxies static private_ranges` + `trusted_proxies_strict`) only if #3's `docker rollout` prototype shows 5xx when cloudflared routes straight to `api`.
3. **API.**
   - `trust proxy = 'uniquelocal'`.
   - Rate-limit key: user id → forwarded client IP when `API_SERVER_KEY` is valid (no forwarded IP: server bucket) → `req.ip`.
   - The web Worker forwards the incoming `CF-Connecting-IP` in that header.
   - Default response header `Cache-Control: private, no-store`.
4. **Zone security.**
   - Bot Fight Mode off.
   - First custom rule: Skip on `/api/v1/webhooks/*` (§2).
   - Any WAF or rate-limit rule on the api host excludes `cf.worker.upstream_zone eq "foaglobal.org"`.
   - Never turn on Under Attack mode for the api host.
5. **Edge cache, poll only.**
   - Turn on Smart Tiered Cache.
   - New anonymous endpoint `GET /api/v1/auctions/:id/live`: price, bid count, status, `endsAt`, reserve met, masked recent bids, `serverTime`. Response header `Cache-Control: public, max-age=1`.
   - One Cache Rule: host `api.foaglobal.org`, path `/api/v1/auctions/*/live`, no `Authorization` header, "Eligible for cache", Edge TTL `respect_origin`.
   - The poll never sends a bearer token. "You are leading/outbid" comes from `GET /me/bids` on load and after each bid.
   - If Cloudflare returns `Age` on hits (check in S0), add it to CORS `exposedHeaders` so the countdown can subtract it.
   - Other public reads stay cached in Next/OpenNext (#15), not at the API edge. If one is ever edge-cached, keep `max-age ≤ 60` so SG-05 holds without a purge.
6. **Deploys and admin.**
   - Run a host-level `cloudflared` (systemd) ops tunnel `ssh.foaglobal.org → ssh://localhost:22`, with sshd on `127.0.0.1`.
   - Access app policies: Service Auth for the CI token (tag `environment=production`), and Allow for named admins via Google.
   - The GitHub Actions deploy job runs `ssh` through the `cloudflared access ssh` ProxyCommand with a forced-command key.
   - The provider firewall allows no inbound traffic. The provider console is the break-glass path.
7. **Placement.** None at first. Measure, then set `"placement": { "region": "aws:ap-south-1" }` if SSR pages make two or more sequential API calls and the extra round trip shows in LCP. Never use `mode: "smart"`. Keep SSR API calls parallel (at most 6 waiting at once).
8. **Adjacent (DNS, #17).** Clerk's CNAME records must be **DNS only**: Clerk's DNS check fails when they are proxied [CL1].
9. **S0 tests.**
   - (a) `CF-Connecting-IP` and `X-Forwarded-For` as seen by the API for browser, SSR, `'use cache'`/build and `workers.dev` preview requests.
   - (b) A signed test webhook from Razorpay, Clerk and Resend through the tunnel.
   - (c) The lot poll's HIT ratio and `Age`.
   - (d) `docker rollout api` through cloudflared with zero 5xx.
   - #11's S23 load test (200 req/s on one lot) now runs **through the edge** and records the req/s that reach the origin.

## Open risks

- **The Worker IP under `global_fetch_strictly_public`** rests on one third-party report [G4]; Cloudflare's docs do not state it for that flag. Test (a) settles it. The forwarded-IP design works either way.
- **Unmeasured:** how Smart Tiered Cache picks an upper tier for a Tunnel origin, the poll's real origin load, which data centers the tunnel uses, and the round-trip time from Indian edges to Mumbai.
- **Single point of failure:** one host and one `cloudflared`. A second replica on the same host covers connector restarts, not host loss (NFR-04). Admin access also depends on Cloudflare Access/Tunnel; the provider console is the fallback.
- **Free-plan limits, if FOA stays on Free:**
  - Bot Fight Mode cannot be skipped.
  - Tag purges are capped at 5/min per account, shared with OpenNext.
  - Rule TTL overrides have a 2 h minimum, which is why the design relies on origin `max-age`.

  #17 decides the plan.
- **Placement forwarding:** #1382's hang is reported for `mode: "smart"`. Region hints use the same forwarding path and have no reports either way.
- **Rollout without Caddy** is unproven. Fall back to keeping Caddy as an internal router.
- **Credentials:** the Access service token plus the SSH key form a deploy credential. Mitigate with a forced command, token duration and rotation, and a GitHub Environment.
- **Body re-framing** by `cloudflared` (chunked) is unproven for each provider's signature check until test (b).

## SPEC passages affected

| Section | Change | Owner |
|---|---|---|
| §3.1 API hosting row | Docker on a Mumbai VPS, reachable only through Cloudflare Tunnel; drop "Railway" and "VPS rejected" | #7 `docs:` PR |
| §3.1 Bot protection row | Bot Fight Mode off; webhook Skip rule; WAF rules exclude same-zone Worker subrequests | #7 (with #17) |
| §3.2 production compose | `cloudflared` service; Caddy optional and without TLS | #7 |
| §3.3 Live data / SSR | Poll via `/auctions/:id/live`, edge-cached 1 s, anonymous; SSR forwards client IP with `API_SERVER_KEY` | #16 deltas in #7's PR |
| §3.7 env | `API_SERVER_KEY` (web + api); tunnel token as a host secret file, not app env; CI secrets: Access service token + deploy SSH key | #7 |
| §8.1 | `trust proxy = 'uniquelocal'` (supersedes #10's `1`); rate-limit keys; default `Cache-Control: private, no-store`; §8.2 adds `GET /auctions/:id/live` (P) | #16 deltas |
| NFR-03 / §12 S23 | Load test through the edge, recording origin req/s | #11 gate, amended |
| NFR-04 | Tunnel connector as SPOF; optional replica | #7 |
| NFR-05 | No inbound ports; admin and deploy only via Cloudflare Access | #7 |
| NFR-09 | Uptime checks on the public hostname exercise edge + tunnel; host check adds `cloudflared` `/ready` | #11 deltas |
| §12 S0 | Tunnel, Access app, zone rules, S0 tests (a)–(d) | #7 |

## Sources (accessed 2026-11-16)

- **Tunnel:** [T1] [Tunnel overview: outbound-only, AOP n/a](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) and [configuration: replicas](https://developers.cloudflare.com/tunnel/configuration/) · [T2] [Tunnel with firewall](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/tunnel-with-firewall/) · [T3] [connectivity pre-checks changelog](https://developers.cloudflare.com/changelog/) (2026-05-27) · [T4] [update cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/update-cloudflared/) and [downloads: support window](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) · [T5] [cloudflared `metrics/readiness.go`](https://github.com/cloudflare/cloudflared/blob/master/metrics/readiness.go) · [T6] [add a published application](https://developers.cloudflare.com/tunnel/get-started/) · [T7] [cloudflared `ingress/origin_proxy.go`](https://github.com/cloudflare/cloudflared/blob/master/ingress/origin_proxy.go) · [T8] [cloudflared#1426](https://github.com/cloudflare/cloudflared/issues/1426) · [T9] [origin parameters](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/origin-parameters/) (2026-04-17) · [T10] [cloudflared config defaults](https://github.com/cloudflare/cloudflared/blob/master/ingress/config.go) · [T11] [cloudflared CLI `access ssh` flags](https://github.com/cloudflare/cloudflared)
- **SSL/AOP:** [S1] [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/) · [S2] [Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/)
- **Headers:** [H1] [Cloudflare HTTP headers: `CF-Connecting-IP`, Worker subrequests, `X-Forwarded-For`, `CF-Worker`](https://developers.cloudflare.com/fundamentals/reference/http-headers/) and [BYOIP subrequest changelog](https://developers.cloudflare.com/changelog/) (2026-10-30)
- **Workers:** [W1] [`global_fetch_strictly_public`](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#global-fetch-strictly-public) · [W2] [WAF feature interoperability](https://developers.cloudflare.com/waf/feature-interoperability/) · [W3] [rate limiting troubleshooting](https://developers.cloudflare.com/waf/rate-limiting-rules/troubleshooting/) · [W4] [Workers VPC](https://developers.cloudflare.com/workers-vpc/) (2026-10-29) · [W5] [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) · [W6] [Wrangler configuration: inheritable keys](https://developers.cloudflare.com/workers/wrangler/configuration/) · [P1] [Placement](https://developers.cloudflare.com/workers/configuration/placement/) (updated 2026-10-12) and [placement hints changelog](https://developers.cloudflare.com/changelog/) (2026-01-22)
- **Bots/WAF:** [B1] [Bot Fight Mode](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/) · [B2] [bot false positives](https://developers.cloudflare.com/bots/troubleshooting/false-positives/) · [B3] [Skip options](https://developers.cloudflare.com/waf/custom-rules/skip/options/) · [B4] [WAF phases](https://developers.cloudflare.com/waf/feature-interoperability/)
- **Limits:** [L1] [connection limits](https://developers.cloudflare.com/fundamentals/reference/connection-limits/) (updated 2026-11-13)
- **Cache:** [K1] [default cache behavior: request collapsing](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/) · [K2] [investigate uncached responses](https://developers.cloudflare.com/cache/troubleshooting/investigating-uncached-responses/) (2026-08-06) · [K3] [Origin Cache Control](https://developers.cloudflare.com/cache/concepts/cache-control/) (2026-06-30) · [K4] [cache keys](https://developers.cloudflare.com/cache/how-to/cache-keys/) (2026-10-30) · [K5] [Edge and Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/) · [K6] [Cache Rules settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/) (2026-10-15) · [K7] [CDN-Cache-Control](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/) · [K8] [revalidation](https://developers.cloudflare.com/cache/concepts/revalidation/) · [K9] [Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/) · [K10] [purge cache: limits](https://developers.cloudflare.com/cache/how-to/purge-cache/) and [purge-for-all changelog](https://developers.cloudflare.com/changelog/) (2025-04-01)
- **Access:** [A1] [SSH with client-side cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/use-cases/ssh/ssh-cloudflared-authentication/) · [A2] [service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/) · [A3] [service token tags changelog](https://developers.cloudflare.com/changelog/) (2026-11-02) · [A4] [SSH options](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/use-cases/ssh/)
- **OpenNext/Next:** [O1] [OpenNext `wrangler.jsonc` template](https://github.com/opennextjs/opennextjs-cloudflare/blob/main/packages/cloudflare/templates/wrangler.jsonc) · [O2] [workers-sdk#9087: flag added to the Next template](https://github.com/cloudflare/workers-sdk/pull/9087) · [N1] [Next 16.4.5 `use cache` constraints](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/01-directives/use-cache.mdx)
- **Issues:** [G1] [opennextjs-cloudflare#1382](https://github.com/opennextjs/opennextjs-cloudflare/issues/1382) (closed 2026-11-13) · [G2] [cloudflared#1485](https://github.com/cloudflare/cloudflared/issues/1485) · [G3] [cloudflared#1104](https://github.com/cloudflare/cloudflared/issues/1104) · [G4] [anomalyco/opencode#55103](https://github.com/anomalyco/opencode/issues/55103) · [G5] [opennextjs-cloudflare#162](https://github.com/opennextjs/opennextjs-cloudflare/issues/162)
- **Other:** [N2] [Cloudflare network locations](https://www.cloudflare.com/network/) (crawled 2026-11-16) · [C1] [Caddy global options: `trusted_proxies`](https://caddyserver.com/docs/caddyfile/options#trusted-proxies) · [C2] [Caddy `tls client_auth`](https://caddyserver.com/docs/caddyfile/directives/tls) · [E1] [Express behind proxies](https://expressjs.com/en/guide/behind-proxies.html) · [D1] [Compose networking: `host-gateway`](https://docs.docker.com/compose/how-tos/networking/) · [GH1] [GitHub: adding self-hosted runners](https://docs.github.com/actions/hosting-your-own-runners/adding-self-hosted-runners) · [X1] [sshd(8) `authorized_keys` options](https://man.openbsd.org/sshd#AUTHORIZED_KEYS_FILE_FORMAT) · [CL1] [Clerk: deploy to production, Cloudflare DNS](https://github.com/clerk/clerk-docs/blob/main/docs/guides/development/deployment/production.mdx)
