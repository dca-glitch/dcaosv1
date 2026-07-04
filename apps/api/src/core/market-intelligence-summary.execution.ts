/**
 * Deterministic Market Intelligence summary builder.
 * No live provider calls, no crawling — template from admin sources + findings.
 */

export const MI_SUMMARY_INTEGRATION_VERSION = "MI_SUMMARY_V1";
export const MI_SUMMARY_INTEGRATION_KIND = "market_intelligence_summary";
export const MI_SUMMARY_ADMIN_LABEL = "admin_draft_internal";

export type MiSummaryIntegrationContext = {
  version: typeof MI_SUMMARY_INTEGRATION_VERSION;
  kind: typeof MI_SUMMARY_INTEGRATION_KIND;
  label: typeof MI_SUMMARY_ADMIN_LABEL;
  projectId: string;
  clientId: string | null;
  targetMonth: string | null;
  sourceIds: string[];
  findingIds: string[];
  generatedAt: string;
};

export type MiSummarySourceInput = {
  id: string;
  title: string;
  sourceType: string | null;
  sourceNotes: string | null;
};

export type MiSummaryFindingInput = {
  id: string;
  findingCategory: string;
  findingText: string;
  priority: string | null;
};

export type MiSummaryProjectInput = {
  projectId: string;
  clientId: string | null;
  title: string;
  targetMonth: string | null;
  targetClientName: string | null;
  niche: string | null;
  keywords: string | null;
  competitors: string | null;
  productServiceFocus: string | null;
};

function groupFindingsByCategory(findings: MiSummaryFindingInput[]): Map<string, MiSummaryFindingInput[]> {
  const grouped = new Map<string, MiSummaryFindingInput[]>();
  for (const finding of findings) {
    const bucket = grouped.get(finding.findingCategory) ?? [];
    bucket.push(finding);
    grouped.set(finding.findingCategory, bucket);
  }
  return grouped;
}

function formatCategoryLabel(category: string): string {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildDeterministicMarketIntelligenceSummary(input: {
  project: MiSummaryProjectInput;
  sources: MiSummarySourceInput[];
  findings: MiSummaryFindingInput[];
  generatedAtIso?: string;
}): {
  title: string;
  summaryText: string;
  sourceNotes: string;
  integrationContext: MiSummaryIntegrationContext;
} {
  const generatedAt = input.generatedAtIso ?? new Date().toISOString();
  const clientLabel = input.project.targetClientName ?? "Unassigned client";
  const monthLabel = input.project.targetMonth ?? "unspecified month";
  const niche = input.project.niche ?? "general market";
  const keywords = input.project.keywords ?? "no keywords recorded";
  const competitors = input.project.competitors ?? "no competitors recorded";
  const focus = input.project.productServiceFocus ?? "unspecified focus";

  const sourceLines = input.sources.map(
    (source, index) =>
      `${index + 1}. ${source.title}${source.sourceType ? ` [${source.sourceType}]` : ""}${
        source.sourceNotes ? ` — ${source.sourceNotes}` : ""
      }`
  );

  const groupedFindings = groupFindingsByCategory(input.findings);
  const findingSections: string[] = [];
  for (const [category, items] of groupedFindings.entries()) {
    const lines = items.map((item) => {
      const priority = item.priority ? ` (${item.priority})` : "";
      return `- ${item.findingText}${priority}`;
    });
    findingSections.push(`### ${formatCategoryLabel(category)}\n${lines.join("\n")}`);
  }

  const summaryText = [
    `# Market Intelligence Summary (admin draft / internal)`,
    ``,
    `**Project:** ${input.project.title}`,
    `**Client context:** ${clientLabel}`,
    `**Target month:** ${monthLabel}`,
    `**Niche:** ${niche}`,
    `**Product/service focus:** ${focus}`,
    `**Keywords:** ${keywords}`,
    `**Competitors:** ${competitors}`,
    ``,
    `## Curated sources (${input.sources.length})`,
    sourceLines.length > 0 ? sourceLines.join("\n") : "- No active sources recorded.",
    ``,
    `## Admin findings (${input.findings.length})`,
    findingSections.length > 0 ? findingSections.join("\n\n") : "- No active findings recorded.",
    ``,
    `## Deterministic synthesis`,
    `This summary was generated locally from admin-curated sources and findings.`,
    `No live provider or autonomous scraping was used.`,
    `Review and finalize before applying to AI Delivery, SEO, or monthly reporting.`
  ].join("\n");

  const sourceNotes = [
    `Sources: ${input.sources.length}`,
    `Findings: ${input.findings.length}`,
    `Generated: ${generatedAt}`,
    `Mode: deterministic admin draft`
  ].join(" | ");

  const title = `MI Summary — ${input.project.title} — ${monthLabel}`;

  return {
    title,
    summaryText,
    sourceNotes,
    integrationContext: {
      version: MI_SUMMARY_INTEGRATION_VERSION,
      kind: MI_SUMMARY_INTEGRATION_KIND,
      label: MI_SUMMARY_ADMIN_LABEL,
      projectId: input.project.projectId,
      clientId: input.project.clientId,
      targetMonth: input.project.targetMonth,
      sourceIds: input.sources.map((source) => source.id),
      findingIds: input.findings.map((finding) => finding.id),
      generatedAt
    }
  };
}
