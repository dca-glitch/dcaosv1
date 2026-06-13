# Database Release Gate

## Purpose

The database release gate defines when database implementation can begin.

## Required Conditions

- PostgreSQL setup plan exists
- Prisma Client strategy is approved
- database access layer plan exists
- schema reviewed
- environment placeholders planned
- migration rollback notes prepared

## Not Allowed Before Gate

- migration execution
- db push
- seed execution
- app database writes
- production database connection

## Exit Output

A database gate review should produce:

- approved local database setup
- approved Prisma Client strategy
- approved first migration command
- validation plan
- rollback plan

## Rule

Database changes must be isolated in their own block.
