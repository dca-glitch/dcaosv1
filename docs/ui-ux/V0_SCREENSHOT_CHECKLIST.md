# DCA OS Lite — v0 Screenshot Checklist

**Purpose:** Owner-operated capture list for v0.dev UI/UX audit.
**Output folder (create locally, do not commit secrets or screenshots unless approved):**

```text
docs/ui-ux/screenshots/v0-audit/
```

**Naming convention:** `{module}-{view}-{state}.png`
**Primary viewport:** 1440×900 · **Secondary:** 1280×800 for density check

---

## Prerequisites

### 1. Start local stack (owner-run, external terminals)

```powershell
# Terminal 1
cd C:\dcaosv1
npm.cmd run dev:api

# Terminal 2
cd C:\dcaosv1
npm.cmd run dev:web
```

### 2. Sign in

- URL: `http://localhost:5173`
- Admin: `admin@dca.local`
- Password: `$env:AUTH_SEED_TEST_PASSWORD` (set locally only)
- If Turnstile blocks local login, capture login screen only and note blocker in findings.

### 3. Capture screenshots manually

After you are signed in:

1. Resize the browser window to **1440×900** (primary) or **1280×800** (secondary density check).
2. Navigate to each hash route or in-page view listed below (e.g. `http://localhost:5173/#/dashboard`).
3. Use **Win+Shift+S** (Windows Snipping Tool / screen snip) to capture the region or window.
4. Save each file under `docs/ui-ux/screenshots/v0-audit/` using the naming convention below.
5. **Do not commit screenshots** to the repo unless explicitly approved.

Modals, Client Hub, and AI Delivery workflow panels require manual navigation before each capture — there is no automated capture on this branch.

---

## Capture legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not captured |
| `[x]` | Captured |
| **M** | Manual capture (Win+Shift+S) |
| **P0** | Critical for v0 review |
| **P1** | Important |
| **P2** | Nice to have |

---

## Login / Auth

| P | M | File name | Route / trigger | States to capture |
|---|-----|-----------|-----------------|-------------------|
| P0 | M | `auth-login-default.png` | Signed out → `#/login` | Default form |
| P1 | M | `auth-login-error.png` | Failed login | Error message |
| P2 | M | `auth-login-turnstile.png` | Turnstile visible | If env key set |
| P2 | M | `auth-login-loading.png` | Submit in flight | If reproducible |

---

## App shell (global)

| P | M | File name | Trigger | Notes |
|---|-----|-----------|---------|-------|
| P0 | M | `shell-sidebar-admin.png` | Any admin route | Full sidebar sections |
| P0 | M | `shell-sidebar-client-portal.png` | `#/client-portal` | Same shell — note admin nav visibility |
| P1 | M | `shell-status-notice-success.png` | After successful action | App-level banner |
| P1 | M | `shell-status-notice-error.png` | After failed action | App-level banner |
| P2 | M | `shell-user-panel.png` | Sidebar footer | User + logout |

---

## Dashboard

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P0 | M | `dashboard-default.png` | `#/dashboard` | Populated metrics + audit feed |
| P1 | M | `dashboard-audit-filter-auth.png` | `#/dashboard` | Audit filter = Auth |
| P1 | M | `dashboard-audit-empty.png` | `#/dashboard` | No audit events |
| P2 | M | `dashboard-quick-actions.png` | `#/dashboard` | Quick action grid + future pills |

---

## Modules & Tenants

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P1 | M | `modules-registry.png` | `#/modules` | Module grid |
| P2 | M | `modules-registry-readonly.png` | `#/modules` | Non-admin role if available |
| P2 | M | `modules-detail-shell.png` | `#/modules/clients` | Placeholder panel |
| P1 | M | `tenants-list.png` | `#/tenants` | Tenant switch list |

---

## Clients

| P | M | File name | Route / trigger | States |
|---|-----|-----------|-----------------|--------|
| P0 | M | `clients-list-active.png` | `#/clients` | Active clients table |
| P1 | M | `clients-list-archived-filter.png` | `#/clients` | Archived filter |
| P1 | M | `clients-empty.png` | `#/clients` | No clients |
| P0 | M | `clients-create-modal.png` | Add client | Form modal |
| P1 | M | `clients-edit-modal.png` | Edit client | Form modal |
| P1 | M | `clients-row-actions.png` | Row menu open | Actions menu |
| P1 | M | `clients-access-panel.png` | Client user access | Link/archive users |

### Client Hub (in-page, not separate hash)

| P | M | File name | Trigger | States |
|---|-----|-----------|---------|--------|
| P0 | M | `client-hub-overview.png` | Open hub from client row | Overview sections |
| P1 | M | `client-hub-publication-targets.png` | Publication targets | List + add form |
| P1 | M | `client-hub-analytics-profile.png` | Analytics section | GSC/GA4 fields |
| P1 | M | `client-hub-catalog.png` | Catalog products | Admin catalog |
| P2 | M | `client-hub-publication-log.png` | Publication log | Log table |
| P2 | M | `client-hub-credentials.png` | Credential form | Masked password field |

---

## Projects & Tasks

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P1 | M | `projects-list.png` | `#/projects` | Populated |
| P2 | M | `projects-empty.png` | `#/projects` | Empty state |
| P2 | M | `projects-create-modal.png` | Add project | Modal |
| P1 | M | `tasks-list.png` | `#/tasks` | Populated |
| P2 | M | `tasks-empty.png` | `#/tasks` | Empty state |
| P2 | M | `tasks-row-actions.png` | Row menu | Actions |

---

## Finance — Invoices

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P0 | M | `finance-invoices-list.png` | `#/invoices` | Invoice table |
| P0 | M | `finance-invoices-create-modal.png` | Create invoice | Line items |
| P1 | M | `finance-invoices-recurring.png` | Recurring section | Recurring table |
| P1 | M | `finance-invoices-payment-modal.png` | Register payment | Payment form |
| P1 | M | `finance-invoices-row-lifecycle.png` | Row menu Lifecycle | Status actions |
| P2 | M | `finance-invoices-empty.png` | No invoices | Empty state |

---

## Finance — Credit Notes

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P1 | M | `finance-credit-notes-list.png` | `#/credit-notes` | List |
| P2 | M | `finance-credit-notes-create.png` | Create modal | Form |
| P2 | M | `finance-credit-notes-row-actions.png` | Row menu | Issue/void |

---

## Finance — Services Library

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P1 | M | `finance-services-list.png` | `#/invoice-items` | Active services |
| P2 | M | `finance-services-archived.png` | Archived tab/filter | If present |
| P2 | M | `finance-services-create.png` | Add service | Modal |

---

## Finance — Bills & Vendors

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P1 | M | `finance-bills-list.png` | `#/bills` | Bills table |
| P1 | M | `finance-bills-vendors.png` | Vendors section | Vendor list |
| P2 | M | `finance-bills-create.png` | Add bill | Modal |
| P2 | M | `finance-bills-upload.png` | Document upload | Upload UI |
| P2 | M | `finance-bills-row-actions.png` | Row menus | Vendor + bill actions |

---

## AI Delivery

| P | M | File name | Route / trigger | States |
|---|-----|-----------|-----------------|--------|
| P0 | M | `ai-delivery-project-list.png` | `#/ai-delivery` | Project table + operator summary |
| P0 | M | `ai-delivery-empty.png` | No projects | Empty state |
| P0 | M | `ai-delivery-create-modal.png` | Add AI Delivery | Create modal |
| P0 | M | `ai-delivery-row-actions.png` | Row menu open | Planning/Packaging/Reports groups |
| P0 | M | `ai-delivery-brief-modal.png` | Brief modal | Brief workflow |
| P0 | M | `ai-delivery-content-plan-modal.png` | Content Plan modal | Topics + approval context |
| P0 | M | `ai-delivery-research-modal.png` | Research / Sources | Research UI |
| P1 | M | `ai-delivery-mi-context-modal.png` | MI Context modal | Handoffs |
| P1 | M | `ai-delivery-workflow-runs-modal.png` | Workflow Runs | Internal runs |
| P0 | M | `ai-delivery-content-drafts-modal.png` | Content Production | Drafts |
| P1 | M | `ai-delivery-article-images-modal.png` | Image Production | Images |
| P0 | M | `ai-delivery-deliverables-modal.png` | Deliverables | Package list |
| P1 | M | `ai-delivery-deliverable-reviews.png` | Reviews sub-panel | Internal QA |
| P0 | M | `ai-delivery-monthly-report.png` | Monthly Report panel | FINAL report workflow |
| P1 | M | `ai-delivery-monthly-metrics.png` | Monthly metrics import | Metrics section |
| P2 | M | `ai-delivery-modal-error.png` | Blocked action | Error in modal |
| P2 | M | `ai-delivery-wordpress-confirm.png` | Publish confirm | Guard modal |

---

## Market Intelligence

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P0 | M | `mi-project-queue.png` | `#/ai-market-intelligence` | Project list pane |
| P0 | M | `mi-project-detail.png` | Select project | Detail pane |
| P1 | M | `mi-insights-list.png` | Insights section | Status badges |
| P1 | M | `mi-handoffs.png` | Handoffs section | READY handoff |
| P2 | M | `mi-create-project-modal.png` | New research project | Modal |
| P2 | M | `mi-empty.png` | No projects | Empty state |
| P2 | M | `mi-action-error.png` | actionError banner | Error state |

---

## Client Portal

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P0 | M | `portal-archive-overview.png` | `#/client-portal` | Metrics + project sidebar |
| P0 | M | `portal-project-detail.png` | Select project | Delivery overview |
| P0 | M | `portal-deliverables.png` | Deliverables section | Final items only |
| P0 | M | `portal-monthly-reports-list.png` | Monthly reports | FINAL list |
| P0 | M | `portal-monthly-report-detail.png` | Open report | Detail + download |
| P1 | M | `portal-catalog.png` | Product catalog | Client-safe catalog |
| P1 | M | `portal-catalog-inquiry.png` | Inquiry form | Submit inquiry |
| P1 | M | `portal-empty-archive.png` | No projects | Empty state |
| P1 | M | `portal-error-archive.png` | Archive error | ErrorState |
| P2 | M | `portal-download-notice.png` | Download blocked | Notice banner |

---

## Settings / Admin

| P | M | File name | Route | States |
|---|-----|-----------|-------|--------|
| P1 | M | `settings-readonly.png` | `#/settings` | MVP shell |
| P1 | M | `team-members.png` | `#/team` | Member directory |
| P1 | M | `company-profile.png` | `#/company-profile` | Profile form |
| P2 | M | `company-profile-wordpress-panel.png` | WP config panel | If visible (deprecated path) |

---

## Deferred routes (capture for "do not design" reference only)

| P | M | File name | Route | Notes |
|---|-----|-----------|-------|-------|
| P2 | M | `deferred-content-plan-review.png` | `#/content-plan-review` | Must stay deferred |
| P2 | M | `deferred-content-draft-review.png` | `#/content-draft-review` | Must stay deferred |

---

## Shared UI patterns (cross-module)

Capture best examples from any module:

| P | M | File name | Pattern |
|---|-----|-----------|---------|
| P1 | M | `pattern-metric-cards.png` | 4-up metric grid |
| P1 | M | `pattern-section-panel.png` | SectionPanel header + body |
| P1 | M | `pattern-status-badge.png` | Badge variants in table |
| P1 | M | `pattern-empty-state.png` | EmptyState component |
| P1 | M | `pattern-error-state.png` | ErrorState full page |
| P1 | M | `pattern-loading-state.png` | LoadingState |
| P1 | M | `pattern-modal-footer.png` | Modal actions layout |
| P2 | M | `pattern-dense-table.png` | Finance or clients table |
| P2 | M | `pattern-filter-chips.png` | Active/archived chips |
| P2 | M | `pattern-row-action-menu.png` | `details.row-action-menu` |

---

## Post-capture checklist

- [ ] All P0 screenshots captured (or noted as blocked with reason)
- [ ] Filenames follow convention
- [ ] No secrets, tokens, or real credentials visible in images
- [ ] Redact client PII if sharing outside trusted reviewers
- [ ] Upload set to v0.dev with prompt from `V0_UI_UX_AUDIT_PACK.md` §8
- [ ] Paste v0 findings into `V0_AUDIT_FINDINGS_TEMPLATE.md`

---

## Blockers log (fill if needed)

| Screen | Blocker |
|--------|---------|
| | Local auth / Turnstile |
| | Missing seed data |
| | API not running |

---

*Documentation only — manual capture; do not commit screenshots.*
