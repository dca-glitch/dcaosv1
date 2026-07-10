# Client portal storage / download boundary

Security-facing summary of what client portal APIs may return for private delivery documents.

**Companion runbook:** [`../runbooks/PRIVATE_DELIVERY_DOWNLOAD_BOUNDARY.md`](../runbooks/PRIVATE_DELIVERY_DOWNLOAD_BOUNDARY.md)  
**Do not confuse with:** [`../runbooks/STORAGE_R2_PROOF.md`](../runbooks/STORAGE_R2_PROOF.md) (R2 proof stages; not overwritten by Lane 2).

---

## Hard rules

1. **Never** return `storageKey` or `documentStorageKey` on client-role sessions.
2. **May** return `exportUrl` when an operator intentionally set a client-safe export link.
3. **May** return temporary `downloadUrl` / `downloadReference` when a download endpoint issues one — with a truth label.
4. **May** return boolean `hasDocument` derived from internal key presence without echoing the key.
5. Mocked or future URLs must be labeled `mocked` or `future_placeholder` — never implied as live signed proof.
6. Download failure messages must be redacted (no tenant object paths, no credential fragments).

---

## Surface matrix (client)

| Surface | Allowed | Forbidden |
|---------|---------|-----------|
| Deliverable list/summary | `exportUrl`, `hasDocument`, status, titles | `storageKey`, `documentStorageKey`, notes, draft/image IDs |
| Monthly report list/summary | `exportUrl`, `hasDocument`, FINAL fields | `storageKey`, admin notes, source IDs |
| Image / asset client-safe views | preview/final URLs, `hasDocument` | `storageKey` |
| Download reference endpoint | `{ downloadUrl, expiresSeconds }` or null | `storageKey` in JSON |

**Pre-staging note (2026-07-10):** Deliverable summaries now include `hasDocument` (boolean only). `documentStorageKey` is on the client-portal forbidden-key list (defense-in-depth; finance remains admin-only). Presigned `downloadUrl` path segments may still appear in the URL string when R2 is configured — that is not a JSON `storageKey` field leak.

---

## Truth labels

| Label | Meaning |
|-------|---------|
| `export_url` | Operator-provided export link; not a storage signed URL |
| `mocked` | Local/fixture download URL for tests |
| `future_placeholder` | Planned signed URL path; not issued yet |
| `live_signed` | Only after real signed URL issuance (deferred; owner gate) |

`liveProven` on boundary helpers is always `false` until a separate live proof gate completes.

---

## Deferred (for main register — do not edit register from this lane)

Real signed URL / live R2 download proof remains deferred. Proposal text is in `PRIVATE_DELIVERY_DOWNLOAD_BOUNDARY.md` §8 (G491).
