# Architecture

## Product

DCA OS v1 is a modular SaaS operating system for Digital Cube Agency.

It is designed as a reusable platform foundation for future internal tools, client-facing portals, dashboards, automations, finance modules, SEO modules, AI modules, and reporting modules.

## Architecture Layers

1. Core platform
2. Authentication and session layer
3. Tenant and company layer
4. Role and permission layer
5. Module registry and entitlement layer
6. Settings layer
7. Audit and activity layer
8. Reusable module framework
9. Business modules
10. AI and automation modules

## Workspace Layout

apps/api contains the backend API.
apps/web contains the frontend app.
packages/shared contains shared TypeScript contracts.
packages/data contains Prisma schema and database-related tooling.

## Backend Direction

The API is organized around a versioned boundary. The current boundary is /api/v1.

Backend modules should follow this pattern:

- route
- controller
- service
- shared contract
- validation layer later
- repository/data layer later

The API should return consistent response shapes and use central error handling.

## Frontend Direction

The frontend is a React and Vite application.

Frontend modules should follow reusable page patterns:

- module shell
- list page
- detail page
- form page
- dashboard card
- loading state
- empty state
- error state

## Shared Package Direction

The shared package is the contract boundary between frontend and backend.

It should include:

- API response contracts
- module contracts
- navigation contracts
- permission keys
- dashboard card contracts
- CRUD/list/detail/form contracts

## Data Package Direction

The data package owns Prisma schema and database tooling.

It should not become a dumping ground for business logic. Business rules belong in API services or dedicated domain modules.

## Module System Direction

Every feature should be treated as a module with metadata.

A module may define:

- key
- name
- description
- routes
- navigation entries
- permissions
- dashboard cards
- entitlement requirements

## Future Runtime Flow

A request should eventually resolve:

1. user session
2. tenant context
3. tenant membership
4. role assignments
5. permission grants
6. module entitlement
7. requested operation

## Design Principle

Build reusable platform foundations first. Add business modules only after platform gates are stable.
