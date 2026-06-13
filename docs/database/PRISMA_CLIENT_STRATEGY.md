# DCA OS v1 - Prisma Client Strategy

## 1. Executive Summary

Client generation is completed for the local dev environment.

The earlier post-migrate generate failure was an engine-fetch/dependency-state problem, and that has been resolved by adding the matching `@prisma/client` dependency to the data workspace. The data package boundary remains the only place Prisma Client is exposed.

## 2. Current Package State

- `packages/data` has Prisma CLI support
- `packages/data/package.json` now includes `prisma:validate`, `prisma:generate`, and `prisma:migrate:dev`
- `@prisma/client` is installed in the data workspace
- the schema lives in `packages/data/prisma/schema.prisma`
- the client boundary files exist in `packages/data/src/client`

## 3. Recommended Client Boundary

- Prisma schema lives in `packages/data`
- generated client usage should stay behind the data package boundary
- API code should not import raw Prisma Client everywhere
- repository and service layers should enforce tenant filtering

## 4. Generation Command

Safe command:

- `npm.cmd run -w @dca-os-v1/data prisma:generate`

That command works in the current local setup and should remain confined to the data package boundary.

## 5. Runtime Integration Status

Runtime API database integration remains blocked.

No API route should depend on Prisma Client yet.

## 6. Risks and Controls

- Raw Prisma access can bypass tenant filters; keep it behind repositories.
- Unchecked inputs can leak cross-tenant data; keep tenant context explicit.
- Relation includes can accidentally widen reads; review them at repository boundaries.
- Migration/client version mismatch can cause generation failures; keep Prisma package decisions aligned.

## 7. Recommended Next Step

Finalize repository and audit skeletons, then keep runtime API integration blocked until auth and tenant middleware are approved.
