# Docker host operations: shape, monitoring, hardening

Research for [#11](https://github.com/SiddharthMuramkar/foa-platform/issues/11) (map [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2)). Researched 2026-11-16. Technical facts only; no cost. Covers NFR-02, NFR-03, NFR-04 and NFR-09 in SPEC §10.

## Answer

- **Shape**: one VPS in Mumbai, next to Vercel `bom1`. Start at about 4 vCPU, 8 GB RAM and 80 GB NVMe running proxy + api + worker + Postgres 17. The worker gets a hard CPU and memory cap, and Postgres gets explicit memory settings. These numbers are an estimate: a load test must confirm them.
- **Split order** when the host is outgrown: worker first (its CPU bursts are the main threat to api p95), then Postgres, then api replicas.
- **Monitoring**: Sentry is already in the stack and covers uptime on `/health` (checked off the host every minute), worker heartbeats (Crons), errors and pino logs. The worker checks pg-boss queue depth and dead-letter queues. A host systemd timer checks disk, restarts, health and OOM and reports to a Sentry Cron monitor, so no container gets the Docker socket.
- **Hardening**: Docker-published ports bypass ufw, so use the provider firewall and publish only 80/443. SSH is key-only. Ubuntu `unattended-upgrades` (on by default) plus a timed auto-reboot. Docker never restarts an `unhealthy` container, so processes must exit on fatal errors.

## 1. Shape

### Load and data facts

- **The load is 4× the NFR-02 test point.** NFR-02 measures at 50 req/s. But SPEC §3.3 has every viewer poll its auction lot every 5 s, and NFR-03 targets 1,000 viewers on one lot: that is **200 req/s on one endpoint**.
- **Postgres data is small.** NFR-03's row counts (100k Participants, 10k Schools, 200k Submissions) are small for Postgres. SPEC §3.1 keeps media in object storage. If #3 moves media onto host volumes, disk size grows by orders of magnitude (200k Submissions × up to 5 × 25 MB originals, plus derivatives).
- **Worker inputs** (SPEC §4.7): images up to 25 MB, video up to 500 MB.
- **ffmpeg** `threads` defaults to `auto`: by default an encode uses every core.
- **sharp**:
  - Threads per image equal the CPU core count, except on glibc Linux without jemalloc or `MALLOC_ARENA_MAX`, where the default is 1.
  - The number of images processed in parallel is capped by `UV_THREADPOOL_SIZE` (default 4).
  - The libvips cache defaults to 50 MB, 20 files and 100 items.
  - `limitInputPixels` (default 268,402,689 px) bounds memory per image.
- **sharp needs a better allocator on glibc.** sharp's docs say the default glibc allocator is "unsuitable for long-running, multi-threaded processes". Use jemalloc or `MALLOC_ARENA_MAX=2`. musl (Alpine) is unaffected; its prebuilt binaries need musl ≥ 1.2.5.
- **sharp's prebuilt binaries cannot read HEIC**, but SPEC §4.7 accepts HEIC. They decode JPEG, PNG, Ultra HDR, WebP, AVIF, TIFF, GIF and SVG. HEIC needs a globally installed libvips built with libheif, libde265 and x265.
- **Postgres 17 memory**:
  - `shared_buffers` defaults to 128 MB.
  - For a dedicated server with 1 GB+ RAM, the docs suggest starting at 25 % of RAM, and say more than 40 % is unlikely to help.
  - `effective_cache_size` (default 4 GB) is only a planner hint.
- **Postgres connections and shared memory**:
  - `max_connections` defaults to 100, with 3 slots reserved for superusers.
  - Docker's `/dev/shm` defaults to 64 MB. That is too small for parallel queries, which fail with "could not resize shared memory segment". Set `shm_size`.
- **The connection budget fits.** Prisma 7's `pg` adapter pools `max` 10 connections by default. pg-boss pools `max` 10 per instance. api (Prisma 10 + pg-boss sender 10) plus worker (Prisma 10 + pg-boss 10) is 40 connections, well under the 97 usable.
- **Prisma's default pool has no timeout.** The `pg` adapter's `connectionTimeoutMillis` defaults to `0`. A saturated pool queues requests forever instead of failing fast, so p95 degrades silently. Set it explicitly.
- **Node 24 can size its heap from the container limit.** `--max-old-space-size-percentage` sets the V8 heap as a share of available memory. `process.constrainedMemory()` (stable in v24) reads the cgroup limit.

### Starting shape

This is an estimate on a 4 vCPU / 8 GB host and must be load-tested. CPU limits are caps, not reservations, so their sum may exceed the vCPU count. Only the worker gets a CPU cap low enough to protect api and Postgres.

| Container | CPU limit | Memory limit | Settings |
|---|---|---|---|
| proxy (TLS, routing; details in #10) | 0.5 | 256 MB | Only container with published ports (80/443) |
| api | none | 1 GB | One Node process. `--max-old-space-size-percentage=75`. Prisma `max` 10 with `connectionTimeoutMillis` set |
| worker | 2 | 2 GB | `MALLOC_ARENA_MAX=2` or jemalloc. ffmpeg `-threads 2`. Video job concurrency 1. Writable scratch ≥ 2 × 500 MB per video job |
| postgres:17 | none | 3 GB | `shared_buffers` ≈ 1 GB, `effective_cache_size` ≈ 3 GB, `shm_size: 256mb`, `pg_stat_statements` on |
| OS, Docker, page cache | — | ~1.7 GB | — |

**Disk**: NVMe/SSD, about 80 GB. It holds:

- OS and images: about 15–20 GB.
- Postgres data and WAL. These stay small at NFR-03 volumes; pg-boss job-table churn is bounded by retention.
- Worker scratch.
- Container logs: the `local` driver keeps 100 MB per container by default.
- Any local backup staging (#3).

Alert at 80 % full. A separate block volume for Postgres data makes resizing and rebuilding the host easier (ties to #3).

### What to split first

1. **Worker → second VPS** in the same region, over a private network. The worker is stateless: it needs only the DB URL and object-storage credentials. ffmpeg and sharp default to all cores, so moving the worker removes the main threat to api p95. pg-boss is built for many instances (`getInstances()` tracks host, pid and pool per instance).
2. **Postgres → its own VPS or block volume**, when the working set outgrows memory (cache hit ratio falls, IO wait rises) or to isolate the DB from app deploys.
3. **api replicas behind the proxy**. The rate limiter already uses a Postgres store (SPEC §3.1), so replicas share no in-memory state.

### Region near India

- **Vercel**: `bom1` is AWS `ap-south-1`, Mumbai. Vercel Functions default to `iad1`; set `regions: ["bom1"]` so server-side fetches to the API stay in-country (wiring belongs to #10).
- **Providers with India regions**, from their own pages:

  | Provider | India regions |
  |---|---|
  | Vultr | Mumbai, Bangalore, Delhi NCR (Chennai announced 2026-10-21 as a GPU region) |
  | Akamai/Linode | Mumbai (`ap-west`), Mumbai 2 (`in-bom-2`), Chennai (`in-maa`) |
  | DigitalOcean | Bangalore (`blr1`) only |
  | Hetzner Cloud | None; nearest is Singapore |

- **Latency (secondary source, indicative only)**: a third-party test from an Indian connection measured about 3.6 ms to Vultr or Linode Mumbai and 17 ms to DigitalOcean Bangalore.

## 2. Monitoring and alerting

| Signal | How | Fires when |
|---|---|---|
| Uptime of `/health` (DB + queue, SPEC §8.1) | **Sentry Uptime Monitor**: 1-minute interval, checks from several regions in turn, 10 s timeout (configurable up to 30 s), default 3 consecutive failures | About 3 minutes of downtime |
| Worker alive, schedules firing | **Sentry Crons**: `Sentry.withMonitor()` around the per-minute scheduler job and the 15-minute payment reconciliation (SPEC §3.6) | A check-in is missed or reports an error |
| Queue depth | Worker job every minute: `boss.getQueues()` → `queuedCount`, `readyCount`, `readyOldestSeconds`. Also forward pg-boss `warning` events of type `queue_backlog`, which fire when `queuedCount` exceeds `warningQueueSize` (default 10,000; set lower per queue on `createQueue`) | Sentry issue |
| Dead letters | Each queue's `deadLetter` target is an ordinary queue. Dead-lettered jobs run under that queue's own config and simply sit queued when no worker consumes it. `redrive()` re-runs them. The NFR-04 admin view reads the same counts | Dead-letter queue `queuedCount` > 0 |
| pg-boss health | Forward the `warning` types `xmin_horizon`, `autovacuum_disabled` and `handler_overrun`. `getInstances()` reports `crashRestarts` | Sentry issue |
| Disk, volume, memory, container restarts, health, OOM | **Host systemd timer** every minute runs `df`, `docker system df -v` and `docker inspect` (`RestartCount`, `State.Health.Status`, `State.OOMKilled`), then reports via a **Sentry Cron HTTP check-in** (`?status=ok` or `?status=error`) | An error check-in, or a missed one (host down) |
| Errors and p95 | Sentry on api and worker (already in NFR-09). `pg_stat_statements` for slow SQL (needs `shared_preload_libraries` and a restart) | Sentry alert rules |
| Logs | pino JSON to stdout, kept on the box by the Docker `local` driver (rotates 5 × 20 MB per container, compressed). Shipped centrally by **Sentry `pinoIntegration()`** (SDK ≥ 10.18.0; set `enableLogs: true` below 10.71.0). NFR-06 redaction applies before both | Optional log alerts |

Notes:

- **Set the `local` log driver.** Docker's default `json-file` driver does not rotate logs; Docker's own docs warn it can exhaust the disk. Make `local` the default in `daemon.json`.
- **Queue counts can be a minute old.** pg-boss refreshes them every `monitorIntervalSeconds` (default 60 s), which is fine for 1-minute alerts.
- **Sentry log shipping runs in-process.** Pino's docs prefer shipping logs from a separate process, because in-process transports load the event loop. The alternative with no in-process cost is a host agent such as Grafana Alloy's `loki.source.docker`, but that agent reads the Docker socket.
- **Off-the-shelf agents need the Docker socket.** Host-plus-container agents (Beszel agent, Grafana Alloy `prometheus.exporter.cadvisor`) read `/var/run/docker.sock`, and a `:ro` mount does not restrict API calls. They also need a hub or backend off the host to alert when the host is down. Use them only if dashboards and history are wanted, and then through a socket proxy that allows only read endpoints.
- **The uptime check must run off the host.** Sentry's does.

## 3. Runtime and hardening

### Containers (Compose)

- **Restart policy: `restart: unless-stopped` on every service.**
  - Compose's default is `no`.
  - `unless-stopped` restarts on exit and after a daemon restart or reboot, but not containers stopped by hand.
  - `on-failure` does not restart after a daemon restart.
- **Healthchecks do not trigger restarts.** Compose `healthcheck` takes `test`, `interval`, `timeout`, `retries`, `start_period` and `start_interval`. Standalone Docker and Compose never restart an `unhealthy` container; only Swarm replaces unhealthy tasks. An `--exit-on-unhealthy` option was rejected upstream ([moby#28400](https://github.com/moby/moby/issues/28400)).
  - Use health for `depends_on: condition: service_healthy` and for monitoring.
  - Get self-healing from the process: exit on fatal states (uncaught error, DB lost beyond retry, event-loop watchdog) so the restart policy acts.
- **Healthcheck per service**:
  - postgres: `pg_isready`.
  - api: `/health/live` called with `node -e "fetch(...)"`, because slim images have no curl. Keep `/health` (DB + queue) for the external monitor only, so a DB blip does not flap api health.
  - worker: a heartbeat file or a tiny `/health/live`.
- **Resource limits**: set `deploy.resources.limits` (`cpus`, `memory`, `pids`) on every service. Hitting the memory limit emits an `oom` event and sets `OOMKilled`. Also bound work inside the worker: ffmpeg `-threads`, sharp concurrency, and pg-boss per-queue concurrency.
- **Process and privileges**:
  - `init: true`: Node "was not designed to run as PID 1"; the init forwards signals and reaps zombies.
  - Run as the image's non-root `node` user (uid 1000).
  - `cap_drop: [ALL]` and `security_opt: [no-new-privileges:true]`.
  - `read_only: true`, with a tmpfs or volume for worker scratch.
  - `shm_size` on postgres.
- **Daemon (`/etc/docker/daemon.json`)**:
  - `"log-driver": "local"`.
  - `"live-restore": true`, which keeps containers running across daemon restarts. It works only across patch releases (`YY.MM.x`), not major upgrades.

### Host

- **Firewall**:
  - Docker-published ports bypass ufw: Docker NATs traffic before it reaches the INPUT chain.
  - In Compose, a port without a host IP binds `0.0.0.0` and "bypass[es] host firewall rules".
  - So use the **provider's cloud firewall** (outside the VM) to allow only 22 (from admin IPs) and 80/443.
  - Publish only the proxy's ports. Leave Postgres, api and worker unpublished on the internal network.
  - Bind any host-only port to `127.0.0.1`. Hosts on the same L2 segment can reach such ports on Docker Engine below 28.0.0.
  - Put host rules in the `DOCKER-USER` chain. Docker supports only `iptables-nft` or `iptables-legacy`, not native nft rulesets.
- **SSH**: key-only, in a drop-in under `/etc/ssh/sshd_config.d/`: `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PermitRootLogin no`, `AllowUsers <deploy-user>`. Also restrict port 22 at the provider firewall.
- **Updates**:
  - Ubuntu installs security updates daily by default through `unattended-upgrades` (release, `-security` and ESM origins).
  - Added repositories, including Docker's apt repo, are **not** upgraded automatically. Upgrade Docker deliberately, or add its origin knowing that a major upgrade restarts containers.
  - `Automatic-Reboot` defaults to `false`. Enable it with an `Automatic-Reboot-Time` in a low-traffic IST window.
  - Docker Engine supports Ubuntu 26.04 LTS and 24.04 LTS.
- **Docker socket**:
  - The daemon runs as root, and membership of the `docker` group gives root-level privileges.
  - Never mount `/var/run/docker.sock` into api, worker or proxy.
  - Never expose the daemon over TCP; unauthenticated TCP now fails at startup. Administer remotely with `DOCKER_HOST=ssh://…`.
  - Rootless mode is available if more isolation is needed.

### Availability budget (NFR-04)

- 99.5 % of a 30-day month allows 3.6 h (216 min) of downtime.
- Detection takes about 3 minutes; a security reboot takes minutes; recreating containers on deploy takes seconds (deploys are #3).
- A single host has no redundancy. If the host is lost, the rebuild plus restore (#3) decides whether the month stays within budget. Script provisioning (cloud-init) so a rebuild takes minutes.

## Recommendation

1. **SPEC §3.1**:
   - Change the "API hosting" row to Docker Compose on one VPS in a Mumbai region: proxy, api, worker and `postgres:17` on persistent volumes.
   - Note in the row that the worker image needs HEIC support (see risks).
   - Remove "VPS rejected" and the Railway/Neon wording, which conflict with the map's settled decisions.
2. **SPEC §3.1 "Observability" row and NFR-09**: name the mechanisms:
   - Sentry Uptime Monitor on `/health` (1-minute interval, 3 failures).
   - Sentry Crons on the per-minute scheduler and on reconciliation.
   - A worker job alerting on dead-letter queue depth > 0 and on per-queue `warningQueueSize`.
   - A host systemd check reporting to a Sentry Cron HTTP check-in (disk ≥ 80 %, restarts, unhealthy, OOM).
   - Logs through pino → stdout → Docker `local` driver, plus Sentry `pinoIntegration`.
3. **New "Host operations" subsection**, holding:
   - The Compose defaults from §3 above (restart, healthcheck, limits, `init`, non-root, `cap_drop`, `no-new-privileges`, `shm_size`).
   - `daemon.json` with the `local` log driver and `live-restore`.
   - Provider firewall allowing 22/80/443 only, with only the proxy publishing ports.
   - Key-only SSH, and `unattended-upgrades` with a timed reboot.
   - No Docker socket inside any container.
   - The split order: worker → Postgres → api replicas.
4. **Set explicit pool settings**: Prisma `pg` `max` and `connectionTimeoutMillis`, pg-boss `max`, and Postgres `shared_buffers`, `effective_cache_size` and `pg_stat_statements`.
5. **Make a load test a slice-S0 exit check** on the target VPS: 50 req/s mixed reads and writes, plus 200 req/s on one auction lot, while a 500 MB video transcodes. Pass means NFR-02 p95 holds.

## Open risks

- **Auction polling** at 200 req/s on one lot is 4× NFR-02's test point. It needs a short-TTL lot cache in the api or CDN micro-caching. The CDN option depends on how #10 fronts the API.
- **HEIC**: SPEC §4.7 accepts it, but sharp's prebuilt binaries cannot decode it. The worker image needs libvips with libheif, or another conversion path.
- **Single point of failure**: meeting 99.5 % depends on fast rebuild and restore (#3).
- **Media on volumes**: if #3 puts media on local volumes, disk size, backups and the split order all change.
- **Unvalidated shape**: the starting shape is derived from docs and has not been benchmarked.
- **Bespoke host check**: the systemd check script is new code and needs a test and a runbook entry.
- **One observability vendor**: if Sentry ingestion is down, alerting stops. Sentry log quota behaviour has not been checked.

## Sources

All accessed 2026-11-16 unless dated.

- SPEC.md §3.1, §3.3, §3.6, §4.7, §8.1, §10 (main @ `f21eb55`).
- sharp v0.35.5: [performance](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/performance.md), [install](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/install.md), [api-utility (cache)](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/api-utility.md), [api-constructor](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/api-constructor.md), [api-output (heif)](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/api-output.md).
- FFmpeg codec options (`threads`): https://ffmpeg.org/ffmpeg-all.html#Codec-Options
- PostgreSQL 17: [resource](https://www.postgresql.org/docs/17/runtime-config-resource.html), [query planning](https://www.postgresql.org/docs/17/runtime-config-query.html), [connections](https://www.postgresql.org/docs/17/runtime-config-connection.html), [pg_stat_statements](https://www.postgresql.org/docs/17/pgstatstatements.html).
- `/dev/shm` in the postgres image: https://github.com/docker-library/postgres/issues/416; Docker run default `--shm-size` 64m: https://docs.docker.com/reference/cli/docker/container/run/
- Prisma ORM v7 connection pool defaults: https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections/connection-pool
- pg-boss 12.38.2: [constructor](https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/constructor.md), [queues](https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/queues.md), [events](https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/events.md), [ops](https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/ops.md).
- Node.js 24: [CLI](https://nodejs.org/docs/latest-v24.x/api/cli.html), [process](https://nodejs.org/docs/latest-v24.x/api/process.html); Docker and Node.js best practices: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
- Vercel: [regions](https://vercel.com/docs/regions) (2026-08-11), [function regions](https://vercel.com/docs/functions/configuring-functions/region) (2026-08-11).
- Regions:
  - [DigitalOcean](https://docs.digitalocean.com/platform/regional-availability/) (verified 2026-10-28)
  - [Vultr locations](https://www.vultr.com/features/datacenter-regions/) (crawled 2026-10-12), [Vultr Chennai](https://blogs.vultr.com/chennai-cloud-data-center-region) (2026-10-21)
  - [Akamai availability](https://www.akamai.com/why-akamai/global-infrastructure/availability) (2026-08-18), [Akamai India sites](https://techdocs.akamai.com/cloud-computing/docs/how-to-choose-a-data-center) (2026-11-10)
  - [Hetzner locations](https://docs.hetzner.com/cloud/general/locations/)
  - Secondary latency test: https://dev.to/karthik_yk/cheapest-vps-for-india-in-2026-i-verified-every-price-and-measured-the-latency-19b6 (2026-10-28)
- Sentry: [Uptime Monitoring](https://docs.sentry.io/product/monitors-and-alerts/monitors/uptime-monitoring/), [Crons over HTTP](https://docs.sentry.io/product/monitors-and-alerts/monitors/crons/getting-started/http/), [JS APIs (`withMonitor`)](https://docs.sentry.io/platforms/javascript/guides/node/configuration/apis/), [pino integration](https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/pino/).
- Pino v10.3.1 transports: https://github.com/pinojs/pino/blob/v10.3.1/docs/transports.md
- Docker:
  - [logging drivers](https://docs.docker.com/engine/logging/configure/), [local driver](https://docs.docker.com/engine/logging/drivers/local/)
  - [restart policies](https://docs.docker.com/engine/containers/start-containers-automatically/), [Compose services reference](https://docs.docker.com/reference/compose-file/services/), [Compose deploy](https://docs.docker.com/reference/compose-file/deploy/), [startup order](https://docs.docker.com/compose/how-tos/startup-order/)
  - [Swarm health replacement](https://docs.docker.com/engine/swarm/how-swarm-mode-works/services/), [events](https://docs.docker.com/reference/cli/docker/system/events/)
  - [ufw and packet filtering](https://docs.docker.com/engine/network/packet-filtering-firewalls/), [iptables / DOCKER-USER](https://docs.docker.com/engine/network/firewall-iptables/), [port publishing](https://docs.docker.com/engine/network/port-publishing/)
  - [live restore](https://docs.docker.com/engine/daemon/live-restore/), [daemon attack surface](https://docs.docker.com/engine/security/), [docker group](https://docs.docker.com/engine/install/linux-postinstall/), [Ubuntu install](https://docs.docker.com/engine/install/ubuntu/)
- Unhealthy containers are not restarted: https://github.com/moby/moby/issues/28400
- Ubuntu: [automatic updates](https://ubuntu.com/server/docs/how-to/software/automatic-updates/) (2026-07-15), [OpenSSH server](https://ubuntu.com/server/docs/openssh-server).
- Docker socket `:ro` vs API access: https://github.com/Tecnativa/docker-socket-proxy; agents needing the socket: [Beszel agent](https://beszel.dev/guide/agent-installation), [Grafana Alloy Docker monitoring](https://grafana.com/docs/alloy/latest/monitor/monitor-docker-containers/).
