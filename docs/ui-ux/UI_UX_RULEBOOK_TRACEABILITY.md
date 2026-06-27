# DCA OS Lite — UI/UX Rulebook Traceability

**Purpose:** Map Rulebook v1 rules to evidence sources and implementation targets.
**Status:** Planning reference — not a change log.

---

## Global principles → sources

| Principle | Evidence pack | Element matrix | v0 audit | Screens |
|-----------|---------------|----------------|----------|---------|
| G1 Compact operator-first | §2 problems, §6 patterns P1 | Metric card SHRINK | Giant cards | AI Delivery, Dashboard |
| G2 Readable before decorative | §5 CSS tokens | state-panel SHRINK | Loud chrome | All |
| G3 Muted buttons | §5 buttons (dual CSS) | Primary SHRINK | Flashy CTAs | All |
| G4 Fewer giant cards/alerts | §7 by pattern | Metric, state-panel | Warning fatigue | Portal, AI Delivery |
| G5 Dense tables/lists | §6 P3, P15 | Data table REPLACE | Cards vs tables | Finance, Team |
| G6 Action hierarchy | §6 P5 | Primary, filter chips | Weak hierarchy | Toolbars |
| G7 Portal document | §8 admin vs client | Portal list SPLIT | Portal polish | Client Portal |
| G8 Consistent chrome | §4 PageHeader split | Page header REPLACE | Page chrome | Core modules |
| G10 Small lanes | §9 risks | P0/P1/P2 matrix | — | P0 plan |

---

## Element rules → traceability (summary)

| Element | Rulebook §C | Evidence § | Matrix row | JSON rule | P0 block |
|---------|-------------|------------|------------|-----------|----------|
| App shell | App shell | §8 boundary | Sidebar SPLIT | GR-06 | P0-2 (partial) |
| Page header | Page header | §6 P2 | Page header REPLACE | GR-01 | P0-3, P0-4, P0-5 |
| Metric card | Metric card | §6 P1 | Metric SHRINK | GR-02 | P0-2, P0-4, P0-5 |
| Data table | Data table | §6 P15 | Table REPLACE | GR-05 | P1 (not P0) |
| Dense list row | Dense list | §6 P3 | KEEP | GR-12 | P0-3 |
| Filter chips | Tabs/filter chips | §6 P5 | REPLACE | GR-04 | P0-1 |
| Section panel | Section panel | §6 P12 | SHRINK | GR-08 | P0-1 |
| Status badge | Status badge | §8 portal risk | SPLIT | GR-10 | P0-2 |
| Primary button | Primary button | §6 P5 | SHRINK | GR-03 | P0-1, P0-4 |
| Modal | Modal | §6 P7 | SHRINK | GR-09 | P1 |
| Field grid | Field grid | §5 forms | SHRINK | — | P0-1 |
| Client Portal list | Portal project list | §8 | SPLIT | GR-06 | P0-2 |
| AI Delivery row/modal | AI Delivery * | §3 routes | DEFER sheet | — | P0-4 |
| Invoice area | Invoice * | Screen register | REPLACE | GR-05 | P0-1 grid only |

---

## Screen families → rulebook layout §D

| Screen family | Register screen IDs | Layout §D | P0/P1 |
|---------------|---------------------|-----------|-------|
| Dashboard | dashboard | Dashboard/overview | P0-5 |
| CRUD list | clients, projects, tasks | CRUD list | P0-3, P1 |
| Finance | invoices, credit-notes, bills, services | Finance screen | P0-1 partial, P1 |
| Workflow | ai-delivery, market-intelligence | Workflow screen | P0-4 |
| Portal | client-portal | Client-safe portal | P0-2 |
| Settings shell | settings, team | Settings/read-only | P2 |
| Report | monthly-report, portal report detail | Report/document | P0-2 |

---

## v0 audit themes → rulebook sections

| v0 theme | Rulebook section |
|----------|------------------|
| Giant cards | §C Metric card, §B G4, §F SHRINK |
| Loud page chrome | §C Page header, §D |
| Cards instead of tables | §C Data table, §F REPLACE |
| Weak action hierarchy | §C Primary/secondary/chips, §B G6 |
| Low-signal premium space | §C Metric card, AI Delivery summary |
| Portal polish | §C Portal list, §E |
| Admin compact | §B G1, dense list KEEP |

---

## Forbidden features → rulebook §H

Traceable to: `V0_UI_UX_AUDIT_PACK.md` §9, `UI_UX_EVIDENCE_PACK.md` §8, `AGENTS.md`, `CLIENT_DOMAIN_OPERATING_MODEL.md` (portal scope).

---

## Dark Nebula → rulebook reconciliation

| Dark Nebula doc | Rulebook v1 |
|-----------------|-------------|
| Spacious cards | Overridden at data surfaces — §A hybrid note |
| Glass panels | KEEP at shell |
| Nebula gradients | KEEP body background |
| Operational workflows | KEEP — compact presentation |

---

*Short traceability index. Expand per rule during implementation block prompts.*
