# Block 14 Prompt — Dependency Audit Review

## Role

Act as senior dependency and security reviewer under architect supervision.

## Repository

```text
https://github.com/dca-glitch/dcaosv1
```

## Objective

Review npm audit findings and propose or apply only targeted safe fixes.

## Scope

Allowed:

- run npm audit
- inspect dependency paths
- identify direct or transitive source
- propose safe patch or minor updates
- apply isolated updates only if clearly safe
- rerun validation

Not allowed:

- no forced audit repair
- no package manager switch
- no broad dependency replacement
- no major upgrades without separate approval
- no feature work
- no migrations
- no deployment

## Validation Commands

Run after any change:

```text
npm run check
npm run build
npm run -w @dca-os-v1/data prisma:validate
npm run -w @dca-os-v1/data check
npm audit
```

## Required Report

Report:

1. audit findings
2. vulnerability paths
3. affected packages
4. whether fix is safe now or should be postponed
5. files changed
6. validation results
7. remaining risk
8. recommended next block
