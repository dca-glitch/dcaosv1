import type { WorkflowBriefKnowledgeContextMeta } from "@dca-os-v1/shared";

export function parseWorkflowBriefKnowledgeContextMeta(
  value: unknown
): WorkflowBriefKnowledgeContextMeta | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.used !== "boolean") {
    return null;
  }

  return {
    used: record.used,
    selectedCount: typeof record.selectedCount === "number" ? record.selectedCount : 0,
    selectedItemTitles: Array.isArray(record.selectedItemTitles)
      ? record.selectedItemTitles.filter((entry): entry is string => typeof entry === "string")
      : [],
    skippedReason: typeof record.skippedReason === "string" ? record.skippedReason : null,
    sanitizeFlagCount: typeof record.sanitizeFlagCount === "number" ? record.sanitizeFlagCount : 0,
    trimmed: typeof record.trimmed === "boolean" ? record.trimmed : false
  };
}

export function readPlanJsonKnowledgeContext(planJson: unknown): WorkflowBriefKnowledgeContextMeta | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }

  return parseWorkflowBriefKnowledgeContextMeta((planJson as Record<string, unknown>).knowledgeContext);
}

export function readContentDraftsKnowledgeContext(
  planJson: unknown
): WorkflowBriefKnowledgeContextMeta | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }

  const contentDrafts = (planJson as Record<string, unknown>).contentDrafts;
  if (!contentDrafts || typeof contentDrafts !== "object" || Array.isArray(contentDrafts)) {
    return null;
  }

  return parseWorkflowBriefKnowledgeContextMeta((contentDrafts as Record<string, unknown>).knowledgeContext);
}

type WorkflowBriefKnowledgeUsageSummaryProps = {
  metadata: WorkflowBriefKnowledgeContextMeta;
  workflowType: string;
  className?: string;
};

export function WorkflowBriefKnowledgeUsageSummary({
  metadata,
  workflowType,
  className
}: WorkflowBriefKnowledgeUsageSummaryProps) {
  return (
    <div className={className ? `brief-knowledge-usage ${className}` : "brief-knowledge-usage"}>
      <div className="brief-detail-meta">
        <span className="brief-item-title">Approved knowledge usage</span>
        <span className="brief-detail-caption muted-text">{workflowType}</span>
      </div>
      <p className="muted-text">
        {metadata.used
          ? `Included ${metadata.selectedCount} approved item(s).`
          : "Approved knowledge context was not included."}
      </p>
      {!metadata.used && metadata.skippedReason ? (
        <p className="brief-muted-note muted-text">Skipped: {metadata.skippedReason}</p>
      ) : null}
      {metadata.used && metadata.selectedItemTitles.length > 0 ? (
        <ul className="brief-bullet-list brief-bullet-list--flat">
          {metadata.selectedItemTitles.map((title) => (
            <li className="brief-bullet-list-item" key={title}>
              {title}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="brief-detail-meta">
        <span className="muted-text">Sanitized flags: {metadata.sanitizeFlagCount}</span>
        <span className="muted-text">Trimmed: {metadata.trimmed ? "Yes" : "No"}</span>
      </div>
    </div>
  );
}
