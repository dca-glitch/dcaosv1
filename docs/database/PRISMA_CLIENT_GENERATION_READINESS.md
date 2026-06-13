# DCA OS v1 - Prisma Client Generation Readiness

This document records the Prisma Client generation boundary for the current local setup.

## 1. Current Prisma Client Package State

- `packages/data` declares `prisma` and `@prisma/client`
- the Prisma schema lives in `packages/data/prisma/schema.prisma`
- the data package owns the client boundary

## 2. `prisma:generate` Script

Yes, the script exists in `packages/data/package.json`:

```json
"prisma:generate": "prisma generate"
```

## 3. Generated Client Availability

The generated client is available through the data workspace dependency setup for local development.

## 4. API Runtime Boundary

API runtime should keep using the controlled data access boundary instead of importing Prisma Client directly from controllers or routes.

## 5. Future Command

Only after approval:

```powershell
npm.cmd run -w @dca-os-v1/data prisma:generate
```

## 6. Status

No generate command is run in this block.
