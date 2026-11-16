# Backups and media on R2

Research for [#18](https://github.com/SiddharthMuramkar/foa-platform/issues/18) (map [#2](https://github.com/SiddharthMuramkar/foa-platform/issues/2)). Date: 2026-11-16. Scope: SPEC §3.1 (File storage, ORM/DB rows), §3.5, §3.7, SG-05, NFR-04, NFR-08, OD-12. Builds on [#3](https://github.com/SiddharthMuramkar/foa-platform/issues/3) (pgBackRest, bucket locks, Garage locally) and the still-standing parts of [#10](https://github.com/SiddharthMuramkar/foa-platform/issues/10) (R2 bucket-CORS rule, synchronous SG-05 purge) and [#11](https://github.com/SiddharthMuramkar/foa-platform/issues/11) (Sentry Crons on backups and the drill). Direction: Cloudflare for everything it covers; backend on a Mumbai VPS.

## Answer

Postgres backups go to R2 with pgBackRest **2.60.0**, in a bucket in a **separate Cloudflare account**; the VPS holds only an *Object Read & Write* token for that bucket, so it can't change lock rules.
R2 has no versioning or S3 Object Lock, only bucket locks, which also block overwrites: they can cover WAL and completed backups, but not pgBackRest's rewritten info files, and `repo-target-time` recovery is unavailable.
The two-bucket media model stands with small changes: part URLs issued in batches, `WHEN_REQUIRED` checksums on the presigner, versioned public keys with a single-file purge for SG-05, browser TTL that respects origin headers, and no event notifications.
A host-loss restore should fit the 99.5 % budget (≈ 3 h 39 min a month), but it is unmeasured until the first drill.

## 1. Backups on R2

**Status (2026-11-16)**

| | pgBackRest | WAL-G |
|---|---|---|
| Latest | 2.60.0, 18 Oct 2026; **PGDG apt has 2.60.0 for Debian 12/13/14 since 26 Oct 2026** [1][2]. (Correction to #3, which said 2.59.3.) | v3.0.9, 20 Aug 2026; still on AWS SDK for Go **v1**; master has moved to SDK v2 [3][4] |
| R2 429s | Retried since **2.57.0** (Oct 2025): "429 errors are common on Cloudflare R2" [1][5]. Origin: #2655, a 429 on `ListObjectsV2` during the archive check ("Reduce your concurrent request rate for the same object") [6]. R2 allows 1 write/s per key [7]. | No R2-specific retry; `S3_ADDITIONAL_RETRYABLE_ERROR_CODES` exists on master [8] |
| Timeouts | #2644 (Jun 2025, 1.2 TiB cluster): read timeouts on backup and restore; closed as a network or service problem with no fix [9] | **Open #2550 (10 Sep 2026)**: `wal-push` hangs against R2 on v3.0.9 (signed payload + Content-MD5). Maintainers could not reproduce it and asked for SDK details [4] |
| Restore over R2 | #2782 (Jun 2026): 94 MB / 4,000 files took ~4 min, because every file in a bundle cost one ranged GET and the time went on round trips. **2.60.0 adds prefetch** (`repo-storage-prefetch` default 3, `repo-storage-read-over` default 64 KiB) [1][10] | — |
| Checksum headers | Own C client; sends `Content-MD5` on every request with content (reverted back to that in 2.55.1) [11]. R2 supports `Content-MD5` on PutObject and UploadPart [12] | SDK v2 on master: `AWS_REQUEST_CHECKSUM_CALCULATION` / `AWS_RESPONSE_CHECKSUM_VALIDATION` (`WHEN_SUPPORTED` default) [8]. R2 supports CRC64NVME (full object) and CRC32/CRC32C/SHA1/SHA256 (composite) since 2025-07-03 [12][13] |
| Versioning detection | `repo-target-time` needs versioned storage; R2 has none [12][14] | Auto-detects versioning with `GetBucketVersioning`, which R2 does not implement, so set `S3_ENABLE_VERSIONING=disabled` [8][12] |

**Multipart on R2.** R2 requires parts of 5 MiB–5 GiB, at most 10,000 of them, and **all parts except the last the same size** [15]. pgBackRest uses fixed chunks (S3 default 5 MiB), but after 205 parts it grows the part size for larger files [16][17]. With 5 MiB chunks, any file over ~1 GiB would therefore send unequal parts. Set `repo1-storage-upload-chunk-size=16MiB` (threshold ≈ 3.2 GiB; Postgres segments are ≤ 1 GiB). This conflict is inferred from the source code and not reported upstream. WAL-G keeps one part size per object (≥ 20 MiB) [8].

**Required pgBackRest settings for R2** (in addition to #3's settings):

```ini
repo1-type=s3
repo1-s3-endpoint=<ACCOUNT_ID>.r2.cloudflarestorage.com   # host-style works (#2655 log) [6]
repo1-s3-bucket=foa-pg-backup
repo1-s3-region=auto
repo1-path=/pg
repo1-cipher-type=aes-256-cbc
repo1-bundle=y
repo1-block=y
repo1-storage-upload-chunk-size=16MiB
repo1-retention-full-type=time
repo1-retention-full=35          # days; must exceed the lock age (§2)
resume=n                         # see "Lock interplay"
archive-async=y
compress-type=zst
```

**Lock interplay (from the 2.59.3 source; prove it in the drill)** [16][18]:
- **Written once**: WAL segments, `.history` and `.backup` files under `archive/<stanza>/17-1/`. A duplicate WAL with the same checksum is skipped, not rewritten. With `resume=n`, everything in a backup label directory is also written once: `backup.manifest.copy` is saved only at the end, then copied to `backup.manifest`. PR #1760 removed the intermediate manifest saves when resume is off [19].
- **Rewritten**: `backup.info`, `backup.info.copy`, `archive.info` and `archive.info.copy`, on every backup and expire [20]. These files can't be locked, and they hold the cipher subkeys for an encrypted repo.
- **Failure mode**: after a failed backup, the next backup deletes the leftover label directory. On R2, `DeleteObjects` reports per-key errors. pgBackRest retries each key with a single `DELETE`, which gets **409 `ObjectLockedByBucketPolicy`** inside the lock window [18][21]. So backups stop until the lock age passes. WAL archiving continues, so PITR still works from the previous set. Alert on backup age (#11 Sentry Crons).
- `expire` deletes only past retention, so retention must exceed the lock age [21].

**WAL-G fit**: it never deletes failed-backup leftovers during a backup (`delete garbage` cleans them later), so it is friendlier to locks [22]. But #2550 is open and the release binary is still on SDK v1. It stays the fallback, as in #3.

## 2. Protection

**R2 vs versioning/Object Lock**
- R2: `PutBucketVersioning`, `GetBucketVersioning` and `PutObjectLockConfiguration` are not implemented (page updated 10 Nov 2026) [12].
- Bucket locks [21]:
  - Rules: up to 1,000 per bucket. Each covers a prefix, with an Age, a date or Indefinite condition.
  - What they block: overwrites, deletes, completion of earlier multipart uploads onto a locked key, and lifecycle deletion. Blocked requests return `409`; `DeleteObjects` reports per-key errors in a `200` response.
  - Bucket: it can't be emptied while any lock rule exists.
- Changing or removing rules needs a token that can *edit R2 bucket configuration*, i.e. Admin Read & Write [21][23].
- An S3 Object Lock + versioning provider instead lets overwrites create new versions, and enables pgBackRest's `repo-target-time` [14]. That means leaving Cloudflare for backups (#3's original recommendation).

**Compromised VPS**

| Control | Fact |
|---|---|
| Scoped token | R2 token permissions: Admin R&W, Admin R, **Object R&W**, Object R. Object scopes are limited to listed buckets [23]. An Object R&W token can delete and overwrite unlocked keys, but it **cannot edit lock rules**. |
| Write-only | Long-lived tokens have no write-only scope [23]. Temporary credentials can be limited to S3 actions (e.g. `PutObject` + multipart, no `DeleteObject`) and to prefixes, but only with **local JWT signing using the parent secret**, and they expire [24]. pgBackRest needs list, get and delete (archive check, `expire`, cleanup), so write-only does not fit it. |
| Separate account | The media custom domain must be a zone in the **same account** as `foa-public` [25], so media and DNS share the main account. A second account for `foa-pg-backup` keeps the main account's dashboard users and tokens away from the backups. |
| Encryption | The repo is encrypted with AES-256-CBC. The passphrase is stored off the VPS too, because losing the info files plus the passphrase loses the repo. |

**Lock rules for the backup bucket** (`repo1-path=/pg`, stanza `foa`): Age 14 days on `pg/archive/foa/17-`, `pg/backup/foa/20` (label directories start with the date) and `pg/backup/foa/backup.history/`. The info files stay outside every rule. Keep an offline copy of `archive.info` and `backup.info` taken after `stanza-create`. Whether a restore works with a lost `backup.info` is unverified: test it.

**Media (`foa-private`)**: the NFR-08 "R2 versioning" clause is impossible [12]. Options:
- Age lock on `uploads/` (originals, consent and finance documents). It blocks legitimate deletes (deletion requests, OD-12 retention, rejected uploads) until the age passes [21].
- No lock on derivatives: they can be regenerated.
- `foa-public` needs no protection (#3).

**Retention vs deletion requests (OD-12)** (legal call, not engineering):
- DPDP Act s.8(7): erase on consent withdrawal or when the purpose is served, unless the law requires retention. There is no backup carve-out [26].
- DPDP Rules 2025, Rule 8(3): keep personal data, traffic data and processing logs for at least **1 year** for Seventh-Schedule purposes, then erase [27]. Read from two secondary reproductions; verify against the Gazette.
- Engineering consequences:
  - Erased data survives in backups until they age out (35 days above) and on locked media for the lock age. State both periods.
  - A PITR restore to an earlier point loses later erasures. Record each erasure as a write-once, ID-only object (e.g. `erasures/` in the backup bucket, locked), and have the runbook replay it after restore.

## 3. Media (§3.5 two-bucket model)

| Need | R2 fact | Consequence |
|---|---|---|
| Presigned PUT/GET | GET, HEAD, PUT, DELETE; 1 s–7 days; **S3 endpoint only, not custom domains**; **POST form uploads not supported** [28] | No `content-length-range` policy. Size is enforced by the HEAD at `/complete` (§3.5 step 3). Signing `Content-Length` via `signableHeaders` is possible in the SDK [29]; untested on R2. Sign `Content-Type` (documented) [28][30]. |
| SDK checksums | JS SDK ≥ 3.729.0 adds CRC32 by default [31]. Presigned PutObject URLs then carry `x-amz-checksum-crc32=AAAAAA==` (the checksum of an empty body) [32]. A third-party project reports R2 rejecting the real upload [33]. | Set `requestChecksumCalculation: "WHEN_REQUIRED"` on the presigning `S3Client` [34]. Verify in the prototype. |
| Multipart video (500 MB) | Parts 5 MiB–5 GiB, equal size except the last, ≤ 10,000; incomplete uploads abort after 7 days by default [15][35]. Re-uploading a part number replaces it; if that retry fails, the old part is lost [12]. | 10 MiB parts → 48 parts. At 5 Mbit/s the upload takes ~14 min, longer than the 10-min URL TTL. So issue part URLs in batches (`POST /uploads/:id/parts`) instead of all up front. Add a 1-day abort lifecycle on `uploads/`. |
| Browser CORS | `ExposeHeaders: ["ETag"]` is needed to read part ETags. Origins: exact, or one `*` wildcard (`https://*.example.com`). Rule changes can take ≤ 30 s. **Expired presigned URLs return 403 with no CORS headers** (correction to #3) [30][36] | The client treats an opaque network error as "refresh the URL and retry". Preview origins can use a wildcard rule. |
| Bucket placement | Location hint `apac`, best effort, honoured only when a bucket name is first created; jurisdictions are EU/FedRAMP only [37]. Local Uploads speeds uploads from other regions [38]. | Create all buckets with `apac`. Local Uploads is not needed for Indian users. |
| Public bucket | Custom domain must be a zone in the same account. `r2.dev` is rate-limited and not for production. Use Smart Tiered Cache. Only default extensions are cached (jpg/png/webp/mp4 included) [7][25][39]. R2 is Developer Platform, so serving video through the CDN is allowed (#3). | `media.foaglobal.org` → `foa-public`; disable `r2.dev`; set `--min-tls 1.2` (default 1.0) [40]. |
| SG-05 purge | A deleted but cached object keeps being served until purge. Cached 404s persist after an upload to the same path [41]. All purge types are on all plans [42]. Free: single-file purge **800 URLs/s, 100 per request**; tag/prefix/hostname **5 requests/min** [43]. `/cdn-cgi/image/…` can't be purged, but purging the source URL purges its variants [44]. | Unpublish = `DeleteObject` + single-file purge of the exact URLs (preview, thumb, og, poster/video), awaited in the request (#10). Use **versioned public keys** (`pub/<assetId>/<publishId>/…`) so a republish never hits a cached 404. The `next/image` cache on Workers is #15's question. |
| Browser cache | Default Browser Cache TTL is 4 h, and it **overrides a lower origin `max-age`** unless set to "Respect Existing Headers". Free plan's minimum Edge Cache TTL is 2 h [45][46]. | A CDN purge can't reach browsers. Set "Respect Existing Headers", `Cache-Control: public, max-age=300` on `foa-public` objects (set again on `CopyObject`), and a long Edge Cache TTL rule. |
| Event notifications | `object-create` (PutObject, CopyObject, CompleteMultipartUpload) and `object-delete` go to a Queue. Rules filter by prefix and suffix, up to 100 per bucket. The consumer is a Worker or an HTTP pull client (token needs `queues` read+write; visibility timeout ≤ 12 h). Delivery is at least once. Retention is configurable up to 14 days, fixed at 24 h on the Free plan. Messages carry key, size and eTag, not the uploader [47][48][49]. | They don't replace `POST /uploads/:id/complete`, which carries the user, purpose and authorisation. Skip them (lean). Instead, a pg-boss job HEADs `UPLOADING` assets older than 30 min. |

## 4. Restore drill (NFR-04)

- **Budget**: 99.5 % ≈ 3 h 39 min a month (#3). Patch reboots and minor-version restarts come out of the same budget (#11).
- **PITR from R2**:
  - Restore: `pgbackrest --stanza=foa --type=time --target="<ts>" --target-action=promote restore` as `postgres` (#3). Use `--delta` for in-place repair. `process-max` sets the download parallelism.
  - Page checksums: 2.60.0 stops on an invalid page checksum by default; `checksum-page-error=n` turns that into a warning [1].
  - Not available: `repo-target-time` (no versioning on R2) [14].
- **RPO**: ≤ `archive_timeout` (set 60 s) plus whatever sits in the local async queue at host loss. If R2 stays unreachable, WAL piles up on the VPS. With `archive-push-queue-max` set, pgBackRest drops the queue to protect the disk, which breaks PITR until the next backup. Unset, the disk fills and Postgres stops [50]. Pick one consciously, and alert on `pg_stat_archiver.failed_count` (#3).
- **RTO at expected sizes** (estimate, not measured):
  - Year-1 DB: #11's audit log is 5–27 GB/yr, so assume ≤ 40 GB.
  - Transfer: 40 GB at an assumed 50 MB/s from R2 `apac` to Mumbai is ≈ 14 min before compression.
  - WAL replay: bounded by daily block-incremental backups (≤ 24 h of WAL).
  - Host provisioning plus image pull: ~30 min, assumed.
  - Total: ≈ 1–2 h, which leaves room for one incident a month.
  - Pre-2.60.0 restores were latency-bound on R2 [10]. Upstream publishes no R2 throughput figure.
- **Drill steps (monthly, Sentry Cron check-in)**:
  1. Fresh container on an empty volume.
  2. PITR to `now − 1 h`.
  3. Sanity queries, `prisma migrate status`.
  4. Replay `erasures/`.
  5. Record the time for each stage (download, replay, total) and the RPO achieved.
  6. Quarterly: rebuild the full host and restore with a deleted `backup.info`.

## Recommendation

1. **DB backups**: pgBackRest 2.60.0 (pinned PGDG build) → `foa-pg-backup` (location hint `apac`) in a second Cloudflare account. Settings as in §1. The VPS holds a bucket-scoped Object R&W token only. Admin tokens and 2FA owners stay with people, never on the host.
2. **Locks**: 14-day Age locks on the WAL, label and history prefixes; info files unlocked, with an offline copy; retention 35 days. If the drill shows the failed-backup lock-up or info-file risk is unacceptable, add pgBackRest `repo2` on an Object Lock + versioning provider. That is a product-owner call, since it leaves Cloudflare.
3. **Media**: keep §3.5. Presigner with `WHEN_REQUIRED` and signed `Content-Type`. 10 MiB parts, URLs in batches. CORS exposing `ETag`. 1-day multipart-abort lifecycle on `uploads/`. Age lock on `foa-private/uploads/`, with its length set against OD-12. Versioned public keys; synchronous delete + single-file purge; browser TTL 300 s with "Respect Existing Headers". No event notifications.
4. **NFR-04/08**: targets RPO ≤ 1 min and RTO ≤ 2 h, proven by the monthly drill.

## Open risks

- **Lock interplay is derived from pgBackRest source**, not from a test on R2. A failed backup inside the lock window stops new backups until the lock expires.
- **Info files are mutable** under the VPS token. An attacker can delete `backup.info` and `archive.info`. The offline copy and the restore-without-`backup.info` path are both unproven.
- **No `repo-target-time` on R2**: there is no way back to "the repo as it was" beyond the lock window.
- **R2 timeouts** (#2644) have no root cause; only 429 retries exist. Prove behaviour at FOA's size in the drill.
- **WAL-G fallback** has an open R2 hang (#2550) and an SDK v1 release binary.
- **Unequal multipart parts** above ~1 GiB per file at the default chunk size (inferred). Pin `16MiB`.
- **Presigned checksum rejection** on R2 is a third-party report; `Content-Length` signing on R2 is untested.
- **Legal**: the lock age and backup retention vs erasure duties (s.8(7)) and the 1-year log minimum (Rule 8(3)) need a lawyer's read (OD-12).
- **RTO figures are estimates**: R2→Mumbai throughput, compression ratio and WAL volume are unmeasured.
- **Purge limits**: on the Free plan, prefix/tag purges are capped at 5 requests a minute, so any bulk unpublish must use single-file purge.

## SPEC passages affected

| Passage | Change |
|---|---|
| §3.1 File storage | Location hint `apac`; `r2.dev` off; presigner `WHEN_REQUIRED`; Garage locally (#3); 1-day multipart abort; `uploads/` lock |
| §3.1 ORM/DB, API hosting | Postgres 17 + pgBackRest → R2 backup account (with #7) |
| §3.5 steps 1, 5, 6 | Part URLs in batches, 10 MiB parts, `ETag` exposed; versioned `pub/` keys, delete + single-file purge, browser TTL; presigned GET on the S3 endpoint only |
| §3.7 env vars | Add `CF_ZONE_ID`, `CF_PURGE_TOKEN` (Zone Cache Purge, one zone), `S3_ENDPOINT`/`S3_REGION` (R2 `auto`, Garage `garage`). Backup credentials stay out of app env (pgBackRest config on the host) |
| SG-05 | "CDN purge" = single-file purge of exact URLs; state the browser-cache bound |
| NFR-04 | Add RPO ≤ 1 min, RTO ≤ 2 h |
| NFR-08 | Replace "Neon PITR" and "R2 versioning" with pgBackRest PITR on R2, bucket locks and the monthly drill (`docs/runbooks/restore.md`) |
| §13 OD-12 | Add backup retention (35 days), the media lock age and erasure replay after restore |
| ADRs 0003, 0006 | Rename 0003 (hosting); 0006 records the locks and purge |

## Sources (accessed 2026-11-16 unless dated)

1. pgBackRest release notes (2.60.0 of 2026-10-18; 2.57.0 of 2025-10-18): https://pgbackrest.org/release.html
2. PGDG apt pool, pgbackrest (2.60.0 `pgdg12/13/14` builds dated 2026-10-26): https://apt.postgresql.org/pub/repos/apt/pool/main/p/pgbackrest/
3. WAL-G releases (v3.0.9, 2026-08-20): https://github.com/wal-g/wal-g/releases
4. WAL-G issue #2550 (opened 2026-09-10, open): https://github.com/wal-g/wal-g/issues/2550
5. pgBackRest PR #2661 (HTTP 408/429 retries): https://github.com/pgbackrest/pgbackrest/pull/2661
6. pgBackRest issue #2655 (2025-07): https://github.com/pgbackrest/pgbackrest/issues/2655
7. Cloudflare R2, Limits (updated 2026-10-30): https://developers.cloudflare.com/r2/platform/limits/
8. WAL-G storage docs, S3 (master): https://github.com/wal-g/wal-g/blob/master/docs/STORAGES.md
9. pgBackRest issue #2644 (2025-06): https://github.com/pgbackrest/pgbackrest/issues/2644
10. pgBackRest issue #2782 (2026-06): https://github.com/pgbackrest/pgbackrest/issues/2782
11. pgBackRest 2.55.1 release note (content-md5 for all requests): https://github.com/pgbackrest/pgbackrest/blob/main/doc/xml/release/2020s/2025/2.55.1.xml
12. Cloudflare R2, S3 API compatibility (updated 2026-11-10): https://developers.cloudflare.com/r2/api/s3/api/
13. Cloudflare R2 release notes (2025-07-03, CRC64NVME): https://developers.cloudflare.com/r2/platform/release-notes/
14. pgBackRest README ("Ransomware & Malware Protection") and configuration (`repo-target-time`): https://github.com/pgbackrest/pgbackrest, https://pgbackrest.org/configuration.html
15. Cloudflare R2, Upload objects: multipart details (part size limits, equal parts): https://developers.cloudflare.com/r2/objects/upload-objects/
16. pgBackRest 2.59.3 `src/command/backup/backup.c` (`backupManifestSaveCopy`, `backupResumeFind`): https://github.com/pgbackrest/pgbackrest/blob/release/2.59.3/src/command/backup/backup.c
17. pgBackRest configuration, `repo-storage-upload-chunk-size`; 2.60.0 `src/storage/s3/write.c`, `src/storage/write.c` (`storageWriteChunkSize`): https://pgbackrest.org/configuration.html, https://github.com/pgbackrest/pgbackrest/blob/release/2.60.0/src/storage/s3/write.c
18. pgBackRest 2.59.3 `src/storage/s3/storage.c` (DeleteObjects error handling): https://github.com/pgbackrest/pgbackrest/blob/release/2.59.3/src/storage/s3/storage.c
19. pgBackRest PR #1760 (skip manifest save when not resumable): https://github.com/pgbackrest/pgbackrest/pull/1760
20. pgBackRest `src/command/backup/complete.c.inc` and `test/spec-rekey.md` (info files rewritten): https://github.com/pgbackrest/pgbackrest/blob/main/src/command/backup/complete.c.inc
21. Cloudflare R2, Bucket locks (updated 2026-10-28): https://developers.cloudflare.com/r2/buckets/bucket-locks/
22. WAL-G PostgreSQL docs (`delete garbage`): https://github.com/wal-g/wal-g/blob/master/docs/PostgreSQL.md
23. Cloudflare R2, API tokens (permissions): https://developers.cloudflare.com/r2/api/tokens/
24. Cloudflare R2, Temporary credentials (updated 2026-10-16): https://developers.cloudflare.com/r2/api/s3/temporary-credentials/
25. Cloudflare R2, Public buckets (updated 2026-11-12): https://developers.cloudflare.com/r2/buckets/public-buckets/
26. DPDP Act 2023, s.8(7) (reproduction): https://indiankanoon.org/doc/157637354/
27. DPDP Rules 2025, Rule 8 (secondary reproductions; verify against the Gazette): https://dpdpa.com/dpdparules/rule8.html, https://www.miniorange.com/blog/data-retention-policy-dpdp-act/
28. Cloudflare R2, Presigned URLs (updated 2026-11-12): https://developers.cloudflare.com/r2/api/s3/presigned-urls/
29. aws-sdk-js-v3, `@aws-sdk/s3-request-presigner` README (`signableHeaders`, `unhoistableHeaders`): https://github.com/aws/aws-sdk-js-v3/blob/main/packages/s3-request-presigner/README.md
30. Cloudflare R2, aws-sdk-js-v3 example (updated 2026-10-26): https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
31. AWS SDK for JavaScript v3 guide, S3 checksums (default CRC32 from 3.729.0): https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-checksums.html
32. floci issue #5965 (SDK hoists `x-amz-checksum-crc32=AAAAAA==` into presigned PUT): https://github.com/floci-io/floci/issues/5965
33. crafter-station/petdex `src/lib/r2.test.ts` (R2 rejects such PUTs; third-party): https://github.com/crafter-station/petdex/blob/31c0aee7f4fb387774b87d40e8047dc0f9cea94b/src/lib/r2.test.ts
34. aws-sdk-js-v3 `flexibleChecksumsMiddleware.ts` (`WHEN_REQUIRED` adds no default checksum): https://github.com/aws/aws-sdk-js-v3/blob/main/packages-internal/checksums/src/submodules/flexible-checksums/flexibleChecksumsMiddleware.ts
35. Cloudflare R2, Object lifecycles (default 7-day multipart abort): https://developers.cloudflare.com/r2/buckets/object-lifecycles/
36. Cloudflare R2, Configure CORS (updated 2026-09-23): https://developers.cloudflare.com/r2/buckets/cors/
37. Cloudflare R2, Data location: https://developers.cloudflare.com/r2/reference/data-location/
38. Cloudflare R2, Local uploads (updated 2026-09-18): https://developers.cloudflare.com/r2/buckets/local-uploads/
39. Cloudflare Cache, Default cache behavior: https://developers.cloudflare.com/cache/concepts/default-cache-behavior/
40. Cloudflare R2, Wrangler commands (`r2 bucket domain add`, `lock`, `notification`): https://developers.cloudflare.com/r2/reference/wrangler-commands/
41. Cloudflare R2, Consistency model (caching): https://developers.cloudflare.com/r2/reference/consistency/
42. Cloudflare changelog, all purge methods on all plans (2025-04-01): https://developers.cloudflare.com/changelog/2025-04-01-purge-for-all
43. Cloudflare Cache, Purge cache: availability and limits (updated 2026-09-29): https://developers.cloudflare.com/cache/how-to/purge-cache/
44. Cloudflare Images, Features: caching and purge (updated 2026-06-16): https://developers.cloudflare.com/images/optimization/features/
45. Cloudflare Cache, Edge and Browser Cache TTL (updated 2026-08-14): https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/
46. Cloudflare Cache, Set Browser Cache TTL: https://developers.cloudflare.com/cache/how-to/set-browser-ttl/
47. Cloudflare R2, Event notifications: https://developers.cloudflare.com/r2/buckets/event-notifications/
48. Cloudflare Queues, Pull consumers; Limits (updated 2026-10-30): https://developers.cloudflare.com/queues/configuration/pull-consumers/, https://developers.cloudflare.com/queues/platform/limits/
49. Cloudflare Queues, Delivery guarantees: https://developers.cloudflare.com/queues/reference/delivery-guarantees/
50. pgBackRest configuration (`archive-push-queue-max`, `resume`, `manifest-save-threshold`): https://pgbackrest.org/configuration.html
