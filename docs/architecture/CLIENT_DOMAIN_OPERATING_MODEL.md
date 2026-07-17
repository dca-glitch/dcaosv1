# Client / Domain Operating Model — DCA OS

**Status:** Approved (owner decision)
**Date:** 2026-06-27 (portfolio + MVP priority update); **G52-B alignment:** 2026-07-09

**Scope:** Canonical architecture for domains, clients, publication, finance separation, module portfolio, Client Operating Packs, and implementation roadmap
**Audience:** Product owner, operators, implementers, AI agents

**Related documents:**

- [`G52_OWNER_DISPOSITION.md`](./G52_OWNER_DISPOSITION.md) — G52-B product direction, gate separation, production readiness **NO**
- [`CLIENT_OPERATING_PACKS.md`](./CLIENT_OPERATING_PACKS.md) — generic Client Operating Pack model
- [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md) — Puriva Client-Service Launch requirements

- [`docs/CURRENT_SYSTEM_SNAPSHOT.md`](../CURRENT_SYSTEM_SNAPSHOT.md) — concise current system truth
- [`docs/TENANT_MODEL.md`](../TENANT_MODEL.md) — tenant and licensee boundaries
- [`docs/security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`](../security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md) — WordPress credentials per publication target
- [`docs/ROADMAP.md`](../ROADMAP.md) — approved implementation blocks

---

## 1. Executive summary

**Product naming:** Use **DCA OS** / **DCA OS Lite** as the current product name. Do not use **DCA360** as current product naming except in historical context.

**Product direction (G52-B, 2026-07-09):** DCA OS Lite = **Internal Agency OS first**, SaaS-like product later. Do not imply SaaS readiness or production readiness in this document.

**System domains:**

| Domain | Role |
|--------|------|
| `system.digitalcubeagency.net` | Final production login and DCA OS application location — app, admin, Client Portal, workspaces, modules |
| `digitalcubeagency.net` | Public product website for DCA OS — positioning, SaaS/service sales, onboarding later |
| `digitalcubeagency.com` | Public agency website / lead generation — backoffice handled by DCA OS |
| `digitalcubic.com` | **Removed** from active domain portfolio |

DCA OS treats **each internet domain as one `Client` record**. There is no separate `DomainProperty` table in the approved model.

Three organizational levels:

1. **Tenant** — SaaS instance / licensee workspace (e.g. Digital Cube Agency LLC today; future independent companies as separate tenants).
2. **Client** — operational unit = one domain (or agency service client scoped to a domain); distinguished by `clientKind`.
3. **Operational links** — AI Delivery, Market Intelligence, publication targets, analytics, finance — all hang off `Client`.

**Client Portal:** Required now — not deferred. DCA has an active agreement with Puriva and must start client delivery. Client Portal MVP must support client-safe delivery visibility only.

**MVP 1 / first Client Operating Pack:** DCA OS Client Delivery for **Puriva** (`puriva.id`) via **Puriva Operating Pack v1** — configuration on generic Core/modules, **not a fork**. Launch blockers and workflows: [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md).

**Approved:** 2026-06-26 (architecture); 2026-06-27 (domain portfolio + MVP priority); 2026-07-09 (G52-B Client Operating Pack alignment).

---

## 1.1 Client Operating Packs (G52-B)

Each `Client` may be operated through a **Client Operating Pack** — profiles, workflow templates, module entitlements, rules, and client-safe surfaces. Packs are **not forks** of Core or generic modules.

```text
Client (domain / agency client)
  └── Client Operating Pack
        ├── Compliance / content / image profiles
        ├── Workflow templates
        ├── Module entitlements
        ├── AI task / risk classes
        ├── Client-safe portal surfaces
        └── Admin learning notes
```

- **Core and modules remain generic.** Client-specific behavior comes from pack configuration.
- **Puriva** is the first pack. A second client later validates modularity.

Full model: [`CLIENT_OPERATING_PACKS.md`](./CLIENT_OPERATING_PACKS.md).
Gate separation: [`G52_OWNER_DISPOSITION.md`](./G52_OWNER_DISPOSITION.md).

---

## 2. Organizational model

### 2.1 Digital Cube Agency LLC (today)

- **Tenant:** Digital Cube Agency LLC
- **Roles:** `owner`, `admin` (DCA staff)
- **Clients:**
  - `AGENCY_CLIENT` — paying SEO/content clients (one Client per domain when isolation is needed)
  - `OWN_DOMAIN` — own DCA OS portfolio domains; each maps to an **independent legal entity** (separate company)
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

> **Current state:** live GA4/GSC integration is **WITHDRAWN** from current and planned scope. Manual import is **not implemented**. Existing schema fields and enum values remain historical compatibility surface until a later schema cleanup.

`ClientAnalyticsProfile` remains useful only as historical/model context for existing fields:

- `gscSiteUrl`, `ga4PropertyId`
- `defaultSourceType` — MANUAL | GA4 | GSC | HYBRID
- `connectionStatus` — MANUAL | CONFIGURED | LIVE_DEFERRED

Do not treat this section as live integration approval. `AiDeliveryMonthlyMetricSnapshot` still supports manual/snapshot reporting paths.

---

## 8. Access control (approved role set)

| Role | Who | Access |
|------|-----|--------|
| `owner` | DCA / licensee owner | Full admin in tenant |
| `admin` | DCA / licensee operator | Full operational admin |
| `client` | External portal user | `ClientUserAccess` only; client-visible modules; FINAL deliverables and reports only |

**Not in MVP:** granular per-module permission expansion beyond this set.

**Client Portal rule:** access per **Client**, not per project. Isolation = separate Client records per domain.

**Client Portal MVP (required now):** Client-safe delivery visibility for:

- Market Intelligence (client-safe summary only — no raw MI internals)
- AI SEO delivery status and approved content
- Google Docs deliverables (final export links only)
- Website publishing handoff / status
- Final deliverables and monthly reports (FINAL status)

**Clients must not see:** raw prompts, internal workflow runs, AI provider responses, AI costs, credentials, technical logs, raw MI internals, or admin-only notes.

**Client Access Admin UI:** Required — admin manages `ClientUserAccess` per Client before portal users can sign in.

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

## 11. MVP 1 — Puriva Client Operating Pack v1

**Active agency client:** `puriva.id` — beauty/clinic website, services, skincare catalog, product inquiry.

**Operating model:** Puriva is the **first Client Operating Pack** — not a codebase fork and not an architecture mistake. Pack-specific compliance, content, image, workflow, and launch requirements are documented in [`PURIVA_OPERATING_PACK_V1.md`](./PURIVA_OPERATING_PACK_V1.md).

**Historical note:** Local/admin operating pack closeout (pre-G52) lives in [`docs/runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md). That scope is local/admin only — not Puriva Client-Service Launch.

**Puriva MVP / pack v1 requires:**

| Capability | MVP scope |
|------------|-----------|
| Client Access Admin UI | Required |
| Client Portal MVP | Required — client-safe visibility only |
| Market Intelligence | Client-safe summary in portal |
| AI SEO | Delivery flow with human/client review before publication |
| Website publishing workflow | WordPress handoff/status |
| Google Docs final deliverables | Required export path |
| Product catalog on `puriva.id` | Inquiry only — no cart/checkout |
| Human/client review | Required before publication |

**Puriva MVP excludes (deferred):**

- `shop.puriva.id` ecommerce merch
- Ecommerce / cart / checkout / inventory
- Spa Finance
- Full Revenue Hub / Commerce Core

---

## 12. AI Delivery (agency clients first)

AI Delivery serves **agency clients first**.

Required delivery outputs:

- Final deliverables
- Google Docs export
- Website publishing / WordPress workflow
- Monthly report final client view

Technical implementation variant may be selected by implementers only within safe existing architecture and documented constraints (no schema/API/auth changes without explicit approval).

Human review is mandatory before client-visible or published output.

---

## 13. Domain portfolio matrix

Each domain is onboarded as a **`Client` record** (or linked workspace). Use this matrix for scope decisions.

| Domain | Business role | Monetization | DCA OS role | Current status |
|--------|---------------|--------------|-------------|----------------|
| `system.digitalcubeagency.net` | DCA OS login and application | SaaS / internal ops | System core — app, admin, Client Portal, workspaces, modules | **Active — production target** |
| `digitalcubeagency.net` | Public product website for DCA OS | SaaS/service sales, onboarding later | Public product site | Active |
| `digitalcubeagency.com` | Public agency website | Agency lead generation | Backoffice via DCA OS | Active |
| `puriva.id` | Active agency client — beauty/clinic | Services, skincare catalog, product inquiry | MI, SEO, Client Portal, Google Docs, website publishing, product catalog inquiry | **MVP 1 — active client** |
| `shop.puriva.id` | Future Puriva ecommerce merch | Product sales | Future commerce connector | **Deferred** |
| `cocograndespa.com` | Second real workspace — spa/local services | Services | Future DCA OS Spa Finance module | Active workspace; Spa Finance **deferred** |
| `balimedika.com` | Clinic website, education, contact/appointment | Services, appointments | Website publishing, content with human review | Active — no form storage in DCA OS; no EMR/patient records/diagnosis/online medical results |
| `hiv24.net` | HIV/STI/PrEP/PEP education | Education, awareness | Content with human review | Active — no diagnosis; no AI-only medical advice |
| `skinclinics.org` | Future skin clinic information portal | Content/listings | Future content/listing module | **Not current MVP** |
| `gotobeautyclinic.com` | Owned business — beauty directory/listings | Leads, booking requests, ads | Future Beauty Directory Engine | Future owned business |
| `bali24.net` | Bali guide, local directory, sponsored content | Directory, ads, own services | Future Bali Local Directory Engine | Future owned business |
| `gayinfo.net` | LGBT/gay information (separate from GayService) | Content, ads | Future content property | Future owned business |
| `gayservice.net` | LGBT services platform (not a marketplace) | Service fees, subscriptions | Future LGBT Service Platform module | Future high-complexity — **do not implement now** |
| `balishop.org` | POD sales — local Bali artist artwork | POD product sales, revenue share | Future POD Artist + Revenue Share module | Future — Gelato/Printful expected; pilot collection first |
| `artdynamic.net` | Future art/POD brand | Creative commerce | Future option | Future |
| `nusalifestyle.com` | External company business-card site | Services | Website publishing/support only | Active — limited DCA OS scope |
| `digitalcubic.com` | Former portfolio domain | — | **Removed** from active portfolio | Inactive / retired |

### 13.1 Domain-specific constraints (approved)

**`gayservice.net` (future only):**

- Do not describe as a marketplace
- Illegal services prohibited; sex/adult/escort profiles prohibited
- Country-level safety rules required from start
- Nickname profiles allowed
- Verification via card payment, bank transfer, or document submission by email if payment unavailable
- Stripe or 2Checkout expected; chat and reviews/ratings are MVP when built

**`balishop.org` (future only):**

- Not a marketplace — artist provides artwork; Balishop prints/sells POD products
- Revenue share applies; Gelato and Printful expected POD providers
- First version = small pilot collection

**Medical/education domains (`balimedika.com`, `hiv24.net`, `skinclinics.org`):**

- Human/client review required before publication
- No AI-only medical/beauty publishing
- No medical form storage in DCA OS for Bali Medika
- No EMR, patient records, diagnosis, or online medical result delivery

---

## 14. Shared DCA OS modules

Reusable modules across clients and domains:

| Module | Purpose |
|--------|---------|
| Client Access Admin UI | Grant/revoke portal users per Client |
| Client Portal | Client-safe delivery visibility |
| Market Intelligence | Research and insights (admin + client-safe summary) |
| AI Delivery | Monthly SEO/content delivery workflow |
| AI SEO | Content plan, drafts, SEO delivery |
| Website Publishing | WordPress draft prep, publish, handoff/status |
| Google Docs Export | Final deliverable export to Google Docs |
| Monthly Reports | Metrics, PDF, final client view |
| Product Catalog Inquiry | Product listing with inquiry-only flow (no cart) |
| Lead / Booking Request | Lead capture and booking request flows |
| Directory / Listings | Directory and listing content (future domains) |
| Reviews / Ratings | Review and rating surfaces (future domains) |
| Sponsored Content / Placement | Sponsored placement management (future domains) |
| Revenue Hub | Revenue/commerce analytics connector (future — not full MVP) |

---

## 15. Dedicated deferred modules

Build only after explicit scope approval:

| Module | Domain / context | Status |
|--------|------------------|--------|
| DCA OS Spa Finance | `cocograndespa.com` | Deferred |
| POD Artist Artwork + Revenue Share | `balishop.org` | Future |
| LGBT Service Platform | `gayservice.net` | Future / high complexity |
| Beauty Directory Engine | `gotobeautyclinic.com` | Future |
| Bali Local Directory Engine | `bali24.net` | Future |
| Medical/Educational Review Workflow | `balimedika.com`, `hiv24.net`, `skinclinics.org` | Future / controlled |

---

## 16. Current implementation priority order

Execute in this order (each step: inspect → implement → validate → owner approval → commit):

1. Client Access Admin UI
2. Client Portal MVP
3. Market Intelligence client-safe summary (portal-visible)
4. AI SEO delivery flow
5. Google Docs deliverables (client-visible final exports)
6. Website publishing workflow
7. Product catalog + inquiry for Puriva
8. Monthly report final client view
9. Architecture blocks 1–6 (Client foundation, PublicationTarget, MI clientId, credentials, publish, module middleware) — per [`docs/ROADMAP.md`](../ROADMAP.md)
10. Future domain modules — **only after explicit scope**

---

## 17. Approved architecture roadmap (blocks 1–6)

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

## 18. Domain decision checklist (per new Client / domain)

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

Cross-reference domain against the portfolio matrix (section 13) before scoping work.

---

## 19. Non-goals (current)

**Architecture safety (unchanged):**

- No tenant-global WordPress credentials
- No finance for own domains inside DCA LLC tenant
- No client access to credentials or internal AI workflow data
- No module enforcement until block 6 approval
- No licensee tenant migration until dedicated block approval

**Current product non-goals:**

- No parallel build-out of all domains
- No future domain code without an active workflow and explicit scope
- No Spa Finance in Puriva MVP
- No `shop.puriva.id` ecommerce in Puriva MVP
- No GayService implementation now
- No BaliShop implementation now
- No GotoBeauty directory engine now
- No Bali24 directory engine now
- No full Revenue Hub now
- No full Commerce Core now
- No medical form storage for Bali Medika
- No AI-only medical/beauty publishing
- No client access to raw AI/internal workflow data
- No public approval links in MVP
- No autonomous AI agents or uncontrolled provider execution

---

## 20. Changelog

| Date | Change |
|------|--------|
| 2026-06-26 | Initial approved architecture (owner audit + decisions 1B, independent company per own domain, multi-subdomain WordPress, finance licensee model, 6-block roadmap) |
| 2026-06-27 | Product naming (DCA OS), system domains, domain portfolio matrix, Client Portal required (Puriva MVP 1), shared/deferred modules, implementation priority order, non-goals update; `digitalcubic.com` removed from active portfolio |
| 2026-07-09 | G52-B alignment: Internal Agency OS first; Client Operating Pack model; Puriva as first pack; cross-links to G52 disposition and pack docs |
