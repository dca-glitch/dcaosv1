import React, { useMemo, useState } from "react";
import { Alert, Button, LoadingState, Modal, StatusBadge, Tabs } from "../../components/ui";
import { AiDeliveryWorkflowHistoryPanel } from "./AiDeliveryWorkflowHistoryPanel";
import "./ai-delivery-modals.css";
import type {
  AiDeliveryProjectSummary,
  AiDeliveryWorkflowRunFormValues,
  AiDeliveryWorkflowRunSummary,
} from "./AiDeliveryPage";

export type AiRunReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: AiDeliveryProjectSummary | null;
  loading: boolean;
  saving: boolean;
  executingId: string | null;
  error: string | null;
  runs: AiDeliveryWorkflowRunSummary[];
  selectedRunId: string | null;
  form: AiDeliveryWorkflowRunFormValues;
  onFormChange: (next: AiDeliveryWorkflowRunFormValues) => void;
  onSelectRun: (run: AiDeliveryWorkflowRunSummary) => void;
  onClearSelection: () => void;
  onSave: () => void;
  onExecute: (runId: string) => void;
  canSave: boolean;
  statusOptions: string[];
  statusLabels: Record<string, string>;
  statusHelper: string;
  actionGuidance: string;
  formatOptionalDate: (value: string | null | undefined) => string;
  formatPreview: (value: string | null | undefined) => string;
  parseResultPreview: (value: string | null | undefined) => Record<string, unknown> | null;
  canExecuteRun: (status: string | null | undefined) => boolean;
  normalizeStatus: (status: string | null | undefined) => string;
  formatStatusBreakdown: (items: Array<{ status: string }>, emptyLabel: string) => string;
};

type ReviewTab = "overview" | "context" | "raw";

/**
 * Approved AI Run Review layout with smoke-compatible dialog name "Workflow Runs".
 */
export function AiRunReviewModal({
  isOpen,
  onClose,
  project,
  loading,
  saving,
  executingId,
  error,
  runs,
  selectedRunId,
  form,
  onFormChange,
  onSelectRun,
  onClearSelection,
  onSave,
  onExecute,
  canSave,
  statusOptions,
  statusLabels,
  statusHelper,
  actionGuidance,
  formatOptionalDate,
  formatPreview,
  parseResultPreview,
  canExecuteRun,
  normalizeStatus,
  formatStatusBreakdown,
}: AiRunReviewModalProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>("overview");

  const selectedRun = useMemo(
    () => (selectedRunId ? runs.find((run) => run.id === selectedRunId) ?? null : null),
    [runs, selectedRunId],
  );

  const resultPreview = useMemo(
    () => parseResultPreview(selectedRun?.resultPlaceholder) as {
      gateway?: string;
      model?: string;
      outputType?: string;
      summary?: string;
      safeError?: string;
    } | null,
    [parseResultPreview, selectedRun?.resultPlaceholder],
  );

  const headerBadgeStatus = selectedRun?.status ?? "DRAFT";
  const isError = normalizeStatus(selectedRun?.status) === "FAILED" || Boolean(selectedRun?.executionError);

  if (!isOpen) {
    return null;
  }

  const footer = (
    <div className="ai-delivery-modal-actions">
      <Button disabled={saving || Boolean(executingId)} onClick={onClose} type="button" variant="tertiary">
        Close
      </Button>
      <Button
        disabled={saving || Boolean(executingId) || !canSave}
        onClick={onSave}
        type="button"
        variant="primary"
      >
        {saving ? "Saving…" : selectedRunId ? "Save workflow run" : "Create workflow run"}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} footer={footer} onClose={onClose} size="lg" title="Workflow Runs">
      <div className="ai-run-review-modal ai-delivery-lane-modal stack gap-md">
        <div className="ai-run-review-modal__header-meta">
          <p className="ai-run-review-modal__eyebrow muted-text m-0">AI Run Review</p>
          {selectedRun ? <StatusBadge status={headerBadgeStatus} /> : null}
        </div>

        <Tabs
          onChange={(value) => setActiveTab(value as ReviewTab)}
          options={[
            { value: "overview", label: "Overview" },
            { value: "context", label: "Context & Logs" },
            { value: "raw", label: "Raw Output" },
          ]}
          value={activeTab}
        />

        {loading ? <LoadingState label="Loading workflow runs" /> : !project ? (
          <p>Project not found.</p>
        ) : (
          <>
            {error ? <Alert message={error} title="Workflow run action blocked" variant="danger" /> : null}

            {activeTab === "overview" ? (
              <div aria-label="Overview" className="stack gap-md" role="tabpanel">
                <p className="muted-text text-sm m-0">{actionGuidance}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <section className="field-panel ai-delivery-section-compact">
                    <h3 className="text-sm font-semibold m-0 mb-2">Run details</h3>
                    <dl className="brief-grid">
                      <div>
                        <dt>Client</dt>
                        <dd>{project.client?.name ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Project</dt>
                        <dd className="font-mono text-xs">{project.project?.name ?? project.name}</dd>
                      </div>
                      <div>
                        <dt>Workflow type</dt>
                        <dd>AI Delivery workflow run</dd>
                      </div>
                      <div>
                        <dt>Deliverable</dt>
                        <dd>{project.name}</dd>
                      </div>
                      <div>
                        <dt>Model</dt>
                        <dd className="font-mono text-xs">{resultPreview?.model || "Not recorded"}</dd>
                      </div>
                      <div>
                        <dt>Executed</dt>
                        <dd className="font-mono text-xs">
                          {formatOptionalDate(selectedRun?.finishedAt ?? selectedRun?.startedAt ?? selectedRun?.createdAt)}
                        </dd>
                      </div>
                    </dl>
                  </section>
                  <section className="field-panel ai-delivery-section-compact">
                    <h3 className="text-sm font-semibold m-0 mb-2">Result summary</h3>
                    {isError ? (
                      <Alert
                        message={formatPreview(selectedRun?.executionError || resultPreview?.safeError)}
                        title="Run ended with an error"
                        variant="danger"
                      />
                    ) : (
                      <p className="text-sm text-text-secondary m-0">
                        {resultPreview?.summary || formatPreview(selectedRun?.resultPlaceholder)}
                      </p>
                    )}
                  </section>
                </div>

                <label className="field-span-2">
                  <span>Admin notes</span>
                  <textarea
                    aria-label="Admin notes"
                    maxLength={4000}
                    onChange={(event) => onFormChange({ ...form, adminNotes: event.target.value })}
                    placeholder="Workflow inputs, admin context, blockers, or review notes"
                    rows={4}
                    value={form.adminNotes}
                  />
                </label>

                <section className="field-panel ai-delivery-section-compact">
                  <h3 className="text-sm font-semibold m-0 mb-2">Workflow run editor</h3>
                  <div className="field-grid">
                    <label>
                      Status — Required
                      <select
                        onChange={(event) => onFormChange({ ...form, status: event.target.value })}
                        value={form.status}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status] ?? status}
                          </option>
                        ))}
                      </select>
                      <span className="muted-text">{statusHelper}</span>
                    </label>
                    <label className="field-span-2">
                      Output / result summary — Optional
                      <textarea
                        maxLength={4000}
                        onChange={(event) => onFormChange({ ...form, resultPlaceholder: event.target.value })}
                        placeholder="Summary of output, result, or next handoff step"
                        rows={3}
                        value={form.resultPlaceholder}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      disabled={saving || Boolean(executingId)}
                      onClick={onClearSelection}
                      type="button"
                      variant="tertiary"
                    >
                      New workflow run
                    </Button>
                  </div>
                </section>

                <section className="field-panel ai-delivery-section-compact">
                  <h3 className="text-sm font-semibold m-0 mb-2">Existing workflow runs</h3>
                  <p className="muted-text text-xs m-0 mb-2">{runs.length} run(s) in this project</p>
                  {runs.length === 0 ? (
                    <p className="muted-text">No workflow runs yet.</p>
                  ) : (
                    <div className="stack gap-sm">
                      {runs.map((run) => {
                        const preview = parseResultPreview(run.resultPlaceholder) as {
                          gateway?: string;
                          summary?: string;
                          safeError?: string;
                          outputType?: string;
                        } | null;
                        const isSelected = selectedRun?.id === run.id;
                        return (
                          <article className={`entity-card${isSelected ? " is-selected" : ""}`} key={run.id}>
                            <div className="entity-card-header">
                              <div>
                                <StatusBadge status={run.status} />
                                <h4 className="m-0 text-sm">Workflow run</h4>
                                <p className="muted-text text-xs m-0">
                                  {preview?.outputType ? `${preview.outputType} · ` : ""}
                                  Created {formatOptionalDate(run.createdAt)}
                                </p>
                              </div>
                              <div className="card-actions">
                                <Button
                                  aria-label={`Review workflow run ${statusLabels[normalizeStatus(run.status)] ?? run.status} from ${formatOptionalDate(run.createdAt)}`}
                                  disabled={saving || Boolean(executingId)}
                                  onClick={() => onSelectRun(run)}
                                  type="button"
                                  variant="tertiary"
                                >
                                  Review
                                </Button>
                                {canExecuteRun(run.status) ? (
                                  <Button
                                    aria-label={`Execute workflow run ${statusLabels[normalizeStatus(run.status)] ?? run.status} from ${formatOptionalDate(run.createdAt)}`}
                                    disabled={saving || Boolean(executingId)}
                                    onClick={() => onExecute(run.id)}
                                    type="button"
                                    variant="primary"
                                  >
                                    {executingId === run.id ? "Running" : "Execute"}
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                            <dl className="brief-grid">
                              <div>
                                <dt>Gateway</dt>
                                <dd>{preview?.gateway ?? "Not recorded"}</dd>
                              </div>
                              <div className="field-span-2">
                                <dt>Result placeholder preview</dt>
                                <dd>{preview?.summary || formatPreview(run.resultPlaceholder)}</dd>
                              </div>
                              <div className="field-span-2">
                                <dt>Execution log</dt>
                                <dd>{formatPreview(run.executionLog)}</dd>
                              </div>
                              <div className="field-span-2">
                                <dt>Execution error</dt>
                                <dd>{formatPreview(run.executionError || preview?.safeError)}</dd>
                              </div>
                            </dl>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {activeTab === "context" ? (
              <div aria-label="Context & Logs" className="stack gap-md" role="tabpanel">
                <section className="field-panel ai-delivery-section-compact">
                  <h3 className="text-sm font-semibold m-0 mb-2">Execution visibility</h3>
                  <dl className="brief-grid">
                    <div>
                      <dt>Runs in focus</dt>
                      <dd>{runs.length}</dd>
                    </div>
                    <div>
                      <dt>Status mix</dt>
                      <dd>{formatStatusBreakdown(runs, "No workflow runs in focus yet")}</dd>
                    </div>
                    <div>
                      <dt>Latest update</dt>
                      <dd>{formatOptionalDate(selectedRun?.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt>Gateway</dt>
                      <dd>{resultPreview?.gateway ?? "Not recorded"}</dd>
                    </div>
                  </dl>
                </section>
                <section className="field-panel ai-delivery-section-compact">
                  <h3 className="text-sm font-semibold m-0 mb-2">Workflow history</h3>
                  <AiDeliveryWorkflowHistoryPanel
                    compact
                    formatOptionalDate={formatOptionalDate}
                    formatPreview={formatPreview}
                    normalizeStatus={normalizeStatus}
                    onOpenRun={onSelectRun}
                    runs={runs}
                    statusLabels={statusLabels}
                  />
                </section>
                <section className="field-panel ai-delivery-section-compact">
                  <h3 className="text-sm font-semibold m-0 mb-2">Execution log</h3>
                  <pre className="ai-run-review-log font-mono text-xs whitespace-pre-wrap">
                    {formatPreview(selectedRun?.executionLog)}
                  </pre>
                </section>
              </div>
            ) : null}

            {activeTab === "raw" ? (
              <section aria-label="Raw Output" className="field-panel ai-delivery-section-compact" role="tabpanel">
                <h3 className="text-sm font-semibold m-0 mb-2">Raw output</h3>
                <pre className="ai-run-review-log font-mono text-xs whitespace-pre-wrap">
                  {formatPreview(selectedRun?.resultPlaceholder)}
                </pre>
              </section>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
