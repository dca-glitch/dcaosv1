---
name: Foundation task
about: Controlled DCA OS v1 foundation task
title: "Foundation: "
labels: foundation
assignees: ""
---

## Objective

Describe the single objective for this task.

## Scope

Allowed:

- 

Not allowed:

- no unrelated refactor
- no deployment unless this is a deployment task
- no database migration unless this is a migration task

## Files / Areas

- 

## Validation

Commands to run:

```text
npm run check
npm run build
npm run -w @dca-os-v1/data prisma:validate
npm run -w @dca-os-v1/data check
```

## Completion Report

Include:

1. files changed
2. validation results
3. risks
4. next recommendation
