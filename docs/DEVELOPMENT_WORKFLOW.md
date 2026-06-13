# Development Workflow

This repository is foundation-only for now.

Approved local commands:

```sh
npm.cmd run check
npm.cmd run build
npm.cmd run -w @dca-os-v1/data prisma:validate
npm.cmd run -w @dca-os-v1/data check
```

Recommended sequence:

1. Make focused changes.
2. Run `npm.cmd run check`.
3. Run `npm.cmd run build`.
4. Run Prisma validation from `packages/data`.
5. Review `git status --short --branch` and `git diff --check`.

Forbidden for this phase:

* migrations
* `db push`
* database connections
* auth implementation
* deployment
* commits unless explicitly approved
* pushes unless explicitly approved
