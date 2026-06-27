# Module Implementation Order

Canonical MVP priority (Puriva): [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](../architecture/CLIENT_DOMAIN_OPERATING_MODEL.md) and [`docs/ROADMAP.md`](../ROADMAP.md).

## MVP 1 — Puriva client delivery (current priority)

1. Client Access Admin UI
2. Client Portal MVP (required — client-safe visibility and human/client review before publication)
3. Market Intelligence client-safe summary (portal-visible)
4. AI SEO delivery flow
5. Google Docs deliverables (client-visible final exports)
6. Website publishing workflow
7. Product catalog + inquiry for Puriva (inquiry only — no cart/checkout)
8. Monthly report final client view

Advanced Client Portal features (magic links, full comment threads, public approval links) remain phased after MVP visibility scope.

Future domain modules (Spa Finance, BaliShop, GayService, GotoBeauty, Bali24, SkinClinics, HIV24 productization, Revenue Hub, Commerce Core) are **not** current implementation scope.

## Platform First

1. Team Access
2. Company Records
3. Settings
4. Activity
5. Overview Metrics

## Business Second

1. Work Management
2. Contacts
3. Reports
4. Billing Area

## Automation Third

1. Planning Queue
2. Knowledge Base
3. SEO Module
4. AI Foundation

## Rule

Each module should reuse existing module contracts, route patterns, service patterns, and frontend page patterns.
