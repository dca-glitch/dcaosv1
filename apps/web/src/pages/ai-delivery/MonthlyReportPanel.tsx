import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/ui";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

export type AiDeliveryMonthlySummaryDeliverable = {
  id: string;
  title: string;
  deliveryType: string;
  status: string;
  exportUrl?: string | null;
};

export type AiDeliveryMonthlySummaryContentPlanItem = {
  id: string;
  title: string;
  contentType: string | null;
  targetKeyword: string | null;
  approvalStatus?: string | null;
};

export type AiDeliveryMonthlySummaryData = {
  project: {
    id: string;
    name: string;
    targetMonth: string;
    clientId: string;
    clientName?: string | null;
  };
  deliverables: AiDeliveryMonthlySummaryDeliverable[];
  totals: {
    deliverableCount: number;
    deliveredCount: number;
    acceptedCount: number;
  };
  contentPlanItems?: AiDeliveryMonthlySummaryContentPlanItem[];
  gaGscMetricsStatus: string;
  trendMonthsStatus: string;
  recommendationsStatus: string;
};

export type AiDeliveryMonthlyReportData = {
  id: string;
  aiDeliveryProjectId: string;
  clientId: string;
  status: string;
  title: string | null;
  adminSummaryNotes: string | null;
  recommendationsText: string | null;
  exportUrl: string | null;
  isArchived: boolean;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryMonthlyReportFormValues = {
  title: string;
  adminSummaryNotes: string;
  recommendationsText: string;
  exportUrl: string;
};

type MonthlyReportPanelProps = {
  project: AiDeliveryProjectSummary;
  onClose: () => void;
  onFetchComputedSummary: (projectId: string) => Promise<AiDeliveryMonthlySummaryData | null>;
  onFetchReport: (projectId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onCreateReport: (projectId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onUpdateReport: (reportId: string, values: AiDeliveryMonthlyReportFormValues) => Promise<AiDeliveryMonthlyReportData | null>;
  onSetReportStatus: (reportId: string, status: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onArchiveReport: (reportId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onRestoreReport: (reportId: string) => Promise<AiDeliveryMonthlyReportData | null>;
};

const MONTHLY_REPORT_STATUSES = ["DRAFT", "ADMIN_REVIEW", "FINAL", "ARCHIVED"] as const;
type MonthlyReportStatus = (typeof MONTHLY_REPORT_STATUSES)[number];

function formatReportStatus(value: string | null | undefined): string {
  if (!value) return "Not set";
  if (value === "DRAFT") return "Draft";
  if (value === "ADMIN_REVIEW") return "Admin review";
  if (value === "FINAL") return "Final";
  if (value === "ARCHIVED") return "Archived";
  return value.toLowerCase().replace(/_/g, " ");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleString();
}

function formatDeliveryType(value: string | null | undefined): string {
  if (!value) return "Not set";
  return value.toLowerCase().replace(/_/g, " ").replace(/(^|\s)\S/g, (s) => s.toUpperCase());
}

function isSafeExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function emptyForm(): AiDeliveryMonthlyReportFormValues {
  return {
    title: "",
    adminSummaryNotes: "",
    recommendationsText: "",
    exportUrl: ""
  };
}

function formFromReport(report: AiDeliveryMonthlyReportData): AiDeliveryMonthlyReportFormValues {
  return {
    title: report.title ?? "",
    adminSummaryNotes: report.adminSummaryNotes ?? "",
    recommendationsText: report.recommendationsText ?? "",
    exportUrl: report.exportUrl ?? ""
  };
}

export function MonthlyReportPanel({
  project,
  onClose,
  onFetchComputedSummary,
  onFetchReport,
  onCreateReport,
  onUpdateReport,
  onSetReportStatus,
  onArchiveReport,
  onRestoreReport
}: MonthlyReportPanelProps) {
  const [summary, setSummary] = useState<AiDeliveryMonthlySummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [report, setReport] = useState<AiDeliveryMonthlyReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportNotFound, setReportNotFound] = useState(false);

  const [form, setForm] = useState<AiDeliveryMonthlyReportFormValues>(emptyForm());

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await onFetchComputedSummary(project.id);
      setSummary(data);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Unable to load computed summary.");
    } finally {
      setSummaryLoading(false);
    }
  }, [onFetchComputedSummary, project.id]);

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    setReportError(null);
    setReportNotFound(false);
    try {
      const data = await onFetchReport(project.id);
      if (data) {
        setReport(data);
        setForm(formFromReport(data));
      } else {
        setReportNotFound(true);
      }
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Unable to load monthly report.");
    } finally {
      setReportLoading(false);
    }
  }, [onFetchReport, project.id]);

  useEffect(() => {
    void loadSummary();
    void loadReport();
  }, [loadSummary, loadReport]);

  async function handleCreate() {
    setReportSaving(true);
    setReportError(null);
    setReportMessage(null);
    try {
      const created = await onCreateReport(project.id);
      if (created) {
        setReport(created);
        setForm(formFromReport(created));
        setReportNotFound(false);
        setReportMessage("Monthly report created.");
      }
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Unable to create monthly report.");
    } finally {
      setReportSaving(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!report) return;
    setReportSaving(true);
    setReportError(null);
    setReportMessage(null);
    try {
      const updated = await onUpdateReport(report.id, form);
      if (updated) {
        setReport(updated);
        setForm(formFromReport(updated));
        setReportMessage("Report saved.");
      }
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Unable to save monthly report.");
    } finally {
      setReportSaving(false);
    }
  }

  async function handleSetStatus(status: string) {
    if (!report) return;
    setReportSaving(true);
    setReportError(null);
    setReportMessage(null);
    try {
      const updated = await onSetReportStatus(report.id, status);
      if (updated) {
        setReport(updated);
        setForm(formFromReport(updated));
        setReportMessage(`Report moved to ${formatReportStatus(status)}.`);
      }
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Unable to update report status.");
    } finally {
      setReportSaving(false);
    }
  }

  async function handleArchive() {
    if (!report) return;
    setReportSaving(true);
    setReportError(null);
    setReportMessage(null);
    try {
      const updated = await onArchiveReport(report.id);
      if (updated) {
        setReport(updated);
        setForm(formFromReport(updated));
        setReportMessage("Report archived.");
      }
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Unable to archive monthly report.");
    } finally {
      setReportSaving(false);
    }
  }

  async function handleRestore() {
    if (!report) return;
    setReportSaving(true);
    setReportError(null);
    setReportMessage(null);
    try {
      const updated = await onRestoreReport(report.id);
      if (updated) {
        setReport(updated);
        setForm(formFromReport(updated));
        setReportMessage("Report restored.");
      }
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Unable to restore monthly report.");
    } finally {
      setReportSaving(false);
    }
  }

  const normalizedStatus = (report?.status ?? "") as MonthlyReportStatus;
  const canMoveToAdminReview = !reportSaving && !!report && !report.isArchived && normalizedStatus === "DRAFT";
  const canFinalize = !reportSaving && !!report && !report.isArchived && (normalizedStatus === "DRAFT" || normalizedStatus === "ADMIN_REVIEW");
  const canArchive = !reportSaving && !!report && !report.isArchived && normalizedStatus === "FINAL";
  const canRestore = !reportSaving && !!report && report.isArchived;
  const canEdit = !reportSaving && !!report && !report.isArchived && normalizedStatus !== "FINAL" && normalizedStatus !== "ARCHIVED";

  return (
    <Modal
      onClose={onClose}
      title={`Monthly Report — ${project.name}`}
    >
      {/* Computed Summary Section */}
      <section className="field-panel" style={{ marginBottom: "1.5rem" }}>
        <h3>Computed Monthly Summary</h3>
        <p className="muted-text">Read-only admin overview computed from existing project records. No GA/GSC or PDF generation in this block.</p>

        {summaryLoading ? (
          <div className="state-panel">Loading computed summary...</div>
        ) : summaryError ? (
          <div className="state-panel" role="alert" style={{ borderLeft: "4px solid var(--color-error)", paddingLeft: "1rem" }}>
            <strong>Summary unavailable:</strong> {summaryError}
          </div>
        ) : summary ? (
          <>
            <dl className="brief-grid">
              <div>
                <dt>Project</dt>
                <dd>{summary.project.name}</dd>
              </div>
              <div>
                <dt>Target month</dt>
                <dd>{summary.project.targetMonth}</dd>
              </div>
              <div>
                <dt>Client</dt>
                <dd>{summary.project.clientName ?? "Not set"}</dd>
              </div>
              <div>
                <dt>Final deliverables</dt>
                <dd>{summary.totals.deliverableCount}</dd>
              </div>
              <div>
                <dt>Delivered</dt>
                <dd>{summary.totals.deliveredCount}</dd>
              </div>
              <div>
                <dt>Accepted</dt>
                <dd>{summary.totals.acceptedCount}</dd>
              </div>
              <div>
                <dt>GA/GSC metrics</dt>
                <dd><StatusBadge status="Deferred" /></dd>
              </div>
              <div>
                <dt>12-month trends</dt>
                <dd><StatusBadge status="Deferred" /></dd>
              </div>
            </dl>

            {summary.deliverables.length > 0 ? (
              <div style={{ marginTop: "1rem" }}>
                <h4>Final deliverables</h4>
                {summary.deliverables.map((item) => (
                  <article className="entity-card" key={item.id} style={{ marginBottom: "0.5rem" }}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={item.status} />
                        <h3>{item.title}</h3>
                        <p className="muted-text">{formatDeliveryType(item.deliveryType)}</p>
                      </div>
                      {item.exportUrl && isSafeExternalUrl(item.exportUrl) ? (
                        <div className="card-actions">
                          <a
                            className="secondary-action"
                            href={item.exportUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Open export
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="state-panel" style={{ marginTop: "0.75rem" }}>No final deliverables yet for this project.</div>
            )}

            {(summary.contentPlanItems ?? []).length > 0 ? (
              <div style={{ marginTop: "1rem" }}>
                <h4>Content plan items</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Title</th>
                      <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Type</th>
                      <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Keyword</th>
                      <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary.contentPlanItems ?? []).map((item) => (
                      <tr key={item.id}>
                        <td style={{ paddingBottom: "0.25rem" }}>{item.title}</td>
                        <td style={{ paddingBottom: "0.25rem" }}>{item.contentType ?? "—"}</td>
                        <td style={{ paddingBottom: "0.25rem" }}>{item.targetKeyword ?? "—"}</td>
                        <td style={{ paddingBottom: "0.25rem" }}>{item.approvalStatus ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : (
          <div className="state-panel">Computed summary not available for this project.</div>
        )}
      </section>

      {/* Persisted Report Section */}
      <section className="field-panel">
        <h3>Persisted Monthly Report</h3>
        <p className="muted-text">Admin-authored monthly report narrative. Status controls visibility boundaries. Client Portal monthly report is deferred.</p>

        {reportLoading ? (
          <div className="state-panel">Loading monthly report...</div>
        ) : reportError ? (
          <div className="state-panel" role="alert" style={{ borderLeft: "4px solid var(--color-error)", paddingLeft: "1rem" }}>
            <strong>Error:</strong> {reportError}
          </div>
        ) : reportNotFound && !report ? (
          <div className="state-panel">
            <p>No monthly report exists for this project yet.</p>
            <div style={{ marginTop: "0.75rem" }}>
              <button
                className="primary-action"
                disabled={reportSaving}
                onClick={() => void handleCreate()}
                type="button"
              >
                {reportSaving ? "Creating..." : "Create Monthly Report"}
              </button>
            </div>
          </div>
        ) : report ? (
          <>
            {reportMessage ? (
              <div className="state-panel" style={{ marginBottom: "1rem", borderLeft: "4px solid var(--color-success)", paddingLeft: "1rem" }}>
                {reportMessage}
              </div>
            ) : null}

            {/* Status and actions */}
            <div className="field-panel" style={{ marginBottom: "1rem" }}>
              <dl className="brief-grid">
                <div>
                  <dt>Status</dt>
                  <dd><StatusBadge status={formatReportStatus(report.status)} /></dd>
                </div>
                {report.finalizedAt ? (
                  <div>
                    <dt>Finalized</dt>
                    <dd>{formatDate(report.finalizedAt)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(report.createdAt)}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{formatDate(report.updatedAt)}</dd>
                </div>
              </dl>

              <div className="card-actions" style={{ marginTop: "0.75rem" }}>
                {canMoveToAdminReview ? (
                  <button
                    className="secondary-action"
                    disabled={reportSaving}
                    onClick={() => void handleSetStatus("ADMIN_REVIEW")}
                    type="button"
                  >
                    Move to Admin Review
                  </button>
                ) : null}
                {canFinalize ? (
                  <button
                    className="secondary-action"
                    disabled={reportSaving}
                    onClick={() => void handleSetStatus("FINAL")}
                    type="button"
                  >
                    Finalize
                  </button>
                ) : null}
                {canArchive ? (
                  <button
                    className="secondary-action"
                    disabled={reportSaving}
                    onClick={() => void handleArchive()}
                    type="button"
                  >
                    Archive
                  </button>
                ) : null}
                {canRestore ? (
                  <button
                    className="secondary-action"
                    disabled={reportSaving}
                    onClick={() => void handleRestore()}
                    type="button"
                  >
                    Restore
                  </button>
                ) : null}
              </div>

              {normalizedStatus === "FINAL" ? (
                <p className="muted-text" style={{ marginTop: "0.5rem" }}>
                  This report is final. Recommendations text will be visible to clients when a Client Portal monthly report is implemented in a future block.
                </p>
              ) : null}
              {normalizedStatus === "ARCHIVED" ? (
                <p className="muted-text" style={{ marginTop: "0.5rem" }}>
                  This report is archived. Restore it to make edits or create a new workflow.
                </p>
              ) : null}
            </div>

            {/* Edit form */}
            <form onSubmit={(e) => void handleSave(e)}>
              <div className="field-grid">
                <label className="field-span-2">
                  Report title — Optional
                  <input
                    disabled={!canEdit}
                    maxLength={255}
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  />
                  <span className="muted-text">Working title for this monthly report.</span>
                </label>

                <label className="field-span-2">
                  Admin summary notes — Optional (admin-only)
                  <textarea
                    disabled={!canEdit}
                    maxLength={4000}
                    rows={4}
                    value={form.adminSummaryNotes}
                    onChange={(event) => setForm((current) => ({ ...current, adminSummaryNotes: event.target.value }))}
                  />
                  <span className="muted-text">Internal admin context only. Never exposed to clients.</span>
                </label>

                <label className="field-span-2">
                  Recommendations — Optional (client-visible when Final + Client Portal is implemented)
                  <textarea
                    disabled={!canEdit}
                    maxLength={4000}
                    rows={4}
                    value={form.recommendationsText}
                    onChange={(event) => setForm((current) => ({ ...current, recommendationsText: event.target.value }))}
                  />
                  <span className="muted-text">Admin-written recommendations for next month. Will be visible to client in a future Client Portal monthly report block.</span>
                </label>

                <label className="field-span-2">
                  Export / handoff URL — Optional
                  <input
                    disabled={!canEdit}
                    maxLength={2048}
                    type="url"
                    value={form.exportUrl}
                    onChange={(event) => setForm((current) => ({ ...current, exportUrl: event.target.value }))}
                  />
                  <span className="muted-text">Manual safe handoff link (e.g. Google Doc, shared folder). No R2 upload in this block.</span>
                </label>
              </div>

              <div className="modal-footer">
                <button className="secondary-action" disabled={reportSaving} onClick={onClose} type="button">
                  Close
                </button>
                <button
                  className="primary-action"
                  disabled={reportSaving || !canEdit}
                  type="submit"
                >
                  {reportSaving ? "Saving..." : "Save report"}
                </button>
              </div>
            </form>
          </>
        ) : null}

        {/* Footer when no report / error / loading */}
        {(reportNotFound && !report) || reportError || reportLoading ? (
          <div className="modal-footer" style={{ marginTop: "1rem" }}>
            <button className="secondary-action" onClick={onClose} type="button">
              Close
            </button>
          </div>
        ) : null}
      </section>
    </Modal>
  );
}
