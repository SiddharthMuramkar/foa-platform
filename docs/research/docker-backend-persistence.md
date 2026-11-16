# Docker backend persistence: backups, file storage, deploys

Research for [#3](https://github.com/SiddharthMuramkar/foa-platform/issues/3) (feeds [#7](https://github.com/SiddharthMuramkar/foa-platform/issues/7)). Date: 2026-11-16. Scope: SPEC §3.1, §3.2, §3.5, §3.7, NFR-04, NFR-08. Adversarially verified against primary sources on 2026-11-16 (see "Verification log" at the end).

## Answer

One VPS running Docker Compose (`caddy`, `api`, `worker`, `postgres:17`) can meet NFR-04 and NFR-08 with four pieces. Postgres needs continuous WAL archiving plus scheduled base backups to an off-host S3 repository (pgBackRest ≥ 2.59.3) and a scripted restore drill. The `api` needs rollouts that start the new container before removing the old one (Caddy plus `docker rollout`), because Compose has no rolling updates. `prisma migrate deploy` runs once per release, before the rollout. Keep Cloudflare R2 for media, for three reasons. MinIO community edition is archived and gets no fixes. A store on the VPS would put terabytes of originals on one disk. Cloudflare's self-serve CDN terms bar serving video from a non-Cloudflare origin. Two SPEC assumptions break: R2 has **no object versioning** (NFR-08), and the Neon-only items (pooled vs direct URL, a branch per PR) have no equivalent with one container.

## 1. Postgres 17 in Docker

**Volume layout**
- Official image, majors 14–17: `PGDATA` and `VOLUME` are both `/var/lib/postgresql/data`. From 18 on, `VOLUME` moves to `/var/lib/postgresql` and `PGDATA` becomes `/var/lib/postgresql/<major>/docker` [1]. For 17, mount the named volume at `/var/lib/postgresql/data`; a mount at `/var/lib/postgresql` does **not** persist data on 17 [1]. Option: opt in to the 18-style layout now (`PGDATA=/var/lib/postgresql/17/docker`, volume at `/var/lib/postgresql`), which the image docs say enables the faster `pg_upgrade --link` at the next major upgrade [1].
- Use a named volume: Docker's preferred way to persist data [2].
- Never publish 5432. Published ports bypass ufw because Docker routes them in the `nat` table, before ufw's chains see them. Without a host IP, the port binds to `0.0.0.0` [3]. Postgres stays on the internal Compose network, or binds to `127.0.0.1` only.
- The Debian variant installs Postgres from the PGDG apt repository [1], which also ships pgBackRest [5]. `archive_command` runs inside the Postgres container, so the backup binary must live in that image: a thin `FROM postgres:17` plus `apt-get install pgbackrest`. On 2026-11-16 the PGDG pool carries **2.59.3** as its newest build; 2.60.0 is not packaged yet [45]. Pin the package version in the Dockerfile.
- Shutdown: the image sets `STOPSIGNAL SIGINT` (Postgres fast shutdown) and recommends raising the runtime stop timeout, since Docker's default is 10 s before SIGKILL [1][32]. Give the `postgres` service a long `stop_grace_period` (e.g. 2 min). A SIGKILL forces crash recovery and empties every `UNLOGGED` table [43].

**Backup options**

| Option | PITR | Notes |
|---|---|---|
| Scheduled `pg_dump` | No | A logical dump can't be used for WAL replay [4]. RPO is the gap between dumps. Portable across major versions. |
| `pg_basebackup` + `archive_command` (PG 17 adds `--incremental` and `pg_combinebackup`) | Yes | Built in. You script retention, encryption, off-host copies and verification yourself [4]. |
| **pgBackRest** (MIT; latest 2.60.0, PGDG ships 2.59.3) | Yes: `restore --type=time --target=… --target-action=promote` | Full, differential, incremental and block-incremental backups (block incremental requires `repo-bundle=y`). Parallel async archiving, AES-256-CBC repo encryption, S3/Azure/GCS/SFTP repos, `verify`, `expire` and retention [5][6]. |
| **WAL-G** | Yes | One Go binary: `wal-push`, `backup-push --wait-for-archive`, `backup-fetch`, `wal-fetch`. Configured by env vars. Last release v3.0.9, 20 Aug 2026 [7]. |

**Project health (verified against primary sources)**
- pgBackRest: the maintainer announced on 27 Apr 2026 that the project was no longer maintained. On 18 May 2026, a coalition of sponsors (AWS, Supabase, pgEdge, Tiger Data, Percona, Eon; later also Xata, Dalibo, Data Egret) funded further work. Releases since: 2.59.0 (20 Jul 2026), 2.59.1 (17 Aug), 2.59.2 (27 Sep), 2.59.3 (4 Oct) and 2.60.0 (18 Oct) [8]. (The postgresql.org news copy dates 2.59.0 as 30 Jul; pgbackrest.org and the GitHub release say 20 Jul [5][8].)
- pgBackRest advisory, 4 Oct 2026: versions before 2.59.3 could generate weak encryption subkeys and salts when OpenSSL could not get system random data. Upgrading does not replace a weak subkey already in `archive.info`/`backup.info`. A new install should start on ≥ 2.59.3; an existing repo needs the advisory's subkey check, and a new stanza in a new repo if it is weak [8].
- 2.59.0 made every command except `restore` refuse to run as root unless `allow-root` is set [8]: run pgBackRest as the `postgres` user (`docker compose exec -u postgres postgres pgbackrest …`), also for the drill, so restored files have the right owner.
- From 2.60.0, `restore` stops with an error on an invalid page checksum by default (`checksum-page-error=n` turns it into a warning) [5]. The PGDG 2.59.3 build does not do this yet.

**Off-host repository**
- Any S3-compatible bucket works. R2 needs region `auto` [9]. pgBackRest issues (2025, pgBackRest 2.54.1) report R2 429s and read timeouts [10][11]; R2 documents a limit of one concurrent write per second to the same key, above which it returns 429 [46].
- A compromised VPS holds keys that can delete the repo. Use separate credentials, and turn on deletion protection. pgBackRest's `repo-target-time` reads a repo "as it was at a point in time" only on versioned storage, which it supports on S3, GCS and Azure, ideally with S3 Object Lock [6]. R2 has neither versioning nor S3 Object Lock (`PutObjectLockConfiguration` not implemented) [9]; its only protection is bucket locks [13]. A backup repo on R2 therefore gets bucket locks but no `repo-target-time`. If R2 is used, keep the lock age shorter than pgBackRest's retention, because R2 rejects deletes of locked objects with 409 and `expire` could not remove them [13]. A provider with S3 versioning plus Object Lock also puts backups with a different vendor from the media.

**PITR settings**
- `archive_mode=on` (set at server start) and `archive_command = 'pgbackrest --stanza=foa archive-push %p'`. The command must exit 0 only on success [4].
- `archive_timeout` caps RPO during quiet periods [4].

**Restore drill (basis for `docs/runbooks/restore.md`)**
0. Scheduling: a host cron (or systemd timer) runs `docker compose exec -u postgres postgres pgbackrest --stanza=foa --type=full|incr backup`, since the backup must run where `PGDATA` and the socket are.
1. Weekly: `pgbackrest verify` checks that the backups and archives in the repo are valid [6].
2. Monthly:
   - Start a throwaway container from the same image on an empty volume.
   - As the `postgres` user, run `pgbackrest --stanza=foa --type=time --target="<ts>" --target-action=promote restore`.
   - Start Postgres and run sanity queries: row counts, and the latest `AuditLog`/`Payment` timestamp should be ≤ target.
   - Run `prisma migrate status`.
   - Record the RTO and RPO you achieved, then destroy the container.
3. Alert when `pg_stat_archiver.failed_count` rises or the last backup is more than 26 h old. These alerts plug into NFR-09.

## 2. File storage (§3.5 two-bucket model)

What §3.5 needs: presigned PUT and GET, multipart (presigned `UploadPart`), browser CORS, HEAD, `CopyObject` (publishing copies derivatives to `foa-public`), a public bucket behind a CDN with purge within 5 min (SG-05), NFR-08 protection for `foa-private`, and active maintenance.

| Need | Cloudflare R2 | Garage | SeaweedFS | RustFS | MinIO CE |
|---|---|---|---|---|---|
| Presigned PUT/GET | ✅ 1 s–7 days; only on the S3 endpoint `<ACCOUNT_ID>.r2.cloudflarestorage.com`, not on custom domains [12] | ✅ [14] | ✅ [15] | ✅ [16] | — |
| Multipart incl. `UploadPartCopy` | ✅ [9] | ✅ [14] | ✅ [15] | ✅ [16] | — |
| CORS | ✅ Only requests with a matching `Origin` header get CORS headers; rule changes can take up to 30 s [12] | ✅ [14] | ✅ [15] | ✅ | — |
| `CopyObject` | ✅ [9] | ✅ [14] | ✅ [15] | ✅ | — |
| Versioning | ❌ `PutBucketVersioning` not implemented (page updated 10 Nov 2026) [9] | ❌ [14] | ✅ [15] | ✅ [16] (an older, since removed docs page said it needs erasure coding on ≥ 4 disks: test on one disk) | — |
| Delete protection | Bucket locks: per prefix; for a duration, until a date, or indefinitely; take precedence over lifecycle rules; also block overwrites [13]. No S3 Object Lock [9] | ❌ No object lock [14] | Object lock ✅ [15] | Object Lock ✅ [16] | — |
| Lifecycle | ✅ [9] | Partial: abort incomplete multipart and expiration only [14] | ✅ (no transitions) [15] | ✅ Expiration and transition rules [16] | — |
| Public serving / CDN | Custom domain on Cloudflare cache. Purge after delete, or the cached object keeps being served [13] | Static website from a bucket [14] | ❌ bucket website [15] | — | — |
| Status | Managed, off the VPS | Active, v2.5.0 current [23]. NLnet grant (18 Apr 2026) for reliability and performance work. Originally designed for "a few terabytes at most"; the grant aims at wider use [17] | Active | 1.0.0 GA 16 Sep 2026, Apache-2.0 [18] | **Archived 25 Apr 2026**, "no longer maintained", source-only, legacy binaries get no updates [19]. Maintenance mode since 3 Dec 2025 (secondary source) [20] |

**Costs of self-hosting the store on the VPS**
- **CDN terms**: on Free, Pro and Business plans, video and other large files must go through Cloudflare's Developer Platform, Images or Stream to be served via the CDN. Otherwise Cloudflare may disable or limit CDN use for the zone [21][22]. A self-hosted bucket behind the Cloudflare proxy therefore puts the public video previews (MP4, ≤ 720p) at risk. R2 is part of the Developer Platform, so it is allowed.
- **Durability**: a single-node store on a VPS volume is one disk. It needs its own off-host copy and its own restore drill. Garage recommends `replication_factor=3` across nodes [17].
- **Capacity** (rough estimate, not measured): 200k Submissions × 3 images × ~5 MB ≈ 3 TB of originals, before derivatives and video (500 MB each).
- **Ops**: one more stateful service to patch.

**NFR-08 without R2 versioning**
- (a) Bucket lock rules on the `foa-private` prefixes for originals and finance documents. These also block legitimate deletes and overwrites (retention job, OD-12, consent or data-deletion requests) until the lock age passes; blocked deletes return 409 `ObjectLockedByBucketPolicy`, and a locked bucket cannot be emptied [13].
- (b) A scheduled one-way copy (copy, not sync) to a second bucket under different credentials.
- (c) Both.
- `foa-public` needs no backup: its derivatives can be regenerated from `foa-private`.

**Local dev**: replace MinIO, which SPEC §3.1/§3.2 still name. Garage runs as one container (`dxflrs/garage:v2.5.0`). Since v2.3.0 (Apr 2026), `garage server --single-node --default-bucket` creates a layout, a key and a bucket from `GARAGE_DEFAULT_ACCESS_KEY`, `GARAGE_DEFAULT_SECRET_KEY` and `GARAGE_DEFAULT_BUCKET` [23][47]. Its S3 region is `garage` (R2's is `auto`), so make the region an env var. It covers what §3.5 exercises: presign, multipart, CORS and copy [14]. SeaweedFS (`weed server -s3`) is the other option.

## 3. Edge and deploys

**TLS reverse proxy (Caddy)**
- Official image. Publish 80, 443 and 443/udp, and persist `/data`: it holds certificates and keys and "must not be treated as a cache" [24]. Automatic HTTPS needs ports 80 and 443 open externally: the ACME HTTP challenge uses port 80 and the TLS-ALPN challenge port 443 [24].
- Use `reverse_proxy` with:
  - `dynamic a api 3000 { refresh 2s }`: finds every replica through Docker DNS. The default `refresh` is **1 min**, too slow for a rollout [25];
  - `lb_try_duration 5s`: holds each request and retries another upstream while the chosen one is down. Off by default [25];
  - passive health checks (`fail_duration`, `unhealthy_status 5xx`). **Active health checks (`health_uri`) do not run for dynamic upstreams** [25], so they can't be combined with `dynamic a`.

**Zero-downtime redeploys**
- Compose itself can't do it. Its source marks `deploy.update_config` as "only applies to rolling updates in Swarm mode" [26][27]. `docker compose up -d api` stops the old container before starting the new one.
- **docker-rollout** (Docker CLI plugin): scales the service to twice its count, waits for the Docker healthcheck, waits `--wait-after-healthy` (default 3 s), then removes the old container. `--pre-stop-hook` runs a command in the old container first, for draining [28]. The service must not set `container_name` or `ports` [28]. Its docs name Traefik and nginx-proxy as the proxy. With Caddy, set `--wait-after-healthy` above Caddy's `refresh`, so Caddy has the new container's IP before the old one goes. The old one's in-flight requests finish on SIGTERM (graceful `server.close()`), and `lb_try_duration` retries requests that hit the stopped IP. Not documented upstream: prove it in a prototype.
- **Kamal 2**: kamal-proxy gives health-checked zero-downtime deploys and Let's Encrypt (`ssl: true`, single server), a separate role for a worker with no proxy, and "accessories" for Postgres [29]. It replaces Caddy and the rollout script in production, but local Compose and production config then diverge.
- **Swarm, single node** (`order: start-first`): since Mirantis acquired it, Docker Inc no longer maintains Swarm, and it lacks recent Compose features [30].
- **Worker**: takes no traffic, so stopping it before starting the new one is fine. pg-boss `stop()` waits for active jobs up to `timeout` (default 30 s), then fails them; a retry spends one attempt. Shutdown can run past the timeout while those failures settle [31]. Compose's `stop_grace_period` defaults to 10 s [32], so raise it well above the pg-boss timeout (e.g. 60 s), or SIGKILL cuts the graceful stop short. Jobs held by a killed worker come back through expiration (default 15 min) or heartbeat (off by default) [31].

**Migrations on release**
- Prisma's guidance: run `prisma migrate deploy` once, as its own step before new code takes traffic, not at every container start. Use a CI concurrency group, and keep the CLI in production dependencies [33].
- On the VPS, GitHub runners can't reach the database. So run `docker compose run --rm api prisma migrate deploy` with the new image, then `docker rollout api`. The runtime image therefore needs the `prisma` CLI, `prisma.config.ts` and the `migrations/` folder.
- During a rollout, old and new `api` run side by side. Migrations must therefore be backward-compatible (expand, then contract).

**Image registry (GHCR)**
- GitHub Packages are free for public packages. Container registry storage and bandwidth are "currently free" [34]. Actions push with `GITHUB_TOKEN` and `packages: write` [35].
- A package is **private on first publish** [48]. Either make it public (the repo is public), or give the VPS a token with `read:packages` to pull [35].
- Tag images with the git SHA, so a rollback means redeploying the previous tag. The repo is public, so the image must hold no secrets; env vars are injected at runtime.

**Availability**
- `restart: unless-stopped` [32]. The daemon's `live-restore` keeps containers running while dockerd restarts, and across patch (`YY.MM.x`) upgrades only, not `YY.MM` upgrades [36].
- 99.5 % a month allows about 3 h 39 min of downtime. Kernel reboots, Postgres minor-version restarts and a full host rebuild with restore all spend that budget.

## 4. Managed-Postgres assumptions in SPEC

| SPEC item | With one Postgres container |
|---|---|
| §3.1 "pooled URL for app, direct URL for migrations"; §3.7 `DATABASE_URL` + `DIRECT_DATABASE_URL` | No pooler means one URL. In Prisma 7 `url`/`directUrl` in the schema's `datasource` block are deprecated: the CLI reads `datasource.url` from `prisma.config.ts`, and the runtime uses `PrismaPg({ connectionString })` [37]. A separate direct URL only matters when a pooler sits in front; without one, both read the same `DATABASE_URL`. `DIRECT_DATABASE_URL` can go. PgBouncer isn't needed at this size: `max_connections` defaults to 100, with 3 reserved for superusers [38]. A node-postgres pool defaults to `max` 10 [39], and pg-boss to `max` 10 [40]. Count `api` ×2 during a rollout, plus the worker and the backup job, and set an explicit `max` per pool. |
| §3.1 pg-boss | Needs PG ≥ 13 and Node ≥ 22.12 [40]. `start()` creates and migrates its schema inside `pg_advisory_xact_lock`, so it is safe while the API, the worker and a rollout overlap [31]. Queue state sits in the same database, so the same backups cover it. A PITR restore can replay or drop recent jobs, so handlers must stay idempotent. |
| §3.1 `rate-limiter-flexible` (Postgres store) | Each `consume()` runs `INSERT … ON CONFLICT DO UPDATE`: a WAL-logged write [41]. Every 5 min by default, it deletes rows that expired more than an hour ago [42]. On one Postgres, every limited request also feeds the WAL archive. Option: create the table yourself (`tableCreated: true`) as `UNLOGGED`. Unlogged tables skip the WAL and are truncated after a crash [43], which is fine for counters. Add a memory `insuranceLimiter` for database blips [42]. Limit only mutating or sensitive routes: auction polling alone is ~200 req/s. |
| §3.7 Neon branch per PR, Railway PR environment | No equivalent. (a) Vercel previews share one staging `api` and database, with the R2 `*-preview` buckets. (b) A database per PR via `CREATE DATABASE foa_pr_N TEMPLATE foa_seed`, which fails if any session is connected to the template [44], plus an `api` container per PR. Heavier. (c) UI-only previews, with e2e tests against a `postgres:17` service container in CI. Until the VPS exists: local Compose and CI only. |
| NFR-08 "Neon point-in-time restore" | pgBackRest PITR plus the restore drill in §1. |
| §3.1 "API hosting: Railway … VPS rejected"; ADR `0003-hosting-vercel-railway-neon-r2` | Rewrite both (in #7). |

## Recommendation (input to #7)

1. **Postgres**:
   - Image and storage: `FROM postgres:17` plus a pinned pgBackRest ≥ 2.59.3 from PGDG apt (2.59.3 today), with a named volume at `/var/lib/postgresql/data` (or the opt-in 18-style layout). `stop_grace_period` of about 2 min on the `postgres` service.
   - Backups: `archive_mode=on` with async `archive-push`. A weekly full backup and daily block-incremental backups (`repo1-bundle=y`, `repo1-block=y`), time-based retention, an encrypted repo. Run pgBackRest as the `postgres` user from a host timer.
   - Repo: an S3 bucket with its own credentials (not the media keys) and deletion protection. Prefer a provider with S3 versioning plus Object Lock, which lets pgBackRest use `repo-target-time`. On R2, use bucket locks with a lock age shorter than retention.
   - Drill: `verify` weekly and a scripted PITR drill monthly, written up in `docs/runbooks/restore.md`. Alert on archive failures and backup age.
   - Fallbacks: a weekly `pg_dump` is optional (it survives major-version upgrades). WAL-G takes over if pgBackRest loses funding again.
2. **Media**: keep R2 and the two-bucket model unchanged. Rewrite NFR-08's R2 clause: bucket locks on the `foa-private` originals and finance prefixes, with the lock age set against OD-12 and deletion-request timelines, plus a one-way copy to a second bucket if a longer history is wanted. Replace MinIO with Garage in local Compose.
3. **Edge and deploys**:
   - Proxy: Caddy with automatic TLS, `dynamic a api 3000` with a short `refresh`, passive health checks and `lb_try_duration`. Only Caddy publishes ports. `live-restore` on.
   - Rollouts: `docker rollout api --wait-after-healthy <more than refresh>`; the `api` service has no `ports` or `container_name`. The worker is replaced stop-first, with `stop_grace_period` well above the pg-boss stop timeout (e.g. 60 s).
   - Release script: pull the SHA-tagged image from GHCR (public package, or a `read:packages` token on the VPS) → `compose run --rm api prisma migrate deploy` → `docker rollout api` → recreate the worker. GitHub Actions builds the image (`turbo prune --docker`) and triggers the script over SSH.
   - Migrations: expand/contract.
4. **Config**: one `DATABASE_URL`, an explicit pool size per pool, and an `UNLOGGED` rate-limit table. #7 picks the preview model: shared staging or UI-only previews.

## Open risks

- **One VPS, one point of failure.** RTO after losing the host (provision, then restore) must fit in 3.6 h a month. Unproven until the first drill.
- **pgBackRest funding**: support stopped in Apr 2026 and resumed in May on sponsor money. WAL-G is the fallback.
- **pgBackRest on R2** has reported 429s and timeouts [10][11]. Prove the backup-bucket provider in a drill.
- **R2 has no versioning.** Bucket locks block legitimate deletes (deletion requests, OD-12 retention) until the lock age passes: a product and legal call.
- **A compromised VPS can delete backups** unless the backup bucket has locks and separate credentials.
- **docker-rollout with Caddy** isn't documented upstream (only Traefik and nginx-proxy). Caddy runs no active health checks on dynamic upstreams and caches DNS for 1 min by default. Prototype the refresh, wait and drain timings.
- **pgBackRest packaging lag**: PGDG ships 2.59.3 while upstream is at 2.60.0. Pin the version, and watch the PGDG pool for updates.
- **Side-by-side rollouts** need backward-compatible migrations. A destructive migration still needs a maintenance window.
- **Postgres 18** changes the volume path [1]. A major upgrade needs `pg_upgrade` or dump/restore.
- **Unverified numbers**: the media capacity figure is an estimate (NFR-03's 200k Submissions × the default 3 images × an assumed ~5 MB). The MinIO maintenance-mode date comes from a secondary source [20].

## Sources (accessed 2026-11-16 unless dated)

1. docker-library/postgres, Dockerfile template (`PGDATA`, `VOLUME`, `STOPSIGNAL SIGINT`, PGDG apt): https://github.com/docker-library/postgres/blob/master/Dockerfile-debian.template. Image docs (`PGDATA`, 18+ layout, opt-in): https://github.com/docker-library/docs/blob/master/postgres/README.md
2. Docker docs, Volumes: https://docs.docker.com/engine/storage/volumes/
3. Docker docs, Packet filtering and firewalls (Docker and ufw): https://docs.docker.com/engine/network/packet-filtering-firewalls/. Compose `ports`: https://docs.docker.com/reference/compose-file/services/#ports
4. PostgreSQL 17 docs, Continuous archiving and PITR: https://www.postgresql.org/docs/17/continuous-archiving.html. WAL settings: https://www.postgresql.org/docs/17/runtime-config-wal.html
5. pgBackRest 2.60.0 release (2026-10-18): https://www.postgresql.org/about/news/pgbackrest-2600-released-3416/. 2.59.0 news copy (dated "July 30, 2026"; the release itself is 2026-07-20 per [8] and https://pgbackrest.org/release.html): https://www.postgresql.org/about/news/pgbackrest-2590-released-3355/
6. pgBackRest README, user guide, configuration (`repo-target-time`, `repo-block`, cipher types) and command reference (`verify`): https://github.com/pgbackrest/pgbackrest, https://pgbackrest.org/user-guide.html, https://pgbackrest.org/configuration.html, https://pgbackrest.org/command.html
7. WAL-G PostgreSQL docs: https://github.com/wal-g/wal-g/blob/master/docs/PostgreSQL.md. Releases (2026-08-20): https://github.com/wal-g/wal-g/releases
8. pgBackRest news (2026-04-27, 2026-05-04, 2026-05-18, 2026-07-20, 2026-08-17, 2026-09-27, 2026-10-04, 2026-10-18): https://pgbackrest.org/news.html
9. Cloudflare R2, S3 API compatibility (updated 2026-11-10): https://developers.cloudflare.com/r2/api/s3/api/
10. pgBackRest issue #2655, R2 429s: https://github.com/pgbackrest/pgbackrest/issues/2655
11. pgBackRest issue #2644, R2 timeouts (2025-06): https://github.com/pgbackrest/pgbackrest/issues/2644
12. Cloudflare R2, Presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/. CORS: https://developers.cloudflare.com/r2/buckets/cors/
13. Cloudflare R2, Consistency (caching): https://developers.cloudflare.com/r2/reference/consistency/. Bucket locks: https://developers.cloudflare.com/r2/buckets/bucket-locks/
14. Garage, S3 compatibility: https://garagehq.deuxfleurs.fr/documentation/reference-manual/s3-compatibility/
15. SeaweedFS wiki, Amazon S3 API: https://github.com/seaweedfs/seaweedfs/wiki/Amazon-S3-API. Object lock: https://github.com/seaweedfs/seaweedfs/wiki/S3-Object-Lock-and-Retention
16. RustFS docs, multipart: https://docs.rustfs.com/en/administration/data/object/multipart-upload. S3 API (versioning, lifecycle, Object Lock, presigned GET/PUT, CORS): https://docs.rustfs.com/en/administration/protocols/s3. Lifecycle (expiration, transition): https://docs.rustfs.com/en/administration/data/lifecycle-management. Deployment modes (single-disk SNSD has no redundancy): https://docs.rustfs.com/en/installation
17. Garage blog, NLnet grant (2026-04-18): https://garagehq.deuxfleurs.fr/blog/2026-04-performance-reliability/. Features (`replication_factor = 3`): https://garagehq.deuxfleurs.fr/documentation/reference-manual/features/
18. RustFS blog, "Announcing RustFS 1.0.0 GA" (2026-09-16): https://rustfs.com/blog/announcing-rustfs-1-0-0-ga/
19. minio/minio README (archived 2026-04-25): https://github.com/minio/minio
20. TuxCare, MinIO archival timeline (2026-05-21, secondary): https://tuxcare.com/blog/minio-els/
21. Cloudflare Service-Specific Terms, CDN (Free, Pro, Business): https://www.cloudflare.com/service-specific-terms-application-services/#content-delivery-network-free-pro-or-business
22. Cloudflare docs, Delivering videos with Cloudflare: https://developers.cloudflare.com/fundamentals/reference/policies-compliances/delivering-videos-with-cloudflare/
23. Garage Quick Start: https://garagehq.deuxfleurs.fr/documentation/quick-start/
24. Caddy Docker Official Image docs: https://github.com/docker-library/docs/blob/master/caddy/README.md. Automatic HTTPS: https://caddyserver.com/docs/automatic-https
25. Caddy `reverse_proxy`: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
26. docker/compose, `internal/projectloader/unsupported_attributes.go`: https://github.com/docker/compose/blob/7eb5a292432197b5f9983bc7e5f29d8051da0310/internal/projectloader/unsupported_attributes.go
27. docker/compose issue #13149: https://github.com/docker/compose/issues/13149
28. docker-rollout: https://github.com/wowu/docker-rollout, https://docker-rollout.wowu.dev/container-draining
29. Kamal docs, Proxy: https://kamal-deploy.org/docs/configuration/proxy/. Kamal 2 changes: https://kamal-deploy.org/docs/upgrading/configuration-changes/
30. docker/compose README (Swarm note): https://github.com/docker/compose/blob/v5.6.1/README.md
31. pg-boss 12.38 docs, `start()`/`stop()`: https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/ops.md. Heartbeat and expiration: https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/queues.md
32. Compose file reference, services (`restart`, `stop_grace_period`): https://docs.docker.com/reference/compose-file/services/
33. Prisma, Production database migrations: https://github.com/prisma/web/blob/main/apps/site/content/answers/postgres/production-database-migrations.mdx
34. GitHub Packages billing: https://docs.github.com/en/billing/concepts/product-billing/github-packages
35. GitHub, Working with the Container registry: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
36. Docker docs, Live restore: https://docs.docker.com/engine/daemon/live-restore/
37. Prisma ORM 7.10 README and connection-config plan: https://github.com/prisma/orm/blob/7.10.1/README.md
38. PostgreSQL 17, Connection settings: https://www.postgresql.org/docs/17/runtime-config-connection.html
39. node-postgres, Pool: https://node-postgres.com/apis/pool
40. pg-boss 12.38 README and constructor: https://github.com/timgit/pg-boss/blob/12.38.2/README.md, https://github.com/timgit/pg-boss/blob/12.38.2/docs/api/constructor.md
41. rate-limiter-flexible `RateLimiterPostgres.js`: https://github.com/animir/node-rate-limiter-flexible/blob/18c52aeb8d7067fb012e214c56aa0e32173bfef5/lib/RateLimiterPostgres.js
42. rate-limiter-flexible wiki, PostgreSQL and Options: https://github.com/animir/node-rate-limiter-flexible/wiki/PostgreSQL, https://github.com/animir/node-rate-limiter-flexible/wiki/Options
43. PostgreSQL 17, CREATE TABLE (`UNLOGGED`): https://www.postgresql.org/docs/17/sql-createtable.html
44. PostgreSQL 17, Template databases: https://www.postgresql.org/docs/17/manage-ag-templatedbs.html
45. PGDG apt pool, pgbackrest packages (newest 2.59.3, checked 2026-11-16): https://apt.postgresql.org/pub/repos/apt/pool/main/p/pgbackrest/
46. Cloudflare R2, Limits (one concurrent write per second per key, else 429): https://developers.cloudflare.com/r2/platform/limits/
47. Garage 2.3.0 release notes (2026-04-18; `--single-node`, `--default-access-key`, `--default-bucket`), as packaged by openSUSE: https://www.rpmfind.net/linux/RPM/opensuse/tumbleweed/x86_64/garage-2.5.0-1.1.x86_64.html. Upstream releases: https://git.deuxfleurs.fr/Deuxfleurs/garage/releases
48. GitHub docs, Configuring a package's access control and visibility (private on first publish): https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility

## Verification log (2026-11-16)

81 load-bearing claims were checked against primary sources (vendor docs, release notes, source code, licence files, the npm and PGDG registries); 12 were corrected and 8 gaps filled.

Corrected:
- pgBackRest 2.59.0 was released on 20 Jul 2026, not 30 Jul (pgbackrest.org release notes and the GitHub release; the postgresql.org copy says 30 Jul).
- Releases since May were 2.59.0, 2.59.1, 2.59.2, 2.59.3 and 2.60.0, not only 2.59.0 and 2.60.0.
- PGDG apt ships pgBackRest 2.59.3, not 2.60.0, so the 2.60.0 `checksum-page-error` default doesn't apply to the PGDG build.
- Removed "expired presigned responses carry no CORS headers" for R2: no R2 page states it. Added what the docs do state: presigned URLs work only on the S3 endpoint and expire after 1 s to 7 days.
- RustFS does have Object Lock and lifecycle (the table said "—"). An older RustFS docs page, since removed, said versioning needs erasure coding on ≥ 4 disks; the current docs don't repeat this, so test it before relying on versioning on one disk.
- The RustFS GA date now cites RustFS's own announcement instead of a LinkedIn post.
- Caddy runs no active health checks (`health_uri`) for dynamic upstreams, and `dynamic a` caches DNS for 1 min by default. The edge config is rewritten around a short `refresh`, passive checks and `lb_try_duration`.
- Caddy's automatic HTTPS uses the HTTP challenge (port 80) and the TLS-ALPN challenge (port 443), not only the HTTP challenge.
- Garage was *originally* designed for "a few terabytes at most"; the 2026 grant targets wider use.
- Garage's default key and bucket need `server --single-node --default-bucket`, not env vars alone; the current version is v2.5.0.
- Docker `live-restore` covers patch upgrades only, not `YY.MM` upgrades.
- Prisma 7 deprecates `url`/`directUrl` in the schema; the old wording implied `directUrl` still exists as a setting.

Gaps filled:
- `stop_grace_period` for Postgres (SIGINT fast shutdown, 10 s default, unlogged tables emptied after a SIGKILL).
- pgBackRest 2.59+ refuses non-restore commands as root; how backups are scheduled.
- Block incremental requires `repo-bundle=y`.
- How bucket locks interact with `expire`, and which repo providers support `repo-target-time`.
- docker-rollout's caveat: no `ports` or `container_name` on the service.
- A GHCR package is private on first publish.
- The image needs the Prisma CLI and migrations for `compose run … migrate deploy`.
- pg-boss shutdown can run past its timeout; the worker grace period now has margin.
