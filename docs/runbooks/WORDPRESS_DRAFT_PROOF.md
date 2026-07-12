# WordPress Draft Proof

**Status:** Draft preparation and guarded handoff proven locally; G110–G114, G181–G188, G289–G308, and G541–G552 add local draft-payload hardening, slug edge policy, draft-status freeze, publish freeze / no-live service guard, credential + error redaction, live-proof plan + rollback/delete invariants, image-inclusion / accepted-image-only contract, category/tag placeholders (numeric term-id drop), author/tenant mapping design, payload sanitization (secret-fragment strip), docs closeout, and focused unit tests. Live draft proof remains **plan-only**; live publish remains frozen. Auto-publish is **not** in scope for this gate. §6 defines a future owner-approved staging-only live draft proof **plan** (title/body/meta, approved-image attach, alt/caption/social preview, idempotency, cleanup marker, disabled-safe mode, owner approval) — no live WordPress call was made to produce this document. **Do not claim live WordPress proven.**

**Gate:** Puriva requires WordPress **draft/handoff**; WordPress **auto-publish** remains deferred (see [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)).

**Three tiers (G86 boundary):**

| Tier | What it proves | Current state | Puriva launch relevance |
|---|---|---|---|
| **1. Draft preparation** | DCA OS Lite can prepare local WordPress-shaped draft payloads without credentials or HTTP | Proven locally; launch-relevant | Supports Puriva draft-only handoff |
| **2. Live draft proof** | A staging-only WordPress site can receive a single `draft` post matching approved content/images, then delete/trash it | **Plan-only in G86; not executed** | Future confidence proof only; not required to enable publish |
| **3. Publish** | Public WordPress publication with `WORDPRESS_PUBLISH_ENABLED=true` | **Frozen by service guard** | Out of scope for Puriva launch v1 |

G86 does not move tier 2 into execution and does not move tier 3 at all.

G110–G114, G181–G188, G289–G308, and G541–G552 keep the same three-tier boundary: tier 1 is local draft JSON only, tier 2 is a future owner-approved staging proof plan, and tier 3 publish remains frozen.

Related:

- [`docs/ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md`](../ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md)
- [`PHASE_F_BLOCK_64_WORDPRESS_HANDOFF_LOCAL_GUARDED.md`](./PHASE_F_BLOCK_64_WORDPRESS_HANDOFF_LOCAL_GUARDED.md)
- [`POST_MVP_BLOCK_45_WORDPRESS_PUBLISH_OPEN_GATE_LOCAL_PROBE.md`](./POST_MVP_BLOCK_45_WORDPRESS_PUBLISH_OPEN_GATE_LOCAL_PROBE.md)
- [`docs/security/WORDPRESS_PUBLISH_LOCAL_GATE.md`](../security/WORDPRESS_PUBLISH_LOCAL_GATE.md)
- [`docs/security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`](../security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md)
- [`docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md`](../security/CREDENTIAL_ENCRYPTION_FOUNDATION.md)
- `scripts/smoke-wordpress-publish-local.mjs`
- `scripts/smoke-ai-delivery-reviews-local.mjs`
- [`INTEGRATIONS_TRUTH_MATRIX.md`](./INTEGRATIONS_TRUTH_MATRIX.md) (WordPress rows)
- [`PURIVA_LAUNCH_GATE.md`](./PURIVA_LAUNCH_GATE.md) (§2 row 7, §7)
- `packages/data/prisma/schema.prisma` (`AiDeliveryArticleImage`, `AiDeliveryDeliverableImageApproval`, `PublicationLog`)

---

## 1. Purpose

Prove that DCA OS Lite WordPress integration:

1. Prepares **draft-only** payloads locally — no production WordPress mutation during draft prep.
2. Never **auto-publishes** — publish path is gated by `WORDPRESS_PUBLISH_ENABLED` (default off).
3. Handles **credentials safely** when publish is later enabled (encrypted storage, no secret leakage).
4. Documents **rollback** expectations for failed or mistaken publish attempts.
5. Defines the **pre-execution plan** (§6) a future owner-approved live draft proof session must satisfy — draft only, title/body/meta parity, approved-image-only attach, alt/caption/social preview, idempotency, cleanup marker, and disabled-safe restore.

This runbook covers **draft proof** and the **plan** for a future live draft proof. Live publish proof is a separate owner gate (`POST_MVP_BLOCK_45`); executing the §6 live draft proof itself also requires a separate owner-approved block — this document does not authorize execution.

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

**WS4 local precondition (no HTTP):** `evaluateWordPressDraftPrepPreconditions` requires accepted content (flag + non-empty title/body) and accepted hero image before draft prep is considered ready. Publish freeze and idempotency design helper (`wordpress-draft-idempotency.design.ts`) remain unchanged — no live WordPress call.

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
- Local builder unit test verifies `postStatus: draft` only and no publish/pending/future status drift
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
- G111 unit test verifies the provider returns before `fetch` even when publish env and local credentials are present
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

## 6. Live draft proof plan (pre-execution checklist — no live call in this document)

**Status:** Planning only. This section defines what an owner-approved, staging-only live draft proof session must verify. No live WordPress HTTP call was made to produce this section, and none is authorized by this document. Execution requires a separate approved block per §6.8.

### 6.0 G86 / G185 plan at a glance

| Proof area | Required plan decision |
|---|---|
| Draft-only proof | The only WordPress mutation allowed in a future session is creation of one `draft` post on a staging/disposable site. |
| No publish | The proof must never create `publish`, `pending`, `future`, or scheduled posts; public front-end visibility is failure. |
| Credential boundary | Application Password may be used only through approved encrypted credential storage for the named staging target; secrets must not be copied into docs, logs, fixtures, or prepared payloads. |
| Content inclusion | Title, body, excerpt, slug, categories/tags, SEO/meta fields, and admin-only exclusion must be checked against the prepared payload. |
| Image inclusion | Only approved deliverable images may be attached; alt text, captions, and social preview must be verified or explicitly recorded as manual-check-only. Local contract: accepted `hero` → `featuredImagePlaceholder`; accepted `supporting_1`/`supporting_2` → `supportingImagePlaceholders`; accepted `social_preview` → `socialPreviewPlaceholder` (`wordpress-image-inclusion.ts`). No live media call in this gate. |
| Rollback/delete | The draft must carry a proof marker, record post ID/edit URL, and be moved to Trash or permanently deleted before session close-out. |
| Staging/prod boundary | Staging/disposable target only; no Puriva production WordPress or client production site. |
| Puriva launch relevance | Confirms future WordPress confidence path; does not expand Puriva launch beyond draft/handoff and final archive. |

**G185 plan constants (code, no HTTP):** `WORDPRESS_LIVE_DRAFT_PROOF_STEPS` = `create_draft` → `verify_draft` → `delete_or_trash_draft` → `no_publish` → `rollback_publish_env` in `apps/api/src/services/wordpress-draft-proof-plan.ts` (re-exported from `wordpress.service.ts`).

### 6.1 Scope confirmation (draft only, never publish)

| Requirement | Detail |
|---|---|
| Post status created | `draft` only — never `publish`, `pending`, or `future` |
| `WORDPRESS_PUBLISH_ENABLED` during proof | `true` only for the duration of the proof session, on a **staging-only** WordPress site — never a client's live/production site |
| Target site | Must be a disposable/staging WordPress install the owner controls; never a Puriva or other client's real site |
| Success definition | Exactly one draft post exists in WordPress admin with `status: Draft`, matching the prepared payload; nothing publicly visible on the front end |
| Immediately after proof | Restore `WORDPRESS_PUBLISH_ENABLED=false`; re-run `smoke:wordpress-publish:local` to confirm disabled-safe baseline (see §6.7) |
| Credential use | If credentials are needed, use only encrypted PublicationTarget credentials for the named staging target; never paste Application Passwords into evidence, scripts, docs, or prepared draft JSON |

### 6.2 Title / body / meta verification checklist

Verify in the WordPress admin editor that the created draft matches the prepared payload from `prepare-wordpress-draft` field-for-field. The proof records content inclusion only; it must not approve public publication.

- [ ] Title matches deliverable title exactly (no truncation, no encoding artifacts)
- [ ] Body/content renders with correct formatting (headings, paragraphs, lists) — no raw markdown or broken HTML
- [ ] Excerpt is present and matches prepared summary
- [ ] Slug matches prepared slug (or WordPress auto-generated equivalent is acceptable and recorded)
- [ ] Categories and tags match prepared taxonomy list
- [ ] SEO fields (`seoKeywords`, `metaDescription`) are captured — either via WordPress custom fields/SEO plugin mapping or recorded as "not mapped, informational only" if no SEO plugin is present on the proof site
- [ ] No prompt text, provider internals, or admin-only workflow metadata leaked into any client/public-facing field
- [ ] Content source is the reviewed deliverable payload, not ad hoc WordPress editor copy created outside DCA OS Lite

### 6.3 Approved images attach (image approval boundary)

- [ ] Image inclusion is optional for the proof only if the selected deliverable has no approved image package; record `N/A (no approved images)` rather than attaching an unapproved substitute
- [ ] Only images with an `AiDeliveryDeliverableImageApproval.status = APPROVED` record for the target deliverable may be attached to the WordPress draft
- [ ] `PENDING` or `REJECTED` article images must never be attached, even if a `finalImageUrl`/`previewImageUrl` exists on the `AiDeliveryArticleImage` record
- [ ] Featured image (if any) is drawn from the same approved-image set — no substituting an unapproved image as featured image
- [ ] **Known gap (must close before live proof):** the current draft-prep payload (`WORDPRESS_PREPARED_DRAFT_FOUNDATION.md`) carries `featuredImage` as a raw reference/URL and does not yet hard-filter on `AiDeliveryDeliverableImageApproval` status in code. Until that filter is enforced in code, the live proof session must enforce this manually — operator confirms approval status per image in the admin UI before attaching — and this manual check must be recorded in the evidence log

### 6.4 Alt text, caption, and social preview

- [ ] Every attached image has non-empty alt text set on the WordPress media item (accessibility requirement)
- [ ] Every attached image has a caption where the content plan/image brief specifies one
- [ ] Social preview (Open Graph `og:title`, `og:description`, `og:image` — or WordPress SEO-plugin equivalent) is checked with a link-preview/debug tool against the **draft preview URL**, not a published URL
- [ ] **Known gap (must close before live proof):** `AiDeliveryArticleImage` has no `altText`, `caption`, or `socialPreview` fields in the current schema (`packages/data/prisma/schema.prisma`). This is a genuine blocking prerequisite, not a nice-to-have — either (a) add these fields via an approved schema change before live proof, or (b) require the operator to manually set alt/caption/social fields directly in the WordPress editor during the proof session and record that manual step in the evidence log. Do not claim automated alt/caption/social-preview proof until one of these is true.

### 6.5 Idempotency (no duplicate posts on retry)

- [ ] Re-running `prepare-wordpress-draft` for the same deliverable must not, by itself, create a second WordPress post (it only regenerates the local payload — confirmed safe today, no live call)
- [ ] If/when the live publish or live-proof call is retried (e.g., after a network timeout), it must not create a duplicate draft post for the same deliverable + attempt
- [ ] **Decision (WS2 integration contract closure):** ship pure design helper `buildWordPressDraftIdempotencyKey` in `apps/api/src/services/wordpress-draft-idempotency.design.ts` (no Prisma column, no HTTP). Until an owner-approved live draft gate (and optional schema to persist the key on `PublicationLog` / request rows), live sessions must use **manual WordPress-admin duplicate checks** and record them in the evidence log. Policy label: `design_helper_plus_manual_check_until_live_gate`.
- [ ] **Known gap (must close before live proof):** neither `AiDeliveryWordPressPublishRequest` nor `PublicationLog` currently carries a persisted idempotency/dedupe key. Required before a live proof session: either (a) schema/owner gate to persist the design helper key and check it before creating a new post, or (b) the proof operator manually checks WordPress admin for an existing draft matching the deliverable before each attempt and records the check in the evidence log. A live proof session must not run the same request twice without this check.

### 6.6 Cleanup marker (every proof post must be findable and removable)

- [ ] Every post created during a live proof session carries an unambiguous marker so it can be located and removed afterward:
  - Title prefix: `[DCA-OS-PROOF-DO-NOT-PUBLISH]`
  - A dedicated draft-only category or tag, e.g. `dca-proof`
  - `PublicationLog.note` records the proof session date and marker used
- [ ] Code constant parity: `WORDPRESS_TEST_DRAFT_PROOF_MARKER = "[DCA-OS-PROOF-DO-NOT-PUBLISH]"`, `WORDPRESS_TEST_DRAFT_PROOF_TAG = "dca-proof"`, and rollback plan constants live in `apps/api/src/services/wordpress-draft-proof-plan.ts` (re-exported from `wordpress.service.ts`)
- [ ] Proof close-out step: operator confirms in WordPress admin that the marked draft is moved to **Trash** (or permanently deleted if the site is fully disposable) before ending the session
- [ ] If deletion/trash fails, restore `WORDPRESS_PUBLISH_ENABLED=false`, revoke/rotate the staging Application Password if necessary, and stop with the draft still marked `[DCA-OS-PROOF-DO-NOT-PUBLISH]` until a human owner resolves cleanup
- [ ] Evidence log records the WordPress post ID/edit URL and the cleanup action taken (trashed/deleted) with a timestamp

### 6.7 Disabled-safe mode (before and after proof)

- [ ] **Before proof:** confirm `WORDPRESS_PUBLISH_ENABLED` is unset/`false` and `smoke:wordpress-publish:local` passes with `provider_disabled`
- [ ] **During proof:** flag is `true` only against the staging-only target for the minimum time needed
- [ ] **After proof:** flag restored to `false`/unset; API restarted; `smoke:wordpress-publish:local` re-run and must pass with `provider_disabled` again before any other smoke or handoff proceeds
- [ ] No other tenant's publish flag or credentials are touched during the proof

### 6.8 Owner approval requirements (must all be true before scheduling a live session)

| # | Approval item | Status |
|---|---|---|
| 1 | Owner has explicitly approved a live WordPress draft proof block (separate from this planning document) | Required |
| 2 | Target site is confirmed staging-only / disposable, not a client's production site | Required |
| 3 | §6.3 image-approval gap and §6.4 alt/caption/social-preview gap have an explicit decision recorded (schema change vs. manual-check-only) before the session | Required |
| 4 | §6.5 idempotency gap has an explicit decision recorded (code change vs. manual-check-only) before the session | Required |
| 5 | Cleanup/rollback plan (§6.6, §8) is understood by the operator running the session | Required |
| 6 | `CREDENTIAL_ENCRYPTION_MASTER_KEY` and Application Password handling reviewed per `WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md` if credential save paths are exercised | Required |
| 7 | Evidence log location and template (§10) confirmed before starting | Required |

This document does not itself constitute owner approval. It is the checklist an approval decision would be evaluated against.

---

## 7. Pass criteria (draft proof closure)

| # | Criterion |
|---|-----------|
| 1 | `smoke:ai-delivery-reviews` WordPress draft cases PASS |
| 2 | `smoke:wordpress-publish:local` PASS with publish **off** |
| 3 | No auto-publish after draft preparation |
| 4 | No credentials required for or leaked by draft prep |
| 5 | Client portal boundary smokes omit draft internals |
| 6 | Focused WordPress unit tests PASS for G181–G188, G289–G308, and G541–G552 (draft payload snapshots, slug edges, status freeze, publish freeze, credential/error redaction, proof-plan + rollback invariants, image inclusion / accepted-only, taxonomy placeholders, author mapping design, sanitization) — no live HTTP |
| 7 | Operator evidence log archived |
| 8 | Docs do **not** claim live WordPress proven |

---

## 8. Rollback

### 8.1 Draft-only mistakes (no live publish)

- Discard or regenerate prepared draft in admin UI; no WordPress rollback needed.
- Re-run compliance/admin review before re-handoff.

### 8.2 Live draft proof cleanup/delete (future tier 2 session)

This applies only to an owner-approved staging-only live draft proof. It is not a publish rollback path.

| Step | Action |
|------|--------|
| 1 | Locate the test draft by proof marker, WordPress post ID, or edit URL from the evidence log |
| 2 | Confirm status is still **Draft** and the post is not publicly visible |
| 3 | Move the marked draft to **Trash**, or permanently delete it if the target site is disposable and owner-approved |
| 4 | Record cleanup action and timestamp in the evidence log |
| 5 | Restore `WORDPRESS_PUBLISH_ENABLED=false`, restart API, and re-run disabled-safe smoke |
| 6 | If cleanup fails, stop the session, leave the proof marker in place, and notify the owner; do not attempt publish or production workarounds |

### 8.3 Live publish mistakes (separate tier 3 gate — when publish enabled)

Rollback is **manual operator responsibility** on the WordPress site:

| Step | Action |
|------|--------|
| 1 | Identify post via PublicationLog `externalPostId` / URL if recorded |
| 2 | In WordPress admin: move post to **Draft** or **Trash** — do not leave erroneous content published |
| 3 | Rotate Application Password if credential may be compromised |
| 4 | Update PublicationLog notes / deliverable status in DCA OS admin |
| 5 | Document incident in operator decision log |

DCA OS does not auto-unpublish in MVP. Automated rollback requires a separate approved block.

### 8.4 Env rollback after open-gate probe

```powershell
# In target .env or secret store:
WORDPRESS_PUBLISH_ENABLED=false
```

Restart API; re-run baseline `smoke:wordpress-publish:local`.

---

## 9. Forbidden

- Enabling `WORDPRESS_PUBLISH_ENABLED=true` in production without owner sign-off
- Treating draft preparation as client-visible or FINAL delivery
- Storing WordPress passwords in repo, smoke fixtures, or client-visible fields
- Auto-publish workflows, scheduling, or webhooks without separate approval
- Attaching a `PENDING` or `REJECTED` article image to any prepared or live draft (§6.3)
- Running a live proof session against a client's real/production WordPress site
- Leaving a live-proof draft post in WordPress without a cleanup marker (§6.6) or without trashing/deleting it at session close-out

---

## 10. Evidence template

### 10.1 Draft-prep (local, disabled-safe) evidence

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

### 10.2 Live proof session evidence (when a separate approved block executes §6)

Save to `$env:TEMP\wordpress-live-draft-proof-<date>.log`:

```
Date:
Owner approval reference (§6.8):
Target site (staging-only, confirm not client-production):
WordPress post ID / edit URL created:
Post status confirmed: draft (required)
Title/body/meta match (§6.2): PASS | FAIL
Images attached were APPROVED-only (§6.3): PASS | FAIL | N/A (no images)
Alt/caption/social preview verified (§6.4): PASS | FAIL | manual-check-only (state which)
Idempotency check performed before create (§6.5): PASS | FAIL | manual-check-only (state which)
Cleanup marker used (§6.6):
Cleanup action taken (trashed/deleted) + timestamp:
WORDPRESS_PUBLISH_ENABLED restored to false + baseline smoke re-run: PASS | FAIL
Credentials/ciphertext in responses or logs: no (required)
```
