# DCA OS v1 - Local PostgreSQL Development Plan

## 1. Executive Summary

Local PostgreSQL setup is now defined for dev-only use, and the first DB-1 migration has been applied locally.

The project uses a Docker Compose PostgreSQL container on `127.0.0.1:5434` with placeholder credentials and a named volume.

## 2. Goals

- safe local dev database
- no production credentials
- reproducible setup
- Prisma-compatible
- easy reset for development only

## 3. Recommended Setup Options

### A. Docker Compose local Postgres

Best default for repeatability and reset control.

### B. Existing local Postgres install

Acceptable if already managed well on the machine, but more variable.

### C. Cloud dev DB

Useful later, but less safe as the first default because it increases credential and network exposure.

Recommended safest default:

- Docker Compose local Postgres, isolated to dev

## 4. Proposed Local Environment Variables

Use placeholders only:

- `DATABASE_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

No real secrets.

## 5. Docker Compose Plan Later

Future files or commands may include:

- `docker-compose.dev.yml`
- `infra/local/postgres`
- a named volume
- a local port binding
- a healthcheck

The current repo uses `docker-compose.dev.yml` for this setup.

## 6. Safety Rules

- never use a production database URL locally
- keep `.env` ignored
- keep `.env.example` placeholder-only
- allow local DB reset only by explicit approval
- keep migrations separate from setup approval

## 7. Validation After Setup Later

- `prisma validate`
- optional `prisma migrate dev` only after approval
- package checks

## 8. Human Approval Required

- local DB setup method
- local port choice
- reset policy
- migration approval

## 9. Recommended Next Step

Proceed to Prisma Client strategy and data access layer planning.
