import React from "react";
import { Button, Input, Modal, Select, StatusBadge, Textarea } from "../../components/ui";
import {
  AiDeliveryInlineAlert,
  AiDeliveryInlineEmpty,
  AiDeliveryInlineLoading,
} from "./ai-delivery-shared-ui";
import "./ai-delivery-modals.css";
import type {
  AiDeliveryProjectSummary,
  AiDeliveryResearchRequestFormValues,
  AiDeliveryResearchRequestSummary,
  AiDeliveryResearchSourceFormValues,
  AiDeliveryResearchSourceSummary,
  AiDeliveryResearchSummaryFormValues,
  AiDeliveryResearchSummarySummary,
  AiDeliveryWorkflowRunSummary,
} from "./AiDeliveryPage";

export type AiDeliveryResearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: AiDeliveryProjectSummary | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  researchRequests: AiDeliveryResearchRequestSummary[];
  researchSummaries: AiDeliveryResearchSummarySummary[];
  researchSources: AiDeliveryResearchSourceSummary[];
  researchWorkflowRuns: AiDeliveryWorkflowRunSummary[];
  requestForm: AiDeliveryResearchRequestFormValues;
  onRequestFormChange: React.Dispatch<React.SetStateAction<AiDeliveryResearchRequestFormValues>>;
  requestEditorId: string | null;
  summaryForm: AiDeliveryResearchSummaryFormValues;
  onSummaryFormChange: React.Dispatch<React.SetStateAction<AiDeliveryResearchSummaryFormValues>>;
  summaryEditorId: string | null;
  sourceForm: AiDeliveryResearchSourceFormValues;
  onSourceFormChange: React.Dispatch<React.SetStateAction<AiDeliveryResearchSourceFormValues>>;
  sourceEditorId: string | null;
  formatEnumLabel: (value?: string | null) => string;
  formatOptionalDate: (value?: string | null) => string;
  formatPreview: (value?: string | null) => string;
  onNewRequest: () => void;
  onSaveRequest: (projectId: string) => void;
  onEditRequest: (request: AiDeliveryResearchRequestSummary) => void;
  onNewSummary: () => void;
  onSaveSummary: (projectId: string) => void;
  onEditSummary: (summary: AiDeliveryResearchSummarySummary) => void;
  onFinalizeSummary: (projectId: string, summary: AiDeliveryResearchSummarySummary) => void;
  onArchiveSummary: (projectId: string, summary: AiDeliveryResearchSummarySummary) => void;
  onApplySummaryToBrief: (projectId: string, summaryId: string) => void;
  onNewSource: () => void;
  onSaveSource: (projectId: string) => void;
  onEditSource: (source: AiDeliveryResearchSourceSummary) => void;
  onApproveSource: (projectId: string, source: AiDeliveryResearchSourceSummary) => void;
  onRejectSource: (projectId: string, source: AiDeliveryResearchSourceSummary) => void;
  onArchiveSource: (projectId: string, source: AiDeliveryResearchSourceSummary) => void;
};

const RESEARCH_REQUEST_STATUSES = ["DRAFT", "READY", "IN_REVIEW", "COMPLETED", "ARCHIVED"] as const;
const RESEARCH_SUMMARY_STATUSES = ["DRAFT", "IN_REVIEW", "FINALIZED", "ARCHIVED"] as const;
const RESEARCH_SOURCE_STATUSES = ["PROPOSED", "APPROVED", "REJECTED", "ARCHIVED"] as const;
const RESEARCH_SOURCE_TYPES = ["WEBSITE", "DOCUMENT", "OTHER"] as const;

/**
 * P4K Research / Sources modal.
 * Accessible dialog name: "Research / Sources" (smoke-compatible).
 * Apply-to-brief and all fetch/save handlers remain on the page via callbacks.
 */
export function AiDeliveryResearchModal({
  isOpen,
  onClose,
  project,
  loading,
  saving,
  error,
  researchRequests,
  researchSummaries,
  researchSources,
  researchWorkflowRuns,
  requestForm,
  onRequestFormChange,
  requestEditorId,
  summaryForm,
  onSummaryFormChange,
  summaryEditorId,
  sourceForm,
  onSourceFormChange,
  sourceEditorId,
  formatEnumLabel,
  formatOptionalDate,
  formatPreview,
  onNewRequest,
  onSaveRequest,
  onEditRequest,
  onNewSummary,
  onSaveSummary,
  onEditSummary,
  onFinalizeSummary,
  onArchiveSummary,
  onApplySummaryToBrief,
  onNewSource,
  onSaveSource,
  onEditSource,
  onApproveSource,
  onRejectSource,
  onArchiveSource,
}: AiDeliveryResearchModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Research / Sources">
      {loading ? (
        <AiDeliveryInlineLoading label="Loading research requests and sources" />
      ) : project ? (
        <div className="ai-delivery-modal-panel ai-delivery-lane-modal ai-delivery-research-editor stack gap-md">
          {error ? <AiDeliveryInlineAlert message={error} title="Research action blocked" /> : null}
          <section className="field-panel ai-delivery-section-compact">
            <h3>Research request editor</h3>
            <div className="field-grid">
              <Select
                fullWidth
                label="Status - Required"
                onChange={(event) => onRequestFormChange((current) => ({ ...current, status: event.target.value }))}
                options={RESEARCH_REQUEST_STATUSES.map((status) => ({
                  value: status,
                  label: formatEnumLabel(status),
                }))}
                value={requestForm.status}
              />
              <Select
                fullWidth
                label="Linked workflow run - Optional"
                onChange={(event) =>
                  onRequestFormChange((current) => ({ ...current, workflowRunId: event.target.value || null }))
                }
                options={[
                  { value: "", label: "Manual / unlinked request" },
                  ...researchWorkflowRuns.map((run) => ({
                    value: run.id,
                    label: `Workflow run - ${formatEnumLabel(run.status)}`,
                  })),
                ]}
                value={requestForm.workflowRunId ?? ""}
              />
              <Input
                className="field-span-2"
                fullWidth
                label="Title - Required"
                maxLength={255}
                onChange={(event) => onRequestFormChange((current) => ({ ...current, title: event.target.value }))}
                placeholder="Competitor review, source gathering, keyword gap, audience research"
                value={requestForm.title}
              />
              <Input
                fullWidth
                label="Request type / topic - Optional"
                maxLength={255}
                onChange={(event) =>
                  onRequestFormChange((current) => ({ ...current, requestType: event.target.value }))
                }
                placeholder="Competitors, sources, SERP notes, local intent"
                value={requestForm.requestType}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                helperText="Admin-only. No external fetching runs here."
                label="Description / notes - Optional"
                maxLength={4000}
                onChange={(event) =>
                  onRequestFormChange((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="What should be reviewed, what to collect manually, and what the source list should prove"
                rows={4}
                value={requestForm.description}
              />
            </div>
            <div className="modal-footer ai-delivery-modal-footer">
              <Button disabled={saving} onClick={onClose} type="button" variant="tertiary">
                Close
              </Button>
              <Button disabled={saving} onClick={onNewRequest} type="button" variant="tertiary">
                New request
              </Button>
              <Button
                disabled={saving || !requestForm.title.trim()}
                onClick={() => void onSaveRequest(project.id)}
                type="button"
                variant="primary"
              >
                {saving ? "Saving" : requestEditorId ? "Save request" : "Create request"}
              </Button>
            </div>
          </section>

          <section className="field-panel ai-delivery-section-compact">
            <h3>Existing research requests</h3>
            {researchRequests.length === 0 ? (
              <AiDeliveryInlineEmpty>No research requests yet. Add a research request to get started.</AiDeliveryInlineEmpty>
            ) : null}
            {researchRequests.map((request) => (
              <article className="entity-card" key={request.id}>
                <div className="entity-card-header">
                  <div>
                    <StatusBadge status={request.status} />
                    <h3>{request.title}</h3>
                    <p>Updated {formatOptionalDate(request.updatedAt)}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="ghost-action"
                      disabled={saving}
                      onClick={() => onEditRequest(request)}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>{formatEnumLabel(request.status)}</dd>
                  </div>
                  <div>
                    <dt>Linked workflow</dt>
                    <dd>{request.workflowRun ? formatEnumLabel(request.workflowRun.status) : "Manual / none"}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>{request.requestType ?? "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatOptionalDate(request.createdAt)}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Description</dt>
                    <dd>{formatPreview(request.description)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>

          <section className="field-panel ai-delivery-section-compact">
            <h3>Research summary editor</h3>
            <div className="field-grid">
              <Select
                fullWidth
                label="Status - Required"
                onChange={(event) => onSummaryFormChange((current) => ({ ...current, status: event.target.value }))}
                options={RESEARCH_SUMMARY_STATUSES.map((status) => ({
                  value: status,
                  label: formatEnumLabel(status),
                }))}
                value={summaryForm.status}
              />
              <Select
                fullWidth
                label="Linked workflow run - Optional"
                onChange={(event) =>
                  onSummaryFormChange((current) => ({ ...current, workflowRunId: event.target.value || null }))
                }
                options={[
                  { value: "", label: "Manual / unlinked summary" },
                  ...researchWorkflowRuns.map((run) => ({
                    value: run.id,
                    label: `Workflow run - ${formatEnumLabel(run.status)}`,
                  })),
                ]}
                value={summaryForm.workflowRunId ?? ""}
              />
              <Input
                className="field-span-2"
                fullWidth
                label="Title - Required"
                maxLength={255}
                onChange={(event) => onSummaryFormChange((current) => ({ ...current, title: event.target.value }))}
                placeholder="SEO findings summary for brief revision and content planning"
                value={summaryForm.title}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                label="Summary - Required"
                maxLength={4000}
                onChange={(event) =>
                  onSummaryFormChange((current) => ({ ...current, summaryText: event.target.value }))
                }
                placeholder="Summarize the research findings, business context, and what should influence planning next"
                rows={5}
                value={summaryForm.summaryText}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                label="Key findings - Optional"
                maxLength={4000}
                onChange={(event) =>
                  onSummaryFormChange((current) => ({ ...current, keyFindings: event.target.value }))
                }
                placeholder="Top findings the admin team wants to preserve from the manual research review"
                rows={3}
                value={summaryForm.keyFindings}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                label="Audience insights - Optional"
                maxLength={4000}
                onChange={(event) =>
                  onSummaryFormChange((current) => ({ ...current, audienceInsights: event.target.value }))
                }
                placeholder="Audience problems, intent signals, and messaging cues discovered during research"
                rows={3}
                value={summaryForm.audienceInsights}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                label="Competitor insights - Optional"
                maxLength={4000}
                onChange={(event) =>
                  onSummaryFormChange((current) => ({ ...current, competitorInsights: event.target.value }))
                }
                placeholder="Competitor positioning, gaps, and useful benchmark observations"
                rows={3}
                value={summaryForm.competitorInsights}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                label="Keyword opportunities - Optional"
                maxLength={4000}
                onChange={(event) =>
                  onSummaryFormChange((current) => ({ ...current, keywordOpportunities: event.target.value }))
                }
                placeholder="Search themes, target keyword opportunities, and promising topic clusters"
                rows={3}
                value={summaryForm.keywordOpportunities}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                label="Content recommendations - Optional"
                maxLength={4000}
                onChange={(event) =>
                  onSummaryFormChange((current) => ({ ...current, contentRecommendations: event.target.value }))
                }
                placeholder="Recommended content directions, angles, and deliverable ideas for later planning"
                rows={3}
                value={summaryForm.contentRecommendations}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                label="Brief revision notes - Optional"
                maxLength={4000}
                onChange={(event) =>
                  onSummaryFormChange((current) => ({ ...current, briefRevisionNotes: event.target.value }))
                }
                placeholder="What should be revised or clarified in the project brief before planning continues"
                rows={3}
                value={summaryForm.briefRevisionNotes}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                label="Source notes - Optional"
                maxLength={4000}
                onChange={(event) =>
                  onSummaryFormChange((current) => ({ ...current, sourceNotes: event.target.value }))
                }
                placeholder="Manual notes about approved sources used for this summary and any limitations to keep in mind"
                rows={3}
                value={summaryForm.sourceNotes}
              />
            </div>
            <div className="modal-footer ai-delivery-modal-footer">
              <Button disabled={saving} onClick={onClose} type="button" variant="tertiary">
                Close
              </Button>
              <Button disabled={saving} onClick={onNewSummary} type="button" variant="tertiary">
                New summary
              </Button>
              <Button
                disabled={saving || !summaryForm.title.trim() || !summaryForm.summaryText.trim()}
                onClick={() => void onSaveSummary(project.id)}
                type="button"
                variant="primary"
              >
                {saving ? "Saving" : summaryEditorId ? "Save summary" : "Create summary"}
              </Button>
            </div>
          </section>

          <section className="field-panel ai-delivery-section-compact">
            <h3>Existing research summaries</h3>
            {researchSummaries.length === 0 ? (
              <AiDeliveryInlineEmpty>No research summaries yet. Add a summary after reviewing sources.</AiDeliveryInlineEmpty>
            ) : null}
            {researchSummaries.map((summary) => (
              <article className="entity-card" key={summary.id}>
                <div className="entity-card-header">
                  <div>
                    <StatusBadge status={summary.status} />
                    <h3>{summary.title}</h3>
                    <p>Updated {formatOptionalDate(summary.updatedAt)}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="ghost-action"
                      disabled={saving}
                      onClick={() => onEditSummary(summary)}
                      type="button"
                    >
                      Edit
                    </button>
                    {summary.status !== "FINALIZED" ? (
                      <button
                        className="ghost-action"
                        disabled={saving}
                        onClick={() => void onFinalizeSummary(project.id, summary)}
                        type="button"
                      >
                        Finalize
                      </button>
                    ) : null}
                    {summary.status !== "ARCHIVED" ? (
                      <button
                        className="ghost-action"
                        disabled={saving}
                        onClick={() => void onArchiveSummary(project.id, summary)}
                        type="button"
                      >
                        Archive
                      </button>
                    ) : null}
                    <button
                      className="ghost-action"
                      disabled={saving}
                      onClick={() => void onApplySummaryToBrief(project.id, summary.id)}
                      type="button"
                    >
                      Apply to brief notes
                    </button>
                  </div>
                </div>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>{formatEnumLabel(summary.status)}</dd>
                  </div>
                  <div>
                    <dt>Workflow run</dt>
                    <dd>{summary.workflowRun ? formatEnumLabel(summary.workflowRun.status) : "Manual / none"}</dd>
                  </div>
                  <div>
                    <dt>Finalized</dt>
                    <dd>{formatOptionalDate(summary.finalizedAt)}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatOptionalDate(summary.createdAt)}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Summary</dt>
                    <dd>{formatPreview(summary.summaryText)}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Key findings</dt>
                    <dd>{formatPreview(summary.keyFindings)}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Brief revision notes</dt>
                    <dd>{formatPreview(summary.briefRevisionNotes)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>

          <section className="field-panel ai-delivery-section-compact">
            <h3>Research source editor</h3>
            <div className="field-grid">
              <Select
                fullWidth
                label="Status - Required"
                onChange={(event) => onSourceFormChange((current) => ({ ...current, status: event.target.value }))}
                options={RESEARCH_SOURCE_STATUSES.map((status) => ({
                  value: status,
                  label: formatEnumLabel(status),
                }))}
                value={sourceForm.status}
              />
              <Select
                fullWidth
                label="Source type - Required"
                onChange={(event) =>
                  onSourceFormChange((current) => ({ ...current, sourceType: event.target.value }))
                }
                options={RESEARCH_SOURCE_TYPES.map((sourceType) => ({
                  value: sourceType,
                  label: formatEnumLabel(sourceType),
                }))}
                value={sourceForm.sourceType}
              />
              <Select
                fullWidth
                label="Linked research request - Optional"
                onChange={(event) =>
                  onSourceFormChange((current) => ({
                    ...current,
                    researchRequestId: event.target.value || null,
                  }))
                }
                options={[
                  { value: "", label: "Manual / unlinked source" },
                  ...researchRequests.map((request) => ({
                    value: request.id,
                    label: request.title,
                  })),
                ]}
                value={sourceForm.researchRequestId ?? ""}
              />
              <Select
                fullWidth
                label="Linked workflow run - Optional"
                onChange={(event) =>
                  onSourceFormChange((current) => ({ ...current, workflowRunId: event.target.value || null }))
                }
                options={[
                  { value: "", label: "Manual / unlinked source" },
                  ...researchWorkflowRuns.map((run) => ({
                    value: run.id,
                    label: `Workflow run - ${formatEnumLabel(run.status)}`,
                  })),
                ]}
                value={sourceForm.workflowRunId ?? ""}
              />
              <Input
                className="field-span-2"
                fullWidth
                helperText="Manual URL only. No fetch or crawl runs here."
                label="Source URL - Required"
                maxLength={2048}
                onChange={(event) =>
                  onSourceFormChange((current) => ({ ...current, sourceUrl: event.target.value }))
                }
                placeholder="https://example.com/source-page"
                value={sourceForm.sourceUrl}
              />
              <Input
                className="field-span-2"
                fullWidth
                label="Source title - Optional"
                maxLength={255}
                onChange={(event) =>
                  onSourceFormChange((current) => ({ ...current, sourceTitle: event.target.value }))
                }
                placeholder="Human-friendly source label for the admin team"
                value={sourceForm.sourceTitle}
              />
              <Textarea
                className="field-span-2"
                fullWidth
                label="Review notes - Optional"
                maxLength={4000}
                onChange={(event) =>
                  onSourceFormChange((current) => ({ ...current, reviewNotes: event.target.value }))
                }
                placeholder="Why this source was approved, rejected, or archived for manual research use"
                rows={4}
                value={sourceForm.reviewNotes}
              />
            </div>
            <div className="modal-footer ai-delivery-modal-footer">
              <Button disabled={saving} onClick={onClose} type="button" variant="tertiary">
                Close
              </Button>
              <Button disabled={saving} onClick={onNewSource} type="button" variant="tertiary">
                New source
              </Button>
              <Button
                disabled={saving || !sourceForm.sourceUrl.trim()}
                onClick={() => void onSaveSource(project.id)}
                type="button"
                variant="primary"
              >
                {saving ? "Saving" : sourceEditorId ? "Save source" : "Create source"}
              </Button>
            </div>
          </section>

          <section className="field-panel ai-delivery-section-compact">
            <h3>Existing research sources</h3>
            {researchSources.length === 0 ? (
              <AiDeliveryInlineEmpty>No research sources yet. Add a research source to get started.</AiDeliveryInlineEmpty>
            ) : null}
            {researchSources.map((source) => (
              <article className="entity-card" key={source.id}>
                <div className="entity-card-header">
                  <div>
                    <StatusBadge status={source.status} />
                    <h3>{source.sourceTitle ?? source.sourceUrl}</h3>
                    <p>Updated {formatOptionalDate(source.updatedAt)}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="ghost-action"
                      disabled={saving}
                      onClick={() => onEditSource(source)}
                      type="button"
                    >
                      Edit
                    </button>
                    {source.status !== "APPROVED" ? (
                      <button
                        className="ghost-action"
                        disabled={saving}
                        onClick={() => void onApproveSource(project.id, source)}
                        type="button"
                      >
                        Approve
                      </button>
                    ) : null}
                    {source.status !== "REJECTED" ? (
                      <button
                        className="ghost-action"
                        disabled={saving}
                        onClick={() => void onRejectSource(project.id, source)}
                        type="button"
                      >
                        Reject
                      </button>
                    ) : null}
                    {source.status !== "ARCHIVED" ? (
                      <button
                        className="ghost-action"
                        disabled={saving}
                        onClick={() => void onArchiveSource(project.id, source)}
                        type="button"
                      >
                        Archive
                      </button>
                    ) : null}
                  </div>
                </div>
                <dl className="brief-grid">
                  <div>
                    <dt>Status</dt>
                    <dd>{formatEnumLabel(source.status)}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>{formatEnumLabel(source.sourceType)}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Source URL</dt>
                    <dd>{source.sourceUrl}</dd>
                  </div>
                  <div>
                    <dt>Request</dt>
                    <dd>{source.researchRequest?.title ?? "Manual / none"}</dd>
                  </div>
                  <div>
                    <dt>Workflow run</dt>
                    <dd>{source.workflowRun ? formatEnumLabel(source.workflowRun.status) : "Manual / none"}</dd>
                  </div>
                  <div className="field-span-2">
                    <dt>Review notes</dt>
                    <dd>{formatPreview(source.reviewNotes)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>
          <div className="modal-footer ai-delivery-modal-footer">
            <Button onClick={onClose} type="button" variant="tertiary">
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div>Project not found.</div>
      )}
    </Modal>
  );
}
