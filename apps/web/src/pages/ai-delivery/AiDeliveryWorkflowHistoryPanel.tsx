import React from "react";
import { Button, StatusBadge } from "../../components/ui";
import type { AiDeliveryWorkflowRunSummary } from "./AiDeliveryPage";
import { AiDeliveryInlineEmpty } from "./ai-delivery-shared-ui";

export type AiDeliveryWorkflowHistoryPanelProps = {
  runs: AiDeliveryWorkflowRunSummary[];
  formatOptionalDate: (value: string | null | undefined) => string;
  formatPreview: (value: string | null | undefined) => string;
  statusLabels: Record<string, string>;
  normalizeStatus: (status: string | null | undefined) => string;
  onOpenRun?: (run: AiDeliveryWorkflowRunSummary) => void;
  compact?: boolean;
};

export function AiDeliveryWorkflowHistoryPanel({
  runs,
  formatOptionalDate,
  formatPreview,
  statusLabels,
  normalizeStatus,
  onOpenRun,
  compact = false,
}: AiDeliveryWorkflowHistoryPanelProps) {
  const ordered = [...runs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  if (ordered.length === 0) {
    return <AiDeliveryInlineEmpty>No workflow runs recorded yet. Create a workflow run to start.</AiDeliveryInlineEmpty>;
  }

  return (
    <ol className="ai-delivery-workflow-history" aria-label="Workflow run history">
      {ordered.map((run) => (
        <li className="ai-delivery-workflow-history__item" key={run.id}>
          <span aria-hidden="true" className="ai-delivery-workflow-history__dot" />
          <div className="ai-delivery-workflow-history__body">
            <div className="ai-delivery-workflow-history__header">
              <StatusBadge status={run.status} />
              <span className="ai-delivery-workflow-history__status">
                {statusLabels[normalizeStatus(run.status)] ?? run.status}
              </span>
              <time className="ai-delivery-workflow-history__time" dateTime={run.updatedAt}>
                {formatOptionalDate(run.updatedAt)}
              </time>
            </div>
            {!compact ? (
              <p className="ai-delivery-workflow-history__meta muted-text text-xs">
                {run.executionError
                  ? `Error: ${formatPreview(run.executionError)}`
                  : formatPreview(run.resultPlaceholder)}
              </p>
            ) : null}
            {onOpenRun ? (
              <Button
                aria-label={`Review run ${statusLabels[normalizeStatus(run.status)] ?? run.status} from ${formatOptionalDate(run.updatedAt)}`}
                onClick={() => onOpenRun(run)}
                type="button"
                variant="tertiary"
              >
                Review run
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
