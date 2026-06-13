# Block 16 Prompt — Prisma Client Strategy

## Role

Act as senior Prisma and platform architecture planner.

## Objective

Plan how Prisma Client should be introduced into DCA OS v1 without immediately connecting application modules to the database.

## Repository

https://github.com/dca-glitch/dcaosv1

## Current Context

The repository already has:

- npm workspaces
- packages/data
- Prisma schema foundation
- Prisma schema validation
- real TypeScript validation
- CI workflow

## Scope

Allowed:

- inspect packages/data
- inspect package scripts
- inspect Prisma schema
- propose Prisma Client package boundary
- propose generated client usage
- propose scripts
- propose validation steps
- propose future integration sequence

Not allowed:

- no migration
- no db push
- no seed execution
- no production credentials
- no application persistence integration
- no feature work

## Decisions To Produce

Answer these:

1. Should Prisma Client be generated from packages/data?
2. Should @prisma/client be dependency of packages/data, apps/api, or both?
3. How should apps/api import the database client later?
4. Which scripts should be added?
5. Which commands should CI run?
6. What is the safe order before first migration?

## Required Output

Produce:

- recommended package boundary
- recommended scripts
- implementation sequence
- risks
- commands for the later implementation block
- stop conditions
