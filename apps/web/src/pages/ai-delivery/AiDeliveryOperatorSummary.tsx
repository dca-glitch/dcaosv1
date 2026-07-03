import React from "react";
import { MetricCard, SectionPanel } from "../../components/ui";

export type AiDeliveryOperatorSummaryProps = {
  projectsLength: number;
  activeProjectCount: number;
  archivedProjectCount: number;
  projectBriefCountsAvailable: number;
  projectBriefCountsPending: number;
  workflowRunsValue: number | "—";
  workflowRunsHelper: string;
  deliverablesValue: number | "—";
  deliverablesHelper: string;
};

export function AiDeliveryOperatorSummary({
  projectsLength,
  activeProjectCount,
  archivedProjectCount,
  projectBriefCountsAvailable,
  projectBriefCountsPending,
  workflowRunsValue,
  workflowRunsHelper,
  deliverablesValue,
  deliverablesHelper
}: AiDeliveryOperatorSummaryProps) {
  return (
    <SectionPanel tone="compact" title="Operator summary" description="Collapsed by default — expand for tenant-level workflow context.">
      <details className="operator-summary-details">
        <summary className="operator-summary-summary">Show operator metrics</summary>
        <div className="summary-grid metric-grid operator-summary-metrics" aria-label="AI Delivery operator summary">
          <MetricCard
            accent="cyan"
            label="AI Delivery projects"
            value={projectsLength}
            helper={`Active ${activeProjectCount} · Archived ${archivedProjectCount}`}
          />
          <MetricCard
            accent="violet"
            label="Project briefs"
            value={projectBriefCountsAvailable}
            helper={`Available ${projectBriefCountsAvailable} · Pending ${projectBriefCountsPending}`}
          />
          <MetricCard
            accent="purple"
            label="Workflow runs"
            value={workflowRunsValue}
            helper={workflowRunsHelper}
          />
          <MetricCard
            accent="success"
            label="Deliverables"
            value={deliverablesValue}
            helper={deliverablesHelper}
          />
        </div>
      </details>
    </SectionPanel>
  );
}
