/**
 * Nested hash routes for AI Delivery workflow pages.
 * Hub: `#/ai-delivery`
 * Create: `#/ai-delivery/new`
 * Panel: `#/ai-delivery/p/{projectId}/{panel}`
 */

export type AiDeliveryWorkspacePanel =
  | "hub"
  | "new"
  | "edit"
  | "brief"
  | "content-plan"
  | "research"
  | "content-drafts"
  | "deliverables"
  | "article-images"
  | "workflow-runs"
  | "monthly-report"
  | "knowledge"
  | "mi-context";

export type AiDeliveryWorkspaceRoute = {
  projectId: string | null;
  panel: AiDeliveryWorkspacePanel;
};

const PROJECT_PANELS = new Set<AiDeliveryWorkspacePanel>([
  "edit",
  "brief",
  "content-plan",
  "research",
  "content-drafts",
  "deliverables",
  "article-images",
  "workflow-runs",
  "monthly-report",
  "knowledge",
  "mi-context"
]);

export function parseAiDeliveryWorkspaceHash(hash: string): AiDeliveryWorkspaceRoute {
  const value = hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  if (!value || value === "ai-delivery") {
    return { projectId: null, panel: "hub" };
  }
  if (value === "ai-delivery/new") {
    return { projectId: null, panel: "new" };
  }
  const match = /^ai-delivery\/p\/([^/]+)\/([^/]+)$/.exec(value);
  if (match) {
    const projectId = decodeURIComponent(match[1] ?? "");
    const panel = match[2] as AiDeliveryWorkspacePanel;
    if (projectId && PROJECT_PANELS.has(panel)) {
      return { projectId, panel };
    }
  }
  if (value.startsWith("ai-delivery/")) {
    return { projectId: null, panel: "hub" };
  }
  return { projectId: null, panel: "hub" };
}

export function buildAiDeliveryWorkspaceHash(
  projectId: string | null,
  panel: AiDeliveryWorkspacePanel
): string {
  if (panel === "hub") {
    return "#/ai-delivery";
  }
  if (panel === "new") {
    return "#/ai-delivery/new";
  }
  if (!projectId) {
    return "#/ai-delivery";
  }
  return `#/ai-delivery/p/${encodeURIComponent(projectId)}/${panel}`;
}

export function isAiDeliveryWorkspaceHash(hash: string): boolean {
  const value = hash.replace(/^#\/?/, "");
  return value === "ai-delivery" || value.startsWith("ai-delivery/");
}
