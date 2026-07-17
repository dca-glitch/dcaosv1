/**
 * Nested hash routes for list→editor surfaces (Clients, Projects, Tasks, Finance, …).
 * Hub: `#/{base}`
 * Create: `#/{base}/new`
 * Edit: `#/{base}/e/{id}/edit`
 */

export type EntityEditorRoute =
  | { kind: "hub" }
  | { kind: "new" }
  | { kind: "edit"; id: string };

function stripHash(hash: string): string {
  return hash.replace(/^#\/?/, "").replace(/\/+$/, "").split("?")[0] ?? "";
}

export function parseEntityEditorHash(hash: string, base: string): EntityEditorRoute {
  const value = stripHash(hash);
  if (!value || value === base) {
    return { kind: "hub" };
  }
  if (value === `${base}/new`) {
    return { kind: "new" };
  }
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^${escaped}\\/e\\/([^/]+)\\/edit$`).exec(value);
  if (match?.[1]) {
    return { kind: "edit", id: decodeURIComponent(match[1]) };
  }
  if (value.startsWith(`${base}/`)) {
    return { kind: "hub" };
  }
  return { kind: "hub" };
}

export function buildEntityEditorHash(base: string, route: EntityEditorRoute): string {
  if (route.kind === "hub") {
    return `#/${base}`;
  }
  if (route.kind === "new") {
    return `#/${base}/new`;
  }
  return `#/${base}/e/${encodeURIComponent(route.id)}/edit`;
}

export function isEntityEditorHash(hash: string, base: string): boolean {
  const value = stripHash(hash);
  return value === base || value.startsWith(`${base}/`);
}
