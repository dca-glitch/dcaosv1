# Revenue Hub AI — RH0 Operating Model (Docs Only)

**Status:** Future / deferred module — RH0 boundary document only  
**Date:** 2026-06-27  
**Scope:** Architecture and operator boundaries. No code, schema, connectors, or live integrations.

**Related:**

- [`docs/operator/deferred-scope-register.md`](../operator/deferred-scope-register.md)
- [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](./CLIENT_DOMAIN_OPERATING_MODEL.md)
- [`docs/architecture/G128_G133_MI_RH_POD_CLOSEOUT.md`](./G128_G133_MI_RH_POD_CLOSEOUT.md)
- [`docs/ROADMAP.md`](../ROADMAP.md)

---

## 1. Purpose

Revenue Hub AI will help DCA operators **understand and plan revenue** across agency clients and own-domain brands. It is **admin-only** and **read/recommend first** — not an autonomous billing or payment engine.

Puriva MVP and pre-VPS staging **exclude** Revenue Hub implementation.

---

## 2. Admin-only workflow (future)

1. Operator selects tenant + client (or own-domain brand context).
2. Operator imports or enters revenue records (manual first).
3. Optional future connectors sync read-only snapshots (WooCommerce, Stripe, custom site events).
4. AI summarizes trends, anomalies, and recommended operator actions.
5. Operator reviews, edits, and decides what (if anything) becomes client-visible — **default: nothing client-visible in RH0**.

No step may execute payments, change prices, issue refunds, or modify external systems without a separate approved block.

---

## 3. Data source map (future connectors)

| Source | Future role | RH0 status |
|--------|-------------|------------|
| **Manual revenue records** | Primary MVP path — operator-entered amounts, labels, periods | Planned first |
| **WooCommerce connector** | Read-only order/revenue snapshots per client store | Deferred |
| **Stripe connector** | Read-only payment/charge summaries (no live payment flows) | Deferred |
| **Next.js / custom website connector** | Read-only conversion or lead-value events if instrumented | Deferred |
| **Finance module (DCA OS Lite)** | Cross-reference invoices/bills for agency clients only | Read-only reference later |

All connectors must be **tenant-isolated**, **staging-first**, and **never reuse production credentials on staging** without explicit approval.

---

## 4. What AI may recommend (future)

- Revenue trend summaries by client, month, or product line.
- Anomaly flags (unexpected drops/spikes) for operator review.
- Suggested follow-up actions for the admin team (e.g. review invoice, check campaign, confirm connector sync).
- Draft operator notes for monthly reports — **admin must approve** before any client exposure.

---

## 5. What AI must never execute automatically

- Payment collection, refunds, or Stripe/WooCommerce write actions.
- Price changes, discount creation, or catalog updates.
- Bank feeds, accounting exports, or tax filing.
- Client-visible revenue dashboards without explicit product approval.
- Background high-cost model runs without admin trigger.
- Cross-tenant data blending or production credential use on staging.

---

## 6. Connector boundaries

- **Read-only ingestion** until a separate write-capability block is approved.
- **One connector per approved block** — no batch WooCommerce + Stripe + schema in one sprint.
- **No live connector in RH0** — documentation and operator model only.
- Staging proofs require G4+ and dedicated env secrets; not part of pre-VPS local work.

---

## 7. Deferred / live integration risks

| Risk | Mitigation |
|------|------------|
| Production payment keys on staging | Separate staging secrets; never copy prod `.env` |
| Client sees raw Stripe/WooCommerce data | Admin-only UI; no client portal surface in RH0 |
| Autonomous pricing or billing changes | Explicitly forbidden; recommendations only |
| Finance double-counting vs invoices | Manual reconciliation rules in a future block |
| AI cost runaway | Admin-triggered runs only; no background agents |

---

## 8. Activation criteria (when moving out of deferred)

1. Shared Finance + Client foundations stable on staging.
2. Separate approved implementation block (schema → backend → frontend).
3. Manual revenue records path validated locally first.
4. One connector at a time with staging smoke.
5. Owner approval for any client-visible revenue summary.

---

## 9. RH0 deliverable

This document only. No module code, migrations, API routes, or UI until an approved RH1+ block.

The G130-G131 closeout adds shared typed contracts for future Revenue Hub data
snapshots and advisory-only AI recommendation guards. These contracts do not
activate a module, connector, payment flow, CRM flow, or client-visible surface.
