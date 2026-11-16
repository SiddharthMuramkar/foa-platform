# Docker host operations: shape, monitoring, hardening

Research for [#11](https://github.com/SiddharthMuramkar/foa-platform/issues/11) (map [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2)). Researched 2026-11-16 and checked by two critics on the same day (25 issues, all verified against primary sources; see "Verification" at the end). Technical facts only; no cost. Covers NFR-02, NFR-03, NFR-04 and NFR-09 in SPEC §10.

## Answer

- **Shape**: one VPS in Mumbai, next to Vercel `bom1`. Start at about 4 vCPU (dedicated or CPU-optimised, not shared), 8 GB RAM, running proxy + api + worker + Postgres 17. The worker gets a hard CPU and memory cap; the proxy and api get none. Postgres gets explicit memory settings. Disk is sized by the append-only `audit_log`, not by the core tables: 80 GB covers year 1 only at a low audit rate, so put Postgres on a resizable NVMe volume or plan about 160 GB. These numbers are estimates: a load test on the provisioned VPS must confirm them.
- **Scale order** when the host is outgrown: a second api replica on the same host (a single Node process runs its JavaScript on about one core), then the worker to a second VPS (its CPU bursts are the main threat to api p95), then Postgres. Each step has a named trigger.
- **Monitoring**: Sentry is already in the stack. It covers uptime on `/health` (checked off the host every minute), worker heartbeats and backup heartbeats (Crons), errors with release tags, and pino logs. Request ids run web → api → jobs. The worker checks pg-boss queue depth and dead-letter queues. A host systemd timer checks disk, restarts, health, OOM and clock sync and reports to a Sentry Cron monitor, so no container gets the Docker socket. Alerts route to a named on-call person.
- **Hardening**: Docker-published ports bypass ufw, so use the provider firewall and publish only 80/443. Keep Docker's default iptables firewall backend, because the experimental nftables backend ignores `DOCKER-USER`. SSH is key-only, with the drop-in named so it beats cloud-init's file. `unattended-upgrades` (on by default) plus a timed auto-reboot, with stop grace periods long enough for Postgres and pg-boss. Privileges are dropped per service (postgres needs a few capabilities to start). Secrets live in root-only files on the host. Docker never restarts an `unhealthy` container, so processes must exit on fatal errors.

## 1. Shape

### Load and data facts

- **The load is 4× the NFR-02 test point.** NFR-02 measures at 50 req/s. But SPEC §3.3 has every viewer poll its auction lot every 5 s, and NFR-03 targets 1,000 viewers on one lot: that is **200 req/s on one endpoint**.
- **Every request also writes to Postgres.** SPEC §3.1 mandates the `rate-limiter-flexible` Postgres store, and each `consume()` is an upsert. At the auction peak that is 200+ extra writes/s, with WAL and autovacuum churn. Create the limiter table yourself as `UNLOGGED` and pass `tableCreated: true` (#3 already chose `UNLOGGED`). Use `inMemoryBlockOnConsumed` so keys over the limit are blocked in memory without a database write. Exempt the cached lot-poll endpoint or give it a cheap limit.
- **Core tables are small; `audit_log` is not.** NFR-03's row counts (100k Participants, 10k Schools, 200k Submissions) are small for Postgres. But FR-AUDIT-01/02 make `audit_log` append-only, with before/after JSON for every staff mutation, consent change and sensitive read, and OD-12 retention is open. See the disk estimate below. SPEC §3.1 keeps media in object storage (#3 kept R2).
- **Worker inputs** (SPEC §4.7): images up to 25 MB, video up to 500 MB.
- **ffmpeg** `threads` defaults to `auto`: by default an encode uses every core.
- **sharp**:
  - Threads per image equal the CPU core count, except on glibc Linux without jemalloc or `MALLOC_ARENA_MAX`, where the default is 1.
  - The number of images processed in parallel is capped by `UV_THREADPOOL_SIZE` (default 4).
  - The libvips cache defaults to 50 MB, 20 files and 100 items.
  - `limitInputPixels` (default 268,402,689 px) bounds memory per image.
- **sharp needs a better allocator on glibc.** sharp's docs say the default glibc allocator is "unsuitable for long-running, multi-threaded processes". Use jemalloc or `MALLOC_ARENA_MAX=2`. musl (Alpine) is unaffected; its prebuilt binaries need musl ≥ 1.2.5.
- **sharp's prebuilt binaries cannot read HEIC**, but SPEC §4.7 accepts HEIC. They decode JPEG, PNG, Ultra HDR, WebP, AVIF, TIFF, GIF and SVG. sharp's docs say HEIC needs a globally installed libvips built with libheif, libde265 and x265 (x265 is an encoder; decoding needs only libde265). A custom libvips means compiling sharp from source, with a build toolchain in the image. **The ffmpeg CLI gained tiled HEIF support in 8.1**; iPhone photos are tiled HEIF. The worker already ships ffmpeg.
- **Postgres 17 memory**:
  - `shared_buffers` defaults to 128 MB.
  - For a dedicated server with 1 GB+ RAM, the docs suggest starting at 25 % of RAM, and say more than 40 % is unlikely to help.
  - `effective_cache_size` (default 4 GB) is only a planner hint.
- **Postgres connections and shared memory**:
  - `max_connections` defaults to 100, with 3 slots reserved for superusers.
  - Docker's `/dev/shm` defaults to 64 MB. That is too small for parallel queries, which fail with "could not resize shared memory segment". Set `shm_size`.
- **The connection budget fits, with a rollout margin.** Prisma 7's `pg` adapter pools `max` 10 connections by default. pg-boss pools `max` 10 per instance. One api container (Prisma 10 + pg-boss sender 10 + a separate limiter pool, if used, 10) plus the worker (Prisma 10 + pg-boss 10) is 50. During a `docker rollout` (#3) a second api container runs briefly: 80, under the 97 usable. A permanent second api replica (scale step 1) needs smaller per-pool `max` values (the api's pg-boss pool only sends) or a higher `max_connections`.
- **Prisma's default pool has no timeout.** The `pg` adapter's `connectionTimeoutMillis` defaults to `0`. A saturated pool queues requests forever instead of failing fast, so p95 degrades silently. Set it explicitly.
- **Node 24 can size its heap from the container limit.** `--max-old-space-size-percentage` sets the V8 heap as a share of available memory. `process.constrainedMemory()` (stable in v24) reads the cgroup limit.
- **A single Node process runs its JavaScript on about one core.** On a 4 vCPU host the api saturates one core long before the host is full.

### Starting shape

This is an estimate on a 4 vCPU / 8 GB host and must be load-tested. CPU limits are caps, not reservations, so their sum may exceed the vCPU count. Only the worker gets a CPU cap, low enough to protect api and Postgres. The proxy is on the hot path of every request, so a CFS quota there would throttle TLS handshakes and bursts and add to api p95.

| Container | CPU limit | Memory limit | Settings |
|---|---|---|---|
| proxy (TLS, routing; details in #10) | none (or ≥ 1) | 256 MB | Only container with published ports (80/443) |
| api | none | 1 GB | One Node process. `--max-old-space-size-percentage=75`. Prisma `max` 10 with `connectionTimeoutMillis` set |
| worker | 2 | 2 GB | `MALLOC_ARENA_MAX=2` or jemalloc. ffmpeg `-threads 2`. Video job concurrency 1. Scratch (≥ 2 × 500 MB per video job) on a **named volume**, not tmpfs: tmpfs counts against the 2 GB memory limit |
| postgres:17 | none | 3 GB | `shared_buffers` ≈ 1 GB, `effective_cache_size` ≈ 3 GB, `shm_size: 256mb`, `pg_stat_statements` on |
| OS, Docker, page cache | — | ~1.7 GB | — |

Per-service privileges and stop timeouts are in §3.

**Plan class**: use dedicated or CPU-optimised vCPUs. CPU steal on shared plans shows up directly in p95. All three providers with Mumbai or Bangalore regions offer a 4 vCPU / 8 GB dedicated class there (table below). The host check can also record steal time.

### Disk estimate

Back-of-envelope only. Row rates are assumptions to be replaced by measurements after launch.

| Item | Assumption | Size |
|---|---|---|
| OS and Docker images (with rollback tags) | — | 15–20 GB |
| Core tables + indexes | NFR-03 rows plus about 1M Asset rows, at 1–2 KB per row including indexes | 1–3 GB |
| `audit_log` (append-only, no retention yet: OD-12) | 10k–50k rows/day × about 1.5 KB including indexes (before/after JSON, user agent, ids) | **5–27 GB per year, growing** |
| pg-boss jobs | Completed jobs kept 7 days (`deleteAfterSeconds` default); for example 50k jobs/day × 1 KB | about 0.5 GB steady |
| Rate-limit table | `UNLOGGED`; expired rows removed by the library | < 0.1 GB, heavy churn |
| WebhookEvent | JSON payloads, low volume | < 1 GB per year |
| WAL | `max_wal_size` default 1 GB, plus the pgBackRest archive spool if the off-host repo is unreachable (#3) | 2–5 GB headroom |
| Worker scratch | 2 × 500 MB per video job, plus images | about 2 GB |
| Container logs | api raised to 10 × 50 MB; others at the 100 MB default | < 1 GB |

Year 1 totals about 30–60 GB. With an alert at 80 % full, 80 GB covers year 1 only at the low audit rate. So either put Postgres data on a resizable volume (NVMe block storage where the region offers it; see the provider table) or start with about 160 GB of local NVMe. Track `audit_log` size in the host check. Retention for `audit_log` (OD-12) has to work without `DELETE`, which the FR-AUDIT-02 trigger rejects; monthly partitions that can be detached are one way.

### Scale order

1. **Second api replica on the same host, behind the proxy.** The rate limiter already uses a Postgres store (SPEC §3.1), so replicas share no in-memory state. This is the cheapest step and needs no new machine. Recompute the connection budget first (see above). Trigger: the api container sits near 100 % of one core, or event-loop delay (`perf_hooks.monitorEventLoopDelay`) rises with p95.
2. **Worker → second VPS** in the same region, over a private network. The worker is stateless: it needs only the DB URL and object-storage credentials. ffmpeg and sharp default to all cores, so moving the worker removes the main threat to api p95. pg-boss is built for many instances (`getInstances()` tracks host, pid and pool per instance). Trigger: any of api p95 regressing while transcode jobs run, sustained CPU throttling of the worker (cgroup `cpu.stat`), or media-queue `readyOldestSeconds` above an agreed threshold.
3. **Postgres → its own VPS or block volume**, when the working set outgrows memory (cache hit ratio falls, IO wait rises) or to isolate the DB from app deploys.

### Region near India

- **Vercel**: `bom1` is AWS `ap-south-1`, Mumbai. Vercel Functions default to `iad1`; set `regions: ["bom1"]` so server-side fetches to the API stay in-country (wiring belongs to #10).
- **Providers with India regions**, from their own pages and public APIs. The design needs more than a region: a cloud firewall (§3), block storage (Postgres volume), a private network (worker split) and a dedicated-CPU class (p95).

  | Provider | India regions | Cloud firewall | Block storage | Private network | Dedicated 4 vCPU / 8 GB |
  |---|---|---|---|---|---|
  | Vultr | Mumbai (`bom`), Bangalore (`blr`), Delhi NCR (`del`); Chennai announced 2026-10-21 as a GPU region | Firewall groups (not checked per region) | HDD Block in all three; **NVMe Block only in Bangalore** | VPC (not checked per region) | `voc-c-4c-8gb` (Optimized Cloud Compute) in all three |
  | Akamai/Linode | Mumbai (`ap-west`), Mumbai 2 (`in-bom-2`), Chennai (`in-maa`) | Cloud Firewall in all three | Block Storage in all three | VPCs in Mumbai 2 and Chennai; `ap-west` has VLANs only | `g6-dedicated-4` in both Mumbai regions |
  | DigitalOcean | Bangalore (`blr1`) only | Cloud Firewalls in every region | Standard Volumes; High Performance Volumes not in BLR1 | VPC (not checked per region) | CPU-Optimized Droplets available |
  | Hetzner Cloud | None; nearest is Singapore | — | — | — | — |

- **Vultr Mumbai caveat**: block storage there is HDD Block (rate-limited to 500 IOPS and 100 MB/s; NVMe Block is 10,000 IOPS and 400 MB/s). On Vultr Mumbai keep Postgres on the instance's local NVMe; for a separate NVMe volume use Vultr Bangalore or Akamai Mumbai 2.
- **Latency (secondary source, indicative only)**: a third-party test from an Indian connection measured about 3.6 ms to Vultr or Linode Mumbai and 17 ms to DigitalOcean Bangalore.

## 2. Monitoring and alerting

| Signal | How | Fires when |
|---|---|---|
| Uptime of `/health` (DB + queue, SPEC §8.1) | **Sentry Uptime Monitor**: 1-minute interval, checks from several regions in turn, 10 s timeout (configurable up to 30 s), default 3 consecutive failures | About 3 minutes of downtime |
| Worker alive, schedules firing | **Sentry Crons**: `Sentry.withMonitor()` around the per-minute scheduler job and the 15-minute payment reconciliation (SPEC §3.6) | A check-in is missed or reports an error |
| Backups and restore drill (NFR-08, #3) | **Sentry Cron monitors** (HTTP check-ins) around the pgBackRest backups, the weekly `verify` and the monthly restore drill. The NFR-04 argument rests on restore, so a silent backup failure must alert | A check-in is missed or reports an error |
| Queue depth | Worker job every minute: `boss.getQueues()` → `queuedCount`, `readyCount`, `readyOldestSeconds`. Also forward pg-boss `warning` events of type `queue_backlog`, which fire when `queuedCount` exceeds `warningQueueSize` (default 10,000; set lower per queue on `createQueue`) | Sentry issue |
| Dead letters | Each queue's `deadLetter` target is an ordinary queue. Dead-lettered jobs run under that queue's own config and simply sit queued when no worker consumes it. `redrive()` re-runs them. The NFR-04 admin view reads the same counts | Dead-letter queue `queuedCount` > 0 |
| pg-boss health | Forward the `warning` types `xmin_horizon`, `autovacuum_disabled` and `handler_overrun`. `getInstances()` reports `crashRestarts` | Sentry issue |
| Disk, volume, memory, container restarts, health, OOM, clock | **Host systemd timer** every minute runs `df`, `docker system df -v`, `docker inspect` (`RestartCount`, `State.Health.Status`, `State.OOMKilled`) and `timedatectl` (clock synchronised), then reports via a **Sentry Cron HTTP check-in** (`?status=ok` or `?status=error`) | An error check-in, or a missed one (host down) |
| Errors and p95, with releases | Sentry on api and worker (already in NFR-09), with `release` set to the image tag or git SHA so NFR-09's release tags exist. `pg_stat_statements` for slow SQL (needs `shared_preload_libraries` and a restart) | Sentry alert rules |
| Request id (NFR-09) | pino-http `genReqId` reuses an incoming `X-Request-Id` (from the web app on Vercel) or generates one and sets it on the response. The api copies it into pg-boss job data, and the worker binds it to a child logger per job. Sentry trace headers propagate alongside | — |
| Logs | pino JSON to stdout, kept on the box by the Docker `local` driver (rotates 5 × 20 MB per container by default, compressed; raise the api's `max-size`/`max-file`, for example 10 × 50 MB). Shipped centrally by **Sentry `pinoIntegration()`** (SDK ≥ 10.18.0; set `enableLogs: true` below 10.71.0) at `warn` and above. NFR-06 redaction applies before both | Optional log alerts |

Notes:

- **Route every alert to a person.** Sentry alert rules send email plus mobile push (or Slack) to a named on-call person. Each alert has a runbook entry. Without a route, an unseen alert can use up the NFR-04 budget on its own (§3).
- **Estimate log volume before trusting the buffer.** pino-http logs every request by default (`autoLogging: true`), and `pinoIntegration` ships every level from `trace` to `fatal` by default. At the 200 req/s auction peak, about 400 B per line is about 80 KB/s, or about 7 GB/day if sustained. The default 100 MB `local` buffer then holds about 20 minutes of api logs. So set pino-http `autoLogging.ignore` for `/health`, `/health/live` and the lot-poll endpoint; pass `pinoIntegration({ log: { levels: ['warn', 'error', 'fatal'] } })`; raise the api's rotation limits; and record the retention window that results.
- **Set the `local` log driver.** Docker's default `json-file` driver does not rotate logs; Docker's own docs warn it can exhaust the disk. Make `local` the default in `daemon.json`.
- **Queue counts can be a minute old.** pg-boss refreshes them every `monitorIntervalSeconds` (default 60 s), which is fine for 1-minute alerts.
- **Sentry log shipping runs on the main thread.** Pino's docs recommend that log transmission run "in a separate thread or a separate process". `pinoIntegration` hooks the logger in-process and JSON-parses every line on the main thread; filtering to `warn`+ keeps that small. Two ways to ship without event-loop cost: a pino worker-thread transport (`pino.transport()`, since v7) to an OTLP or Loki endpoint, which needs no Docker socket; or a host agent such as Grafana Alloy's `loki.source.docker`, which reads the Docker socket.
- **Off-the-shelf agents need the Docker socket.** Host-plus-container agents (Beszel agent, Grafana Alloy `prometheus.exporter.cadvisor`) read `/var/run/docker.sock`. Mounting the socket read-only does not make the Docker API read-only (OWASP). They also need a hub or backend off the host to alert when the host is down. Use them only if dashboards and history are wanted, and then through a socket proxy that allows only read endpoints.
- **The uptime check must run off the host.** Sentry's does.

## 3. Runtime and hardening

### Containers (Compose)

- **Restart policy: `restart: unless-stopped` on every service.**
  - Compose's default is `no`.
  - `unless-stopped` restarts on exit and after a daemon restart or reboot, but not containers stopped by hand.
  - `on-failure` does not restart after a daemon restart.
- **Healthchecks do not trigger restarts.** Compose `healthcheck` takes `test`, `interval`, `timeout`, `retries`, `start_period` and `start_interval`. Standalone Docker and Compose never restart an `unhealthy` container; only Swarm replaces unhealthy tasks. `--exit-on-unhealthy` was dropped from the original healthcheck PR ([moby#22719](https://github.com/moby/moby/pull/22719)); restart-on-unhealthy is still an open request ([moby#28400](https://github.com/moby/moby/issues/28400)).
  - Use health for `depends_on: condition: service_healthy` and for monitoring.
  - Get self-healing from the process: exit on fatal states (uncaught error, DB lost beyond retry, event-loop watchdog) so the restart policy acts.
- **Healthcheck per service**:
  - postgres: `pg_isready`.
  - api: `/health/live` called with `node -e "fetch(...)"`, because slim images have no curl. Keep `/health` (DB + queue) for the external monitor only, so a DB blip does not flap api health.
  - worker: a heartbeat file or a tiny `/health/live`.
- **Resource limits**: set `deploy.resources.limits` (`cpus`, `memory`, `pids`) on every service. Hitting the memory limit emits an `oom` event and sets `OOMKilled`. Also bound work inside the worker: ffmpeg `-threads`, sharp concurrency, and pg-boss per-queue concurrency.
- **Stop timeouts.** Compose sends SIGKILL 10 s after SIGTERM by default. pg-boss `stop()` waits up to 30 s by default for active jobs, and Postgres needs time for a clean shutdown and checkpoint. Without longer grace periods, every deploy and every unattended reboot hard-kills the worker mid-job and can force Postgres into crash recovery. Set `stop_grace_period` per service (table below). Handle SIGTERM: the api closes its server and drains requests; the worker runs `boss.stop({ graceful: true })`. Video jobs must be idempotent so a killed job retries safely.
- **Process and privileges, per service.** One rule for every service breaks two containers. The official postgres image starts as root: it chowns `PGDATA` and `/var/run/postgresql`, then switches user with `exec gosu postgres`, which needs CHOWN, SETUID and SETGID, plus DAC_OVERRIDE and FOWNER. So `cap_drop: [ALL]` alone stops it from starting.

  | Service | User | Capabilities | Root filesystem | Writable paths | `stop_grace_period` |
  |---|---|---|---|---|---|
  | proxy (Caddy) | image default | `cap_drop: [ALL]`, `cap_add: [NET_BIND_SERVICE]` | `read_only: true` | volumes for `/data`, `/config` | default |
  | api | `node` (uid 1000) | `cap_drop: [ALL]` | `read_only: true` | tmpfs `/tmp` (`size=64m`) | long enough to drain requests, for example 15 s |
  | worker | `node` (uid 1000) | `cap_drop: [ALL]` | `read_only: true` | named volume for media scratch; tmpfs `/tmp` (`size=64m`) | ≥ pg-boss stop timeout + margin, for example 40 s |
  | postgres:17 | root entrypoint → `gosu postgres` | `cap_drop: [ALL]`, `cap_add: [CHOWN, DAC_OVERRIDE, FOWNER, SETUID, SETGID]`; or `user: "999:999"` on a pre-owned data volume and drop all | writable (if `read_only`, add tmpfs for `/var/run/postgresql` and `/tmp`) | data volume | 60–120 s |

  - All services: `security_opt: [no-new-privileges:true]`; `init: true` on the Node services (Node "was not designed to run as PID 1"; the init forwards signals and reaps zombies); `shm_size` on postgres.
  - Caddy images before 2.11.8 set the file capability `cap_net_bind_service=+ep`, so under `cap_drop: [ALL]` the kernel refuses to exec the binary ("operation not permitted"). Since 2.11.8 (2026-11-04) the image sets `+p` and Caddy raises the capability itself. Keeping `cap_add: [NET_BIND_SERVICE]` works with both.
  - Add a CI smoke test that `docker compose up` with the production compose file turns every service healthy.
- **Daemon (`/etc/docker/daemon.json`)**:
  - `"log-driver": "local"`.
  - `"live-restore": true`, which keeps containers running across daemon restarts. It works only across patch releases (`YY.MM.x`), not major upgrades.
  - Leave `firewall-backend` at its default (`iptables`); see Firewall.

### Host

- **Firewall**:
  - Docker-published ports bypass ufw: Docker NATs traffic before it reaches the INPUT chain.
  - In Compose, a port without a host IP binds `0.0.0.0` and "bypass[es] host firewall rules".
  - So use the **provider's cloud firewall** (outside the VM) to allow only 22 (from admin IPs) and 80/443.
  - Publish only the proxy's ports. Leave Postgres, api and worker unpublished on the internal network.
  - Bind any host-only port to `127.0.0.1`. Hosts on the same L2 segment can reach such ports on Docker Engine below 28.0.0.
  - Put host rules in the `DOCKER-USER` chain. That chain belongs to Docker's default firewall backend, iptables (`iptables-nft` or `iptables-legacy`). Docker 29.0.0 added an **experimental** nftables backend (`"firewall-backend": "nftables"`); under it the daemon adds no jump to `DOCKER-USER`, so rules there are silently ignored. Keep the default backend while host rules live in `DOCKER-USER`. (Docker's Ubuntu install page still says Docker is only compatible with `iptables-nft` and `iptables-legacy`; the nftables page is newer.)
- **SSH**: key-only, in a drop-in under `/etc/ssh/sshd_config.d/`: `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PermitRootLogin no`, `AllowUsers <deploy-user>`. Also restrict port 22 at the provider firewall.
  - **Name the drop-in so it sorts first**, for example `00-hardening.conf`. Ubuntu includes `sshd_config.d/*.conf` at the top of `sshd_config`, and sshd keeps the first value it reads for most keywords. cloud-init on provider images often writes `50-cloud-init.conf` with `PasswordAuthentication yes`, which beats any file sorting after it. Alternatively set `ssh_pwauth: false` in cloud-init.
  - Check the effective settings with `sshd -T | grep -Ei 'passwordauth|kbdinteractive|permitroot'`.
- **Deploy access**: GitHub-hosted runners use shared IP ranges that change, and GitHub does not recommend allowlisting by IP. An SSH push from Actions would need port 22 open to the world. So the deploy flow (#7) must be one of: pull-based (the VPS pulls a tagged image from GHCR, triggered over 443 or by a timer), CI reaching the VPS over WireGuard or Tailscale, or a self-hosted runner. Port 22 stays restricted to admin IPs.
- **Secrets**: a VPS has no platform env store, which NFR-05 assumes. Keep Razorpay, Clerk, R2, Resend and database secrets in a root-owned `0600` file outside the repo, or as Compose `secrets:` files (mounted at `/run/secrets/<name>`), written at deploy time from GitHub Environment secrets. Docker's docs note that environment variables are often available to all processes and can end up in logs. Never bake secrets into images. Rotation goes in the runbook. NFR-05 needs rewording (for example "platform env stores or root-only secret files on the host"), routed through #7.
- **Clock sync**: auction countdowns and anti-sniping use server time (§3.3), Clerk's JWT verification allows 5 s of clock skew by default (`clockSkewInMs`), and payment reconciliation uses time windows (§3.6). Ubuntu uses chrony with NTS by default since 25.10. Keep it active, and add clock-sync status to the host check.
- **Updates**:
  - Ubuntu installs security updates daily by default through `unattended-upgrades` (release, `-security` and ESM origins).
  - Added repositories, including Docker's apt repo, are **not** upgraded automatically. Upgrade Docker deliberately, or add its origin knowing that a major upgrade restarts containers.
  - `Automatic-Reboot` defaults to `false`. Enable it with an `Automatic-Reboot-Time` in a low-traffic IST window. The stop grace periods above make these reboots clean.
  - Docker Engine supports Ubuntu 26.10 and the LTS releases 26.04, 24.04 and 22.04. Use 26.04 or 24.04 LTS on the host.
- **Docker socket**:
  - The daemon runs as root, and membership of the `docker` group gives root-level privileges.
  - Never mount `/var/run/docker.sock` into api, worker or proxy.
  - Never expose the daemon over TCP; unauthenticated TCP now fails at startup. Administer remotely with `DOCKER_HOST=ssh://…`.
  - Rootless mode is available if more isolation is needed.

### Availability budget (NFR-04)

- 99.5 % of a 30-day month allows 3.6 h (216 min) of downtime.
- Each incident costs detection + acknowledgement + repair. Detection takes about 3 minutes. Acknowledgement depends on the alert route and the on-call person; state an assumed figure (for example 15 minutes in hours, 30 minutes out of hours) and measure it. A security reboot takes minutes; recreating containers on deploy takes seconds with `docker rollout` (#3).
- A single host has no redundancy. If the host is lost, the rebuild plus restore (#3) decides whether the month stays within budget. Script provisioning (cloud-init) so a rebuild takes minutes.

## Recommendation

1. **Input to #7, not this ticket's PR.** #7's resolution owns the SPEC §3.1 ORM/DB and API hosting rows, §3.7, NFR-04 and NFR-08. Hand it:
   - API hosting: Docker Compose on one VPS in a Mumbai region (proxy, api, worker and `postgres:17` on persistent volumes), on a dedicated or CPU-optimised plan. Remove "VPS rejected" and the Railway/Neon wording, which conflict with the map's settled decisions.
   - NFR-05 rewording for secrets on the host (§3 Secrets).
   - The deploy-access constraint: pull-based deploy, a private tunnel from CI, or a self-hosted runner, with port 22 kept to admin IPs.
2. **This ticket's own `docs:` PR**:
   - §3.1 "Observability" row and NFR-09 name the mechanisms: Sentry Uptime Monitor on `/health` (1-minute interval, 3 failures); Sentry Crons on the per-minute scheduler, reconciliation, backups and the restore drill; a worker job alerting on dead-letter depth > 0 and per-queue `warningQueueSize`; a host systemd check reporting to a Sentry Cron HTTP check-in (disk ≥ 80 %, restarts, unhealthy, OOM, clock); Sentry `release` = image tag; request id propagated web → api → jobs; logs through pino → stdout → Docker `local` driver plus Sentry `pinoIntegration` at `warn`+; alert routes to a named on-call person.
   - A new "Host operations" subsection (item 3).
   - §3.2 layout: add the production compose file next to the local `docker-compose.yml`.
   - §12 S0: add host provisioning (cloud-init), the host check and the production compose file. S23: add the pre-launch load test (item 5).
3. **"Host operations" subsection contents**:
   - The Compose defaults from §3: restart, healthcheck, limits, `stop_grace_period`, SIGTERM handling, and the per-service privilege table (postgres keeps the capabilities its entrypoint needs; worker scratch on a named volume).
   - `daemon.json` with the `local` log driver, `live-restore` and the default iptables firewall backend.
   - Provider firewall allowing 22 (admin IPs)/80/443 only, with only the proxy publishing ports.
   - Key-only SSH in a drop-in that sorts before cloud-init's, checked with `sshd -T`.
   - `unattended-upgrades` with a timed reboot; chrony kept active.
   - Root-only secret files written at deploy time.
   - No Docker socket inside any container.
   - The scale order and its triggers: second api replica → worker → Postgres.
4. **Set explicit pool and limiter settings**: Prisma `pg` `max` and `connectionTimeoutMillis`, pg-boss `max`, the limiter's `UNLOGGED` table with `tableCreated: true` and `inMemoryBlockOnConsumed`, and Postgres `shared_buffers`, `effective_cache_size` and `pg_stat_statements`.
5. **Load test as a pre-launch gate on the provisioned VPS (S23, "perf pass, load tests")**: 50 req/s mixed reads and writes, plus 200 req/s on one auction lot, while a 500 MB video transcodes. Pass means NFR-02 p95 holds and neither proxy nor api shows sustained CPU throttling. The lot-poll part can run once auctions exist (S12), if a VPS is up by then. At S0 there is no target VPS (map #2: the backend is deployed "once the build is solid"), so record only a local-compose baseline on the health and read endpoints during a transcode.

## Open risks

- **Auction polling** at 200 req/s on one lot is 4× NFR-02's test point. It needs a short-TTL lot cache in the api or CDN micro-caching. The CDN option depends on how #10 fronts the API.
- **HEIC**: SPEC §4.7 accepts it, but sharp's prebuilt binaries cannot decode it. Preferred path: pin ffmpeg ≥ 8.1 in the worker image (distro packages may lag) and convert HEIC/HEIF to lossless PNG before the existing sharp pipeline, so the prebuilt sharp stays. Prove it with fixture tests on tiled iPhone HEICs (orientation, colour profile). Fallback: a custom libvips with libheif + libde265.
- **`audit_log` growth**: append-only with no retention rule (OD-12). It drives disk size; retention must work without `DELETE`.
- **Single point of failure**: meeting 99.5 % depends on fast rebuild and restore (#3) and on a person seeing the alert.
- **Media on volumes**: if media ever moves from R2 to local volumes, disk size, backups and the scale order all change.
- **Unvalidated shape**: the starting shape is derived from docs and has not been benchmarked.
- **Bespoke host check**: the systemd check script is new code and needs a test and a runbook entry.
- **One observability vendor**: if Sentry ingestion is down, alerting stops. Sentry log quota behaviour has not been checked.

## Sources

All accessed 2026-11-16 unless dated.

- SPEC.md §3.1, §3.2, §3.3, §3.6, §4.3, §4.7, §8.1, §10, §12, §13 (main @ `f21eb55`); issues [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2) (Notes), [#3](https://github.com/SiddharthMuramkar/foa-platform/issues/3) (resolution), [#7](https://github.com/SiddharthMuramkar/foa-platform/issues/7) (scope).
- sharp v0.35.5: [performance](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/performance.md), [install](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/install.md), [api-utility (cache)](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/api-utility.md), [api-constructor](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/api-constructor.md), [api-output (heif)](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/api-output.md).
- FFmpeg codec options (`threads`): https://ffmpeg.org/ffmpeg-all.html#Codec-Options; [Changelog](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/Changelog) (8.1: "ffmpeg CLI tiled HEIF support").
- PostgreSQL 17: [resource](https://www.postgresql.org/docs/17/runtime-config-resource.html), [query planning](https://www.postgresql.org/docs/17/runtime-config-query.html), [connections](https://www.postgresql.org/docs/17/runtime-config-connection.html), [pg_stat_statements](https://www.postgresql.org/docs/17/pgstatstatements.html).
- postgres image: [17/bookworm docker-entrypoint.sh](https://github.com/docker-library/postgres/blob/master/17/bookworm/docker-entrypoint.sh) (chown at L51–59, `gosu` at L341–343), [Arbitrary `--user` notes](https://github.com/docker-library/docs/blob/master/postgres/content.md#arbitrary---user-notes); `/dev/shm`: https://github.com/docker-library/postgres/issues/416; Docker run default `--shm-size` 64m: https://docs.docker.com/reference/cli/docker/container/run/
- Caddy image capabilities: [caddy-docker#396](https://github.com/caddyserver/caddy-docker/issues/396), [v2.11.8 commit (`+p`)](https://github.com/caddyserver/caddy-docker/commit/8338ec8) (2026-11-04).
- Prisma ORM v7 connection pool defaults: https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections/connection-pool
- pg-boss 12.38.2: [constructor](https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/constructor.md), [queues (retention)](https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/queues.md), [events](https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/events.md), [ops (`stop` timeout 30000)](https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/ops.md).
- rate-limiter-flexible: [PostgreSQL](https://github.com/animir/node-rate-limiter-flexible/wiki/PostgreSQL), [Options (`tableCreated`, `inMemoryBlockOnConsumed`)](https://github.com/animir/node-rate-limiter-flexible/wiki/Options).
- Node.js 24: [CLI](https://nodejs.org/docs/latest-v24.x/api/cli.html), [process](https://nodejs.org/docs/latest-v24.x/api/process.html); Docker and Node.js best practices: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
- Vercel: [regions](https://vercel.com/docs/regions) (2026-08-11), [function regions](https://vercel.com/docs/functions/configuring-functions/region) (2026-08-11).
- Regions and provider features:
  - [DigitalOcean regional availability](https://docs.digitalocean.com/platform/regional-availability/) (verified 2026-10-28), [DO firewalls availability](https://docs.digitalocean.com/products/networking/firewalls/details/availability/) (2026-07-13)
  - [Vultr locations](https://www.vultr.com/features/datacenter-regions/) (crawled 2026-10-12), [Vultr Chennai](https://blogs.vultr.com/chennai-cloud-data-center-region) (2026-10-21), [Vultr regions API](https://api.vultr.com/v2/regions) and [plans API](https://api.vultr.com/v2/plans), [Vultr block storage performance](https://docs.vultr.com/products/cloud-storage/block-storage/storage-performance-block-storage)
  - [Akamai availability](https://www.akamai.com/why-akamai/global-infrastructure/availability) (2026-08-18), [Akamai India sites](https://techdocs.akamai.com/cloud-computing/docs/how-to-choose-a-data-center) (2026-11-10), [Linode regions API](https://api.linode.com/v4/regions) and [region plan availability](https://api.linode.com/v4/regions/ap-west/availability)
  - [Hetzner locations](https://docs.hetzner.com/cloud/general/locations/)
  - Secondary latency test: https://dev.to/karthik_yk/cheapest-vps-for-india-in-2026-i-verified-every-price-and-measured-the-latency-19b6 (2026-10-28)
- Sentry: [Uptime Monitoring](https://docs.sentry.io/product/monitors-and-alerts/monitors/uptime-monitoring/), [Crons over HTTP](https://docs.sentry.io/product/monitors-and-alerts/monitors/crons/getting-started/http/), [JS APIs (`withMonitor`)](https://docs.sentry.io/platforms/javascript/guides/node/configuration/apis/), [pino integration](https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/pino/) and [its source (default levels, main-thread parse)](https://github.com/getsentry/sentry-javascript/blob/develop/packages/node/src/integrations/pino.ts), [releases](https://docs.sentry.io/platforms/javascript/guides/node/configuration/releases/).
- Pino v10.3.1 transports: https://github.com/pinojs/pino/blob/v10.3.1/docs/transports.md; pino-http (`autoLogging`, `genReqId`): https://github.com/pinojs/pino-http
- Clerk `clockSkewInMs` (default 5000): https://github.com/clerk/clerk-docs/blob/main/clerk-typedoc/backend/authenticate-request-options.mdx
- Docker:
  - [logging drivers](https://docs.docker.com/engine/logging/configure/), [local driver](https://docs.docker.com/engine/logging/drivers/local/)
  - [restart policies](https://docs.docker.com/engine/containers/start-containers-automatically/), [Compose services reference (`stop_grace_period`)](https://docs.docker.com/reference/compose-file/services/), [Compose deploy](https://docs.docker.com/reference/compose-file/deploy/), [startup order](https://docs.docker.com/compose/how-tos/startup-order/), [Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/), [tmpfs mounts](https://docs.docker.com/engine/storage/tmpfs/)
  - [Swarm health replacement](https://docs.docker.com/engine/swarm/how-swarm-mode-works/services/), [events](https://docs.docker.com/reference/cli/docker/system/events/)
  - [ufw and packet filtering](https://docs.docker.com/engine/network/packet-filtering-firewalls/), [iptables / DOCKER-USER](https://docs.docker.com/engine/network/firewall-iptables/), [nftables (experimental, 29.0.0)](https://docs.docker.com/engine/network/firewall-nftables/), [port publishing](https://docs.docker.com/engine/network/port-publishing/)
  - [live restore](https://docs.docker.com/engine/daemon/live-restore/), [daemon attack surface](https://docs.docker.com/engine/security/), [docker group](https://docs.docker.com/engine/install/linux-postinstall/), [Ubuntu install](https://docs.docker.com/engine/install/ubuntu/)
- Healthcheck restarts: `--exit-on-unhealthy` dropped from [moby#22719](https://github.com/moby/moby/pull/22719) (per [talex5 on moby#28400](https://github.com/moby/moby/issues/28400#issuecomment-260588932)); restart-on-unhealthy still open: [moby#28400](https://github.com/moby/moby/issues/28400).
- Ubuntu: [automatic updates](https://ubuntu.com/server/docs/how-to/software/automatic-updates/) (2026-07-15), [OpenSSH server](https://ubuntu.com/server/docs/how-to/security/openssh-server/) (2026-10-02), [time synchronisation (chrony default since 25.10)](https://ubuntu.com/server/docs/explanation/networking/about-time-synchronisation/); [sshd_config(5)](https://man.openbsd.org/sshd_config) ("the first obtained value will be used"); cloud-init `50-cloud-init.conf`: https://github.com/canonical/cloud-init/issues/5934
- GitHub IP addresses (allowlisting not recommended): https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-githubs-ip-addresses
- Docker socket: OWASP Docker Security Cheat Sheet, [Rule #1](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html) (read-only mount does not make the API read-only); socket proxy: https://github.com/Tecnativa/docker-socket-proxy; agents needing the socket: [Beszel agent](https://beszel.dev/guide/agent-installation), [Grafana Alloy Docker monitoring](https://grafana.com/docs/alloy/latest/monitor/monitor-docker-containers/).

## Verification

Two critics checked 112 claims (refute: 76, fit: 36) and raised 25 issues. Each was checked against the cited or primary source. All 25 led to corrections; two were adopted only in part:

- **Caddy and `cap_drop: [ALL]`**: the reported exec failure is real for Caddy images before 2.11.8, but the current image (2.11.8, 2026-11-04) sets `+p` and works with all capabilities dropped. Kept `cap_add: [NET_BIND_SERVICE]` as it works with both.
- **Two api replicas from the start**: not adopted. The claim that every deploy drops the API is wrong, because #3 settled zero-downtime `docker rollout`. Adopted instead: a same-host second replica as the first scale step with a trigger, a worker-split trigger, and a connection budget that counts the rollout's transient container.
