# Block 15 Prompt — Local PostgreSQL Planning

## Role

Act as senior database/platform implementation planner.

## Objective

Prepare local PostgreSQL planning for DCA OS v1 without running migrations or connecting the app to a database.

## Scope

Allowed:

- inspect current Prisma schema
- propose Docker Compose structure
- propose database names
- propose database user names
- propose shadow database setup
- propose environment variable names
- create `.env.example` with placeholders only if approved by the task
- create Docker Compose files only if explicitly requested inside the task

Not allowed:

- no migrations
- no db push
- no seed files
- no app database connection
- no production credentials
- no deployment

## Expected Planning Output

Include:

- PostgreSQL version
- local port
- app database name
- shadow database name
- local username
- local password placeholder
- env variable names
- validation commands
- rollback/removal commands

## Required Report

Report:

1. files inspected
2. proposed database setup
3. proposed files
4. commands to run later
5. risks
6. next block recommendation
