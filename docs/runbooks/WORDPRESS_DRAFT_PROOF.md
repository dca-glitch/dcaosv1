# WordPress Draft Proof

**Status:** Draft preparation and guarded handoff proven locally; live publish remains off by default. Auto-publish is **not** in scope for this gate.

**Gate:** Puriva requires WordPress **draft/handoff**; WordPress **auto-publish** remains deferred (see [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)).

Related:

- [`docs/ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md`](../ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md)
- [`PHASE_F_BLOCK_64_WORDPRESS_HANDOFF_LOCAL_GUARDED.md`](./PHASE_F_BLOCK_64_WORDPRESS_HANDOFF_LOCAL_GUARDED.md)
- [`POST_MVP_BLOCK_45_WORDPRESS_PUBLISH_OPEN_GATE_LOCAL_PROBE.md`](./POST_MVP_BLOCK_45_WORDPRESS_PUBLISH_OPEN_GATE_LOCAL_PROBE.md)
- [`docs/security/WORDPRESS_PUBLISH_LOCAL_GATE.md`](../security/WORDPRESS_PUBLISH_LOCAL_GATE.md)
- [`docs/security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`](../security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md)
- [`docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md`](../security/CREDENTIAL_ENCRYPTION_FOUNDATION.md)
- `scripts/smoke-wordpress-publish-local.mjs`
- `scripts/smoke-ai-delivery-reviews-local.mjs`

---

## 1. Purpose

Prove that DCA OS Lite WordPress integration:

1. Prepares **draft-only** payloads locally — no production WordPress mutation during draft prep.
2. Never **auto-publishes** — publish path is gated by `WORDPRESS_PUBLISH_ENABLED` (default off).
3. Handles **credentials safely** when publish is later enabled (encrypted storage, no secret leakage).
4. Documents **rollback** expectations for failed or mistaken publish attempts.

This runbook covers **draft proof**. Live publish proof is a separate owner gate (`POST_MVP_BLOCK_45`).

---

## 2. Draft-only boundary

### 2.1 Prepare WordPress draft (required Puriva path)

| Item | Detail |
|------|--------|
| Endpoint | `POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/prepare-wordpress-draft` |
| Auth | Owner/admin only; tenant-scoped |
| External calls | **None** — no WordPress HTTP, no credentials read |
| Output | Local JSON: title, content, excerpt, slug, `status: draft`, categories, tags, SEO fields |
| UI | AI Delivery → deliverable → **Prepare WordPress Draft** |

**Operator sequence (Puriva):** SEO plan → content draft → image package → compliance checkpoint → admin review → **draft-only WordPress handoff** → final archive.

Prepared draft is an internal scaffold until compliance and admin review pass. Client portal shows **FINAL** material only.

### 2.2 What draft proof does NOT do

- Publish, schedule, or update live WordPress posts
- Store or transmit Application Passwords during draft prep
- Auto-trigger publish after draft preparation
- Expose draft payloads, prompts, or publication internals to clients

---

## 3. No auto-publish policy

| Control | Default | Effect |
|---------|---------|--------|
| `WORDPRESS_PUBLISH_ENABLED` | unset / `false` | Publish attempts return `provider_disabled`; PublicationLog `PROVIDER_DISABLED` |
| Publish endpoint | `POST .../publish-wordpress` | Exists for guarded testing only; blocked unless flag true |
| Pre-staging orchestrator | publish off | `smoke:wordpress-publish:local` expects disabled provider |

**Rule:** Draft preparation success must **never** chain into publish. Operators manually enable publish only for an approved open-gate probe or live proof block.

---

## 4. Credential safety

### 4.1 Draft prep (current — no credentials)

- No WordPress secrets in repo, `.env` inspection during draft smokes, or prepared payload JSON.
- Publication target public fields only: `siteUrl`, `siteSlug`, `wordPressComSite` per Client Hub **PublicationTarget**.

### 4.2 Publish path (when separately enabled)

| Requirement | Detail |
|-------------|--------|
| Master key | `CREDENTIAL_ENCRYPTION_MASTER_KEY` (32-byte base64) — presence checked, value never logged |
| Credential storage | Encrypted per publication target; Application Password never returned in API responses |
| Smoke guards | Forbidden patterns: application password plaintext, ciphertext blobs in client responses |
| Audit | PublicationLog records status and external post id — **not** credentials |

See [`WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`](../security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md) Phase D before production publish.

---

## 5. Proof paths

### 5.1 Draft preparation API + UI (baseline)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-delivery-reviews
```

Pass:

- Valid prepare request returns `wordpressDraft` with `status: draft`
- 404 for invalid project/deliverable; 403 for unauthorized
- No external HTTP; no secrets in response

UI proof (when browser QA approved): AI Delivery deliverable → button visible admin-only → inline draft panel.

### 5.2 Publication log — publish off (baseline)

Requires local API on **4000** and `AUTH_SEED_TEST_PASSWORD`.

```powershell
cd C:\dcaosv1
npm.cmd run smoke:wordpress-publish:local
```

Pass:

- Publish returns `provider_disabled`
- PublicationLog entry `PROVIDER_DISABLED` without live HTTP
- No Application Password or ciphertext in responses

Included in `npm run smoke:pre-staging:local`.

### 5.3 Open gate — HTTP adapter only (owner/manual; not draft proof)

For publish **adapter** proof only (expects HTTP error against non-WP smoke URL):

1. Set `CREDENTIAL_ENCRYPTION_MASTER_KEY` if testing credential save paths.
2. Set `WORDPRESS_PUBLISH_ENABLED=true`; restart API.
3. Run Block 45 probe (see [`POST_MVP_BLOCK_45_WORDPRESS_PUBLISH_OPEN_GATE_LOCAL_PROBE.md`](./POST_MVP_BLOCK_45_WORDPRESS_PUBLISH_OPEN_GATE_LOCAL_PROBE.md)).
4. Restore `WORDPRESS_PUBLISH_ENABLED=false` before other smokes.

### 5.4 Live Puriva draft handoff (target environment)

1. Complete content/compliance/admin review on target env.
2. Prepare WordPress draft for approved deliverable.
3. Confirm payload `status: draft` and `readyForPublish` semantics match operator checklist.
4. Confirm PublicationLog shows prepared/handoff state — **not** live publish unless separately approved.
5. Client portal still shows only FINAL deliverables/reports.

---

## 6. Pass criteria (draft proof closure)

| # | Criterion |
|---|-----------|
| 1 | `smoke:ai-delivery-reviews` WordPress draft cases PASS |
| 2 | `smoke:wordpress-publish:local` PASS with publish **off** |
| 3 | No auto-publish after draft preparation |
| 4 | No credentials required for or leaked by draft prep |
| 5 | Client portal boundary smokes omit draft internals |
| 6 | Operator evidence log archived |

---

## 7. Rollback

### 7.1 Draft-only mistakes (no live publish)

- Discard or regenerate prepared draft in admin UI; no WordPress rollback needed.
- Re-run compliance/admin review before re-handoff.

### 7.2 Live publish mistakes (separate gate — when publish enabled)

Rollback is **manual operator responsibility** on the WordPress site:

| Step | Action |
|------|--------|
| 1 | Identify post via PublicationLog `externalPostId` / URL if recorded |
| 2 | In WordPress admin: move post to **Draft** or **Trash** — do not leave erroneous content published |
| 3 | Rotate Application Password if credential may be compromised |
| 4 | Update PublicationLog notes / deliverable status in DCA OS admin |
| 5 | Document incident in operator decision log |

DCA OS does not auto-unpublish in MVP. Automated rollback requires a separate approved block.

### 7.3 Env rollback after open-gate probe

```powershell
# In target .env or secret store:
WORDPRESS_PUBLISH_ENABLED=false
```

Restart API; re-run baseline `smoke:wordpress-publish:local`.

---

## 8. Forbidden

- Enabling `WORDPRESS_PUBLISH_ENABLED=true` in production without owner sign-off
- Treating draft preparation as client-visible or FINAL delivery
- Storing WordPress passwords in repo, smoke fixtures, or client-visible fields
- Auto-publish workflows, scheduling, or webhooks without separate approval

---

## 9. Evidence template

Save to `$env:TEMP\wordpress-draft-proof-<date>.log`:

```
Date:
Target env: local | staging | production
Commit SHA:
Draft prepare smoke: PASS | FAIL
Publish disabled smoke: PASS | FAIL
WORDPRESS_PUBLISH_ENABLED: false (required for draft closure)
Credentials in responses: no (required)
Client portal draft leakage: no (required)
Owner approval reference:
```
