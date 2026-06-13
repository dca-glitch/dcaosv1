# DCA OS v1 - Data Layer Validation Plan

## 1. Executive Summary

This plan defines validation expectations for the data package and its tenant-safe repository boundary.

## 2. Validation Goals

- tenant isolation tests later
- cross-tenant leak tests
- role and membership tests
- permission resolution tests
- audit append-only tests
- settings non-secret tests
- repository signature checks
- no tenantId-from-body rule
- no unchecked Prisma input rule
- no API raw Prisma imports rule
- future CI expectations

## 3. Recommended Structural Checks

- verify `TenantUser` does not exist
- verify `UserRole` does not exist
- verify repository files exist
- verify no forbidden imports from API into data internals
- verify no direct Prisma imports outside approved client boundary files
- verify `.env` remains ignored

Current helper:

- `npm.cmd run -w @dca-os-v1/data check:data-layer`

## 4. Future Test Coverage

- tenant-scoped repository signatures require tenant context
- system-context operations require explicit system context
- audit writes remain append-only
- repository reads do not cross tenant boundaries

## 5. CI Expectations

Validation should remain lightweight until the data layer is wired into a true runtime path.

## 6. Recommended Next Step

Implement the tenant-safe data boundary and keep runtime integration blocked until the API plan is approved.
