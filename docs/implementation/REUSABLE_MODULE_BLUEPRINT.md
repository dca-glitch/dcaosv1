# Reusable Module Blueprint

## Purpose

This blueprint describes the default structure for future modules.

## Required Pieces

- module metadata
- shared contracts
- API route
- controller
- service
- frontend page
- dashboard card later
- permission keys later

## Suggested Backend Files

- module.routes.ts
- module.controller.ts
- module.service.ts
- module.repository.ts later

## Suggested Frontend Files

- ModulePage.tsx
- ModuleList.tsx later
- ModuleDetail.tsx later
- ModuleForm.tsx later

## Suggested Shared Files

- module.contracts.ts
- module.types.ts
- module.permissions.ts later

## Validation

Every module should pass workspace validation before commit.

## Rule

Create reusable module structure before adding custom business complexity.
