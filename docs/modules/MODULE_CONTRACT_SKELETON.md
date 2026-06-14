# Module Contract Skeleton

## Metadata

Every module registry entry must define:

- `key`: stable URL-safe module key.
- `name`: display name.
- `description`: short user-facing description.
- `status`: `internal`, `active`, or `planned`.
- `version`: module contract version.

Tenant-specific enablement is not stored in the shared metadata. It is resolved by the backend module registry for the active tenant.

## Optional Contract Fields

- `routes`: future route placeholders for module screens.
- `navigation`: future navigation entries.
- `permissions`: future module permission declarations.
- `dashboardCards`: future dashboard cards.
- `crud`: optional reusable CRUD contract when a module graduates beyond placeholder status.

## Current Placeholder Behavior

- `core` is the internal platform registry entry.
- `user-settings` is an active placeholder for user settings.
- `finance-lite` is a planned placeholder only.
- Opening a module card in the frontend shows a safe placeholder panel.
- Enabling or disabling a module only changes tenant module enablement state; it does not mount runtime code.

## Explicit Non-Goals

- No marketplace.
- No billing.
- No dynamic plugin loading.
- No module package loader.
- No Finance Lite migration.
