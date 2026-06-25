# Google Drive / Google Docs Integration Decision

**Status:** DEFERRED — decision record only, no runtime implementation yet.

**Branch:** `feature/ai-delivery-project-brief-foundation`

---

## Decision Summary

Google Drive / Google Docs should be treated as an optional admin-only export and handoff layer, not as the canonical document store.

**Recommended first integration target:** AI Delivery deliverables, using the existing `exportUrl` / manual handoff pattern first. Monthly Reports can follow later if the same export layer is still needed there.

Reason: deliverables already have a safe handoff field pattern, while Monthly Reports already have a private canonical PDF/document path. This lets the first Google Docs block stay small and schema-light.

### Approved folder-routing contract

- Root folder: `DCA OS Lite Exports`
- Top-level folders: `DCA Internal`, `Clients`
- Recommended structure:
  - `DCA OS Lite Exports/`
  - `DCA Internal/`
  - `Templates/`
  - `Drafts/`
  - `Admin Review/`
  - `Clients/<Client Name or safe client slug>/<Project Month or Project Name>/`
  - `Deliverables/`
  - `Reports/`
  - `Research/`
- Routing rule: the app determines the target folder from active tenant/client/project/month context; admins should not manually choose a folder on every export.
- Backend behavior: look up the existing folder first, then create any missing folders needed for the routed path.
- Default visibility: internal/admin-only by default; no automatic client sharing during export.
- Client sharing becomes a separate explicit admin action later.

---

## Why Google Docs Is Needed

- Provide a shareable editable handoff for admin/operator workflows.
- Support operator review and client-safe final editing without exposing internal workflow data.
- Give a future export target that sits beside PDF, WordPress draft prep, and private document storage.

Google Docs is an export/handoff surface, not the source of truth.

---

## Recommended Auth Model for MVP

**Recommended:** service account + shared drive / admin-owned workspace folder.

### Why this is the best MVP fit

- No interactive end-user consent flow needed for admin-operated workflows.
- No per-user refresh token lifecycle in the MVP.
- Easier to keep tenant-scoped folders and predictable file ownership.
- Matches the current local/admin-first model better than user-consent OAuth.

### Other options

| Model | Fit for MVP | Notes |
|---|---|---|
| OAuth user consent | Lower | Better for later per-admin personal ownership, but adds token refresh and consent complexity. |
| Service account | Best | Best server-side fit for admin-operated exports. |
| Domain/shared drive | Required companion | Best place for service-account writes when Workspace is available. |

If Google Workspace/domain support is available, use a shared drive. If not, use an admin-owned folder with explicit sharing rules and keep the integration read/write limited to the approved tenant scope.

---

## Security Rules

- Tenant scoped only.
- Owner/admin only.
- No client public links by default.
- No storageKey, secret, credential, or token exposure.
- Link visibility must be explicit and admin controlled.
- No automatic client sharing during export.
- No bidirectional sync in the MVP.

Google Docs links should be treated as controlled handoff references, not public assets.

---

## File / Folder Model

Recommended structure:

- `DCA OS Lite Exports`
- `DCA Internal`
- `Clients`
- `Templates`
- `Drafts`
- `Admin Review`
- client/project/month subfolders

Recommended naming:

- `tenant-client-project-month-report`
- `tenant-client-project-deliverable`

Keep naming deterministic so admin lookup stays simple and tenant boundaries remain visible.

---

## Data Contract

- Prefer storing the Google Docs URL/reference in an existing handoff field first.
- For AI Delivery deliverables, reuse `exportUrl` if the schema already supports it.
- Avoid new schema unless implementation proves a hard need.
- Keep the existing private document path as the canonical stored artifact when present.

The Google Docs reference is a secondary editable/export handoff, not the canonical record.

---

## Relationship With R2 / PDF

- R2 / PDF remains the private canonical document path.
- Google Docs is optional and editable.
- Google Docs should not replace private document storage or signed-download behavior.
- PDF generation and private downloads stay the default reporting/document proof path.

This keeps the current report/document stack stable while adding a separate editorial handoff layer.

---

## Deferred Items

- live OAuth/provider execution
- automatic client sharing
- production credentials
- background sync
- bidirectional import
- Google Drive folder picker
- client-facing public links
- production deploy / VPS work

---

## Recommended Implementation Sequence

1. Add admin-only Google Docs export contract for AI Delivery deliverables.
2. Route exports automatically to `Clients/<Client>/<Project-Month>/Deliverables`.
3. Reuse existing handoff/reference fields where possible.
4. Keep the private canonical document path intact.
5. Add Monthly Reports Google Docs support later, routing to `Clients/<Client>/<Project-Month>/Reports` when needed.
6. Add Research export later, routing to `Clients/<Client>/<Project-Month>/Research` when needed.
7. Add any schema change only after the contract is proven by implementation.

---

## Open Questions For Implementation

- Whether Google Docs export should create a draft or a fully formatted editable document.
- Whether export should be one-way only at first.
