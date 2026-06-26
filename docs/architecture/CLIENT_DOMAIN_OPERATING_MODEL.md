# Client / Domain Operating Model — DCA OS Lite

**Status:** Approved (owner decision)  
**Date:** 2026-06-26  
**Scope:** Canonical architecture for domains, clients, publication, finance separation, and implementation roadmap  
**Audience:** Product owner, operators, implementers, AI agents  

**Related documents:**

- [`prd.md.txt`](../../prd.md.txt) — product source of truth (updated to match this model)
- [`docs/TENANT_MODEL.md`](../TENANT_MODEL.md) — tenant and licensee boundaries
- [`docs/security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`](../security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md) — WordPress credentials per publication target
- [`docs/ROADMAP.md`](../ROADMAP.md) — approved implementation blocks

---

## 1. Executive summary

DCA OS Lite treats **each internet domain as one `Client` record**. There is no separate `DomainProperty` table in the approved model.

Three organizational levels:

1. **Tenant** — SaaS instance / licensee workspace (e.g. Digital Cube Agency LLC today; future independent companies as separate tenants).
2. **Client** — operational unit = one domain (or agency service client scoped to a domain); distinguished by `clientKind`.
3. **Operational links** — AI Delivery, Market Intelligence, publication targets, analytics, finance — all hang off `Client`.

**Approved:** 2026-06-26 by product owner.

---

## 2. Organizational model

### 2.1 Digital Cube Agency LLC (today)

- **Tenant:** Digital Cube Agency LLC
- **Roles:** `owner`, `admin` (DCA staff)
- **Clients:**
  - `AGENCY_CLIENT` — paying SEO/content clients (one Client per domain when isolation is needed)
  - `OWN_DOMAIN` — own DCA360 portfolio domains; each maps to an **independent legal entity** (separate company)
- **Finance in this tenant:** agency clients only. **No invoices for own-domain assets** in DCA LLC Finance.

### 2.2 Own domains and future licensees

Each own domain belongs to an **independent company**. That company will eventually operate as a **separate licensee tenant** with:

- Licensed modules from Digital Cube Agency LLC (`TenantModule`)
- Its own Finance module (invoices, bills, costs)
- Its own `owner` / `admin` staff
- One or more `OWN_DOMAIN` Client records

Until migration: `OWN_DOMAIN` clients may exist in the DCA tenant with `legalEntityName` and `migrationStatus` for planned spin-off.

### 2.3 Client kinds

| `clientKind` | Meaning | Finance tenant |
|--------------|---------|----------------|
| `AGENCY_CLIENT` | External client served by DCA agency | DCA LLC tenant |
| `OWN_DOMAIN` | Own internet domain / brand asset | Future licensee tenant (not DCA LLC) |

### 2.4 Multi-domain same counterparty (variant B)

When one real-world company has multiple domains:

- Create **one `Client` per domain**.
- Optional `accountGroupName` for reporting only (no access-control effect).
- Client Portal access remains **per Client** via `ClientUserAccess` (not per project).

---

## 3. Client as operational hub

```text
Tenant
  └── Client (domain / agency client)
        ├── website              — canonical domain URL (normalized)
        ├── clientKind
        ├── legalEntityName      — required for OWN_DOMAIN
        ├── accountGroupName     — optional reporting group
        ├── migrationStatus      — PLANNED | MIGRATED (licensee path)
        │
        ├── PublicationTarget[]  — WordPress / future connectors (multiple subdomains)
        ├── ClientAnalyticsProfile — GA4 / GSC (1:1, extensible per subdomain later)
        ├── MarketIntelligenceProject[] — clientId required
        ├── AiDeliveryProject[]  — clientId required; unique per (clientId, targetMonth)
        ├── Project[]            — optional general ops; link via projectId
        └── Invoice / RecurringInvoice — agency clients; licensee tenants for own domains
```

### 3.1 Client Operating Hub (UI direction)

Single admin screen per Client:

- Overview (kind, website, legal entity, migration status)
- Market Intelligence
- AI Delivery (by month)
- Publication targets (WordPress)
- Analytics profile
- Finance summary (when applicable)
- Client access (portal users)

---

## 4. Publication model (WordPress)

### 4.1 Problem solved

Legacy: one WordPress config per **tenant** — unsafe with many domains/clients.

Approved: **PublicationTarget** per Client — supports multiple WordPress installations (subdomains) per domain.

```text
Client
  └── PublicationTarget
        ├── label          — e.g. "Blog", "Shop", "Landing"
        ├── siteUrl        — e.g. https://blog.example.com
        ├── siteSlug
        ├── wordPressComSite
        ├── isDefault      — one default per client
        └── credentials    — encrypted, separate block (see security design doc)
```

### 4.2 Publication resolution rules

1. `AiDeliveryProject.clientId` → Client
2. Operator selects `publicationTargetId` (or default target)
3. UI double-confirm: Client name + website + target siteUrl
4. Prepare draft / publish uses **only** that target — never tenant-global config
5. **PublicationLog** records: deliverable, clientId, targetId, siteUrl, status, timestamp, actor

### 4.3 Deprecation

- Deprecate tenant-level `ai_delivery_wordpress_connection` in Company Profile
- Move public config to Client Hub → Publication targets
- Company Profile remains DCA billing/company identity only

---

## 5. Market Intelligence linkage

- `MarketIntelligenceProject.clientId` — **required** (FK to Client)
- `MarketIntelligenceHandoff.clientId` — **required**
- Handoff to AI Delivery only when `handoff.clientId === aiDeliveryProject.clientId`
- `targetClientName` — deprecated; display name derived from Client

---

## 6. Finance and delivery bridge

### 6.1 Agency clients (DCA LLC tenant)

- Link `AiDeliveryProject` ↔ `RecurringInvoice` / `Invoice`
- `servicePeriod` on invoice (clientId + month)
- Operational status on Client hub: MI → Delivery → Report FINAL → Invoice → Paid

### 6.2 Own domains

- **No finance** in Digital Cube Agency LLC tenant for `OWN_DOMAIN`
- Finance runs in **licensee tenant** after migration
- External company invoices/costs tied to that legal entity's tenant

---

## 7. Analytics (GA4 / GSC)

`ClientAnalyticsProfile` (1:1 with Client):

- `gscSiteUrl`, `ga4PropertyId`
- `defaultSourceType` — MANUAL | GA4 | GSC | HYBRID
- `connectionStatus` — MANUAL | CONFIGURED | LIVE_DEFERRED

`AiDeliveryMonthlyMetricSnapshot` inherits profile from `clientId` when creating monthly report.

---

## 8. Access control (approved role set)

| Role | Who | Access |
|------|-----|--------|
| `owner` | DCA / licensee owner | Full admin in tenant |
| `admin` | DCA / licensee operator | Full operational admin |
| `client` | External portal user | `ClientUserAccess` only; client-visible modules; FINAL deliverables and reports only |

**Not in MVP:** granular per-module permission expansion beyond this set.

**Client Portal rule:** access per **Client**, not per project. Isolation = separate Client records per domain.

**Client-visible modules (default):** AI Delivery deliverables (DELIVERED/ACCEPTED), Monthly Reports (FINAL). No MI raw sources, prompts, workflow runs, or credentials.

---

## 9. Module entitlement enforcement (deferred execution)

**Design now, enforce later:**

- Middleware `requireTenantModule(moduleKey)` on business routes
- Route → module map in one config file
- Phases: dry-run log → 403 on selected routes → full enforcement
- Supports future licensing (whole OS or per module) to licensee tenants

---

## 10. Code organization (monolith split)

Extract from `core.runtime.ts` into domain runtimes:

1. `client-portal.runtime.ts` (exists)
2. `clients.runtime.ts`
3. `client-publication.runtime.ts`
4. `ai-delivery.runtime.ts`
5. `market-intelligence.runtime.ts`
6. `finance.runtime.ts`

Frontend: `ClientHubPage` module; WordPress config moves from Company Profile to Client Hub.

---

## 11. Approved implementation roadmap

| Block | Name | Scope summary |
|-------|------|----------------|
| **1** | Client foundation + `clientKind` | `AGENCY_CLIENT` / `OWN_DOMAIN`, `legalEntityName`, `accountGroupName`, website normalization, Client Hub shell, migration fields |
| **2** | PublicationTarget (public) | CRUD targets per Client, multiple subdomains, `isDefault`, move config from Company Profile, prepare-draft uses clientId + targetId |
| **3** | MI → `clientId` | Required FK, migrate from `targetClientName`, handoff validation, UI client picker |
| **4** | Encrypted credentials | Per PublicationTarget; security review; no plaintext in API/UI/logs |
| **5** | Real WordPress publish + PublicationLog | Live publish after block 4; double-confirm UI |
| **6** | Module middleware | `requireTenantModule`; dry-run → enforce; licensee packaging |

**Future block (not in 1–6):** Licensee tenant migration — `OWN_DOMAIN` + `legalEntityName` → new Tenant, Finance transfer, `TenantModule` license from DCA LLC.

Each block: inspect → implement → validate → owner approval → commit (separate approval).

---

## 12. Domain decision checklist (per new Client / domain)

When onboarding a new domain as Client, record:

| Question | Required answer |
|----------|-----------------|
| Business goal? | SEO, commerce, lead gen, directory, media, agency service, experiment |
| `clientKind`? | `AGENCY_CLIENT` or `OWN_DOMAIN` |
| Legal entity? | Required for `OWN_DOMAIN` |
| Licensee tenant plan? | Stay in DCA tenant vs planned migration |
| Modules needed? | AI Delivery, MI, Finance (licensee), etc. |
| Publication targets? | WordPress URLs per subdomain |
| Analytics? | GA4 property, GSC site URL |
| Approval risk? | Medical/legal/brand review |
| MVP vs later? | Explicit |

---

## 13. Non-goals (unchanged product safety)

- No tenant-global WordPress credentials
- No finance for own domains inside DCA LLC tenant
- No client access to credentials or internal AI workflow data
- No module enforcement until block 6 approval
- No licensee tenant migration until dedicated block approval

---

## 14. Changelog

| Date | Change |
|------|--------|
| 2026-06-26 | Initial approved architecture (owner audit + decisions 1B, independent company per own domain, multi-subdomain WordPress, finance licensee model, 6-block roadmap) |
