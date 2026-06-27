# POD AI Toolkit — POD0 Operating Model (Docs Only)

**Status:** Future / deferred module — POD0 boundary document only  
**Date:** 2026-06-27  
**Scope:** Architecture and operator boundaries. No code, scraping, marketplace, or live integrations.

**Related:**

- [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)
- [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./CLIENT_DOMAIN_OPERATING_MODEL.md)
- [`docs/ROADMAP.md`](../ROADMAP.md)

---

## 1. Purpose

POD AI Toolkit will support **print-on-demand and product-led content workflows** for operator-managed brands. It is **admin-only** and **suggest/plan first** — not an autonomous product publisher or marketplace.

Not required for Puriva MVP, G4 staging, or first VPS deployment.

---

## 2. Admin-only workflow (future)

1. Operator defines a POD project (brand, niche, catalog intent).
2. Operator records product research notes and competitor references (manual/bounded).
3. AI suggests product angles, titles, descriptions, and content/image briefs.
4. Operator reviews, edits, and approves before any export or handoff.
5. Optional future handoff to AI Delivery (content plans, drafts, deliverables) — admin-triggered only.

No step may auto-publish to marketplaces, auto-generate listings at scale, or run unbounded scraping.

---

## 3. Product / research / content / image boundaries

| Area | Operator owns | AI may suggest | AI must not automate |
|------|---------------|----------------|----------------------|
| **Product research** | Source URLs, notes, approve/reject | Summaries, gaps, positioning angles | Broad crawling, continuous scraping |
| **Catalog records** | SKUs, titles, pricing labels | Draft copy variants | Live marketplace publish, price changes |
| **Content** | Final copy approval | Blog/social/product description drafts | Client-visible publish without admin release |
| **Images** | Final asset selection | Image briefs, prompt plans | Unreviewed bulk generation, cost-heavy background runs |

Client Portal must **never** expose raw POD prompts, supplier credentials, or draft listings.

---

## 4. Data needed later (not collected in POD0)

- Product identifiers and operator-approved catalog metadata.
- Bounded research sources (manual URLs and notes — same discipline as Market Intelligence).
- Content plan and deliverable links from AI Delivery.
- Optional future connector metadata (marketplace APIs) — separate approved blocks only.

---

## 5. Explicitly deferred

- Module code, schema, and API routes.
- Marketplace connectors (Etsy, Amazon, etc.).
- Autonomous product discovery and competitor monitoring at scale.
- Scraping / broad data collection module overlap.
- Live image provider execution without admin trigger and cost gates.
- Client-facing product catalogs beyond existing Client Hub inquiry patterns (Puriva).

---

## 6. What AI may suggest vs must not automate

**May suggest (after operator request):**

- Product niche summaries from admin-provided sources.
- Listing title/description variants for operator review.
- Content calendar ideas tied to a POD project month.
- Image concept briefs aligned with brand guidelines.

**Must not automate:**

- Listing publish or inventory sync to external marketplaces.
- Trademark or compliance decisions.
- Unreviewed use of scraped competitor catalogs.
- Background agents that run without admin session context.
- Exposure of supplier API keys, margins, or internal cost data to clients.

---

## 7. Relationship to existing modules

| Module | Relationship |
|--------|----------------|
| **Market Intelligence** | Bounded research discipline; MI handoff patterns may inform POD research later |
| **AI Delivery** | Monthly content and deliverable packaging for POD brands |
| **Client Hub / catalog inquiry** | Puriva-style inquiry-only client surface; not full POD commerce |
| **Finance** | Separate from POD margins until an approved finance block |

---

## 8. Activation criteria (when moving out of deferred)

1. Puriva MVP and staging smoke stable.
2. Separate approved POD1 block (inspect → schema if needed → backend → frontend).
3. Manual research + suggestion path validated locally.
4. No scraping or marketplace write scope in the first implementation block.

---

## 9. POD0 deliverable

This document only. No module implementation until an approved POD1+ block.
