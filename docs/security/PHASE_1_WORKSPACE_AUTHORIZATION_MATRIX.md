# Phase 1 Workspace Authorization Matrix

**Status:** Canonical target contract. Existing tenant-role enforcement remains current until a separately reviewed switch package.

| Canonical role | Scope | Baseline access | Explicit boundary |
|---|---|---|---|
| `Admin` | Explicitly assigned administrative scope | Workspace administration and approved operational configuration | No implicit access to an unassigned Workspace |
| `Workspace Manager` | Assigned Workspace | Workspace operations and membership management within delegated scope | No cross-workspace access or platform-wide administration |
| `Team Member` | Assigned Workspace | Assigned delivery and collaboration work | No membership governance, client-safe boundary bypass, or cross-workspace access |
| `Client Manager` | Assigned external-client Workspace | Client relationship and approved client-facing workflow management | No provider, credential, raw workflow, or unrestricted finance access |
| `Client User` | Explicit external-client Workspace membership | Client-safe FINAL/archive/approval surfaces only | No prompts, provider internals, AI cost details, raw workflow runs, credentials, `storageKey`, or admin-only notes |

## Required enforcement

- Authorization is deny-by-default and enforced server-side.
- Every Workspace-scoped read and write resolves an active membership and Workspace scope server-side; client-supplied IDs never grant scope.
- A user may have multiple explicit roles, but effective access remains bounded by active membership and Workspace assignment.
- Negative tests must cover unassigned Workspace access, revoked membership, cross-workspace access, and Client User attempts to reach administrative routes or internal fields.

## Deferred detail

Exact permission grants, delegation mechanics, and the endpoint-by-endpoint switch order are pending later bounded packages. They do not authorize a fallback to implicit or client-supplied scope.
