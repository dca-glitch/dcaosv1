# DCA OS v1

Initial reusable SaaS foundation for Digital Cube Agency.

This repository is organized as an npm workspace:

- `apps/web`: React + Vite frontend skeleton.
- `apps/api`: Node.js + Express API skeleton.
- `packages/shared`: shared TypeScript contracts and reusable module metadata.
- `packages/data`: Prisma schema foundation and safe validation helpers.

The current foundation intentionally avoids migrations, database connections, seed data, real authentication, deployment logic, and production secrets.

## Safe Validation

```sh
npm run check
npm run build
npm run -w @dca-os-v1/data prisma:validate
npm run -w @dca-os-v1/data check
```

The validation scripts in this initial block only inspect local files and schema text. They do not connect to PostgreSQL or run Prisma generate.
