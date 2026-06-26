# Google Drive / Google Docs Integration Decision

**Status:** IMPLEMENTED for AI Delivery deliverable export foundation and admin UI action. Decision record remains for later Monthly Reports, Research rollout, client sharing, and production credential setup.

**Branch:** `feature/ai-delivery-project-brief-foundation`

**Latest implementation commit:** `32ed7f3 Add Google Drive deliverable export foundation`

---

## Decision Summary

Google Drive / Google Docs is treated as an optional admin-only export and handoff layer, not as the canonical document store.

**First integration target:** AI Delivery deliverables, using the existing `exportUrl` / manual handoff pattern first. Monthly Reports can follow later if the same export layer is still needed there.

Reason: deliverables already have a safe handoff field pattern, while Monthly Reports already have a private canonical PDF/document path. This keeps the Google Docs layer schema-light and separate from canonical private storage.

### Implemented Foundation Snapshot

The first backend/provider foundation is now implemented for AI Delivery deliverables:

- Provider boundary: `apps/api/src/services/google-drive.service.ts`
- Admin-only endpoint: `POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/export-google-doc`
- Route guard: authenticated owner/admin tenant scope
- Config-disabled baseline: returns safe provider-disabled response when Google Drive config is absent
- Folder behavior: deterministic lookup first, then create missing folders
- Response safety: no secrets, storage keys, credential values, or raw provider config values
- Focused smoke: `npm.cmd run smoke:google-drive-export`

The admin UI button/action that calls this endpoint is also implemented for AI Delivery deliverables.

### Approved folder-routing contract

- Root folder: `DCA OS Lite Exports`
- Top-level folders: `DCA Internal`, `Clients`
- Implemented deliverable export path:
  - `DCA OS Lite Exports/Clients/<Client Name>/<YYYY-MM> - <Project Name>/Deliverables`
- Recommended full structure:
  - `DCA OS Lite Exports/`
  - `DCA Internal/`
  - `Templates/`
  - `Drafts/`
  - `Admin Review/`
  - `Clients/<Client Name or safe client slug>/<YYYY-MM> - <Project Name>/`
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

## Auth Model for MVP

**Approved:** service account + shared drive / admin-owned workspace folder.

### Why this is the best MVP fit

- No interactive end-user consent flow needed for admin-operated workflows.
- No per-user refresh token lifecycle in the MVP.
- Easier to keep tenant-scoped folders and predictable file ownership.
- Matches the current local/admin-first model better than user-consent OAuth.

### Required provider configuration

The backend provider remains disabled unless all required configuration is present and export is explicitly enabled:

- `GOOGLE_DRIVE_EXPORT_ENABLED=true`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

When config is missing, local/baseline smoke expects a safe provider-disabled response instead of live Google Drive execution.

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
- Provider-disabled responses may include safe provider status/reason, but must not include credential values or raw secrets.

Google Docs links should be treated as controlled handoff references, not public assets.

---

## File / Folder Model

Implemented deliverable route:

- `DCA OS Lite Exports`
- `Clients`
- `<Client Name>`
- `<YYYY-MM> - <Project Name>`
- `Deliverables`

Recommended naming:

- `tenant-client-project-month-report`
- `tenant-client-project-deliverable`

Keep naming deterministic so admin lookup stays simple and tenant boundaries remain visible.

---

## Data Contract

The implemented AI Delivery deliverable export response is a safe handoff contract:

- `deliverableId`
- `hasGoogleDocExport`
- `exportUrl`
- `docTitle`
- `folderPath`
- `providerStatus`
- `providerDisabledReason`
- `errorMessage`
- `generatedAt`

For AI Delivery deliverables, reuse `exportUrl` when schema already supports it and avoid schema changes unless implementation proves a hard need.

The Google Docs reference is a secondary editable/export handoff, not the canonical record.

---

## Relationship With R2 / PDF

- R2 / PDF remains the private canonical document path.
- Google Docs is optional and editable.
- Google Docs should not replace private document storage or signed-download behavior.
- PDF generation and private downloads stay the default reporting/document proof path.

This keeps the current report/document stack stable while adding a separate editorial handoff layer.

---

## Current Validation / Smoke Proof

The backend/provider foundation was validated before commit and covered by focused smoke:

- `npm.cmd run validate`
- `npm.cmd run smoke:google-drive-export`
- Result reported for focused smoke: 12 passed / 0 failed

This docs-only alignment was made through GitHub cloud, so no local validation was run as part of this documentation update.

---

## Deferred Items

- live production credential setup
- automatic client sharing
- OAuth user-consent flow
- background sync
- bidirectional import
- Google Drive folder picker
- client-facing public links
- Monthly Reports Google Docs export
- Research Google Docs export
- production deploy / VPS work

---

## Recommended Implementation Sequence

1. Add admin-only Google Docs export contract for AI Delivery deliverables. **Done in foundation.**
2. Route exports automatically to `Clients/<Client>/<YYYY-MM> - <Project>/Deliverables`. **Done in foundation.**
3. Reuse existing handoff/reference fields where possible. **Done for the current UI/provider handoff.**
4. Keep the private canonical document path intact. **Done.**
5. Add admin UI action for deliverable Google Doc export. **Done.**
6. Add Monthly Reports Google Docs support later, routing to `Clients/<Client>/<YYYY-MM> - <Project>/Reports` when needed.
7. Add Research export later, routing to `Clients/<Client>/<YYYY-MM> - <Project>/Research` when needed.
8. Add any schema change only after the contract is proven by implementation.

---

## Open Questions For Later Blocks

- Whether Google Docs export should eventually create richer formatting beyond the current foundation payload.
- Whether export should remain one-way only after client sharing is added.
- Whether client sharing should create explicit audit events when implemented.
