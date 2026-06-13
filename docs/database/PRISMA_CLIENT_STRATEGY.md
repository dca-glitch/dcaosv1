# DCA OS v1 - Prisma Client Strategy

## 1. Executive Summary

Client generation is deferred, not completed.

The local migration succeeded, but Prisma attempted its post-migrate generate step and failed because the generator could not fetch an engine artifact in this environment. That means the Prisma Client boundary should be planned before any runtime integration.

## 2. Current Package State

- `packages/data` has Prisma CLI support
- `packages/data/package.json` currently includes `prisma:validate` and `prisma:migrate:dev`
- `@prisma/client` is not installed at the workspace root
- no runtime data-access package exists yet
- the schema lives in `packages/data/prisma/schema.prisma`

## 3. Recommended Client Boundary

- Prisma schema lives in `packages/data`
- generated client usage should stay behind the data package boundary
- API code should not import raw Prisma Client everywhere
- repository and service layers should enforce tenant filtering

## 4. Generation Command

Future safe command:

- `npm.cmd run -w @dca-os-v1/data prisma:generate`

That command should only be used once generation dependencies are approved and available locally.

## 5. Runtime Integration Status

Runtime API database integration remains blocked.

No API route should depend on Prisma Client yet.

## 6. Risks and Controls

- Raw Prisma access can bypass tenant filters; keep it behind repositories.
- Unchecked inputs can leak cross-tenant data; keep tenant context explicit.
- Relation includes can accidentally widen reads; review them at repository boundaries.
- Migration/client version mismatch can cause generation failures; keep Prisma package decisions aligned.

## 7. Recommended Next Step

Define the data access layer boundary and then decide whether Prisma Client generation should be approved for local development.

