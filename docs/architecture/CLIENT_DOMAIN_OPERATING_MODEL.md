# Client / Domain Operating Model (Legacy Compatibility Context)

**Status:** current canonical client/domain/publication model
**Current baseline reference:** merge commit `998c294e4c125d3ce9210ab0bd9a3e561584e78b` (`PR #55`)

## 1. Core model

DCA OS Lite treats **each internet domain as one `Client` record**.

Three organizational levels:

1. **Tenant** — current organizational compatibility boundary
2. **Client** — current operational unit for one domain or explicitly separated client surface
3. **Operational links** — AI Delivery, Market Intelligence, publication targets, analytics compatibility fields, finance, and portal access

Puriva is the first External Client Workspace target and operating pack on the shared platform; it is not a fork. `Workspace` becomes the primary boundary through the governed migration contract, not through a parallel product.

## 2. Access and portal rules

- Client Portal access is granted per **Client** via `ClientUserAccess`.
- Client users see only client-safe visibility, approvals, archive, and FINAL monthly reports.
- Client users must not see prompts, workflow internals, provider details, AI cost details, credentials, or `storageKey`.

## 3. Publication model

`Client` owns one or more `PublicationTarget` records.

```text
Tenant
  └── Client
        ├── PublicationTarget[]
        ├── AiDeliveryProject[]
        ├── MarketIntelligenceProject[]
        ├── Monthly report surfaces
        └── ClientUserAccess[]
```

Publication rules:

- Publication targets belong to **Client**, not tenant-global WordPress settings.
- WordPress is an **optional connector**.
- Current canonical implementation claim is **prepared-draft/local handoff only**.
- Live HTTP draft or publish is `APPROVED_DIRECTION_NOT_IMPLEMENTED` unless a retained historical proof document is explicitly cited for a narrower past proof.

## 4. Finance and analytics boundaries

- Agency-client finance remains tenant-scoped operational data.
- Existing `OWN_DOMAIN` data is legacy compatibility context. It is a candidate for `INTERNAL_BRAND` only after reconciliation; independent licensee direction is superseded.
- GA4/GSC live integration is **WITHDRAWN**; manual import is not implemented.
- Existing GA4/GSC-related fields remain compatibility surface only until a later cleanup.

## 5. Client Operating Pack rule

Client Operating Packs configure delivery behavior per client through profiles, templates, entitlements, and client-safe surfaces.

They are **not forks** of Core.

## 6. Current references

- [`../CURRENT_SYSTEM_SNAPSHOT.md`](../CURRENT_SYSTEM_SNAPSHOT.md)
- [`../STATUS.md`](../STATUS.md)
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- [`../project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md`](../project-control/AUTHORITATIVE_PROJECT_CONTROL_MATRIX.md)
- [`../security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`](../security/WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md)
- [`TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md`](./TENANT_CLIENT_TO_WORKSPACE_MIGRATION_CONTRACT.md)
