import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/Modal";
import { Button, EmptyState, MetricCard, SectionPanel, Spinner, StatusBadge } from "../../components/ui";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";
import {
  MONTHLY_REPORT_WORKFLOW_STEPS,
  buildMetricsShellCopy,
  buildReportShellCopy,
  emptyForm,
  emptyMetricsForm,
  formFromReport,
  formatDate,
  formatDeliveryType,
  formatLastUpdatedMeta,
  formatMetricDecimal,
  formatMetricInteger,
  formatPeriodMeta,
  formatReportStatus,
  isSafeExternalUrl,
  isWorkflowStepComplete,
  isWorkflowStepCurrent,
  resolveWorkflowStepKey,
  type MonthlyMetricSnapshotFormValues,
  type MonthlyReportStatus
} from "./monthlyReportPanel.helpers";

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
  storageKey?: string | null;
  hasDocument: boolean;
  isArchived: boolean;
  finalizedAt: string | null;
  miHandoffId?: string | null;
  miSummaryId?: string | null;
  miContextDraft?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryMonthlyReportGeneratePdfSummary = {
  reportId: string;
  hasDocument: boolean;
  updatedAt: string;
  generatedAt: string;
  fileName: string;
};

export type AiDeliveryMonthlyReportFormValues = {
  title: string;
  adminSummaryNotes: string;
  recommendationsText: string;
  exportUrl: string;
};

export type AiDeliveryMonthlyReportMiContext = {
  miHandoffId: string | null;
  miSummaryId: string | null;
  miContextDraft: string | null;
  handoff: {
    id: string;
    title: string;
    handoffStatus: string;
    marketSummary: string | null;
    audienceSignals: unknown;
    opportunities: unknown;
    risks: unknown;
    recommendedActions: unknown;
    sourceNote: string | null;
  } | null;
  summary: {
    id: string;
    title: string;
    status: string;
    sourceNotes: string | null;
    projectId: string;
    finalizedAt: string | null;
  } | null;
};

export type MonthlyMetricSourceType = "MANUAL" | "CSV_IMPORT" | "GA4" | "GSC" | "HYBRID";
export type MonthlyMetricSnapshotStatus = "DRAFT" | "IMPORTED" | "APPROVED" | "ARCHIVED";

export type AiDeliveryMonthlyMetricSnapshotSummary = {
  id: string;
  aiDeliveryProjectId: string;
  aiDeliveryMonthlyReportId: string;
  targetMonth: string;
  sourceType: MonthlyMetricSourceType;
  status: MonthlyMetricSnapshotStatus;
  gscClicks: number | null;
  gscImpressions: number | null;
  gscAverageCtr: number | null;
  gscAveragePosition: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4PageViews: number | null;
  notes: string | null;
  importedByUserId: string | null;
  importedAt: string;
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiDeliveryMonthlyMetricsTrendMonthSummary = {
  targetMonth: string;
  sourceType: MonthlyMetricSourceType;
  gscClicks: number | null;
  gscImpressions: number | null;
  gscAverageCtr: number | null;
  gscAveragePosition: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4PageViews: number | null;
};

export type AiDeliveryMonthlyMetricsTrendSummary = {
  dataStatus: "NO_DATA" | "PARTIAL" | "READY";
  latestMonth: string | null;
  last12Months: AiDeliveryMonthlyMetricsTrendMonthSummary[];
  totals: {
    gscClicks: number;
    gscImpressions: number;
    ga4Sessions: number;
    ga4Users: number;
    ga4PageViews: number;
  };
  averages: {
    gscAverageCtr: number | null;
    gscAveragePosition: number | null;
  };
};

export type AiDeliveryMonthlyMetricsSummary = {
  report: {
    id: string;
    aiDeliveryProjectId: string;
    targetMonth: string;
    project: { id: string; name: string } | null;
    client: { id: string; name: string } | null;
  };
  snapshots: AiDeliveryMonthlyMetricSnapshotSummary[];
  computedTrendSummary: AiDeliveryMonthlyMetricsTrendSummary;
};

export type AiDeliveryMonthlyMetricsResponse = {
  metrics: AiDeliveryMonthlyMetricsSummary | null;
};

export type AiDeliveryMonthlyMetricSnapshotResponse = {
  snapshot: AiDeliveryMonthlyMetricSnapshotSummary | null;
};

type MonthlyReportPanelProps = {
  project: AiDeliveryProjectSummary;
  onClose: () => void;
  onFetchComputedSummary: (projectId: string) => Promise<AiDeliveryMonthlySummaryData | null>;
  onFetchReport: (projectId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onFetchMetrics: (reportId: string) => Promise<AiDeliveryMonthlyMetricsSummary | null>;
  onCreateReport: (projectId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onUpdateReport: (reportId: string, values: AiDeliveryMonthlyReportFormValues) => Promise<AiDeliveryMonthlyReportData | null>;
  onSetReportStatus: (reportId: string, status: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onArchiveReport: (reportId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onRestoreReport: (reportId: string) => Promise<AiDeliveryMonthlyReportData | null>;
  onGeneratePdf?: (reportId: string) => Promise<AiDeliveryMonthlyReportGeneratePdfSummary | null>;
  onUploadDocument?: (reportId: string, file: File) => Promise<AiDeliveryMonthlyReportData | null>;
  onDownloadDocument?: (reportId: string) => Promise<{ downloadUrl: string } | null>;
  onImportMetrics: (reportId: string, values: MonthlyMetricSnapshotFormValues) => Promise<AiDeliveryMonthlyMetricSnapshotSummary | null>;
  onApproveMetricSnapshot: (reportId: string, snapshotId: string) => Promise<AiDeliveryMonthlyMetricSnapshotSummary | null>;
  onArchiveMetricSnapshot: (reportId: string, snapshotId: string) => Promise<AiDeliveryMonthlyMetricSnapshotSummary | null>;
  // Market Intelligence internal context (admin-only)
  onFetchMiContext?: (reportId: string) => Promise<AiDeliveryMonthlyReportMiContext | null>;
  onApplyMiHandoff?: (reportId: string, handoffId: string) => Promise<AiDeliveryMonthlyReportMiContext | null>;
  onUpdateMiContextDraft?: (reportId: string, draft: string) => Promise<AiDeliveryMonthlyReportMiContext | null>;
  onRemoveMiHandoff?: (reportId: string) => Promise<AiDeliveryMonthlyReportMiContext | null>;
};

export type { MonthlyMetricSnapshotFormValues };

function MonthlyReportInlineLoading({ label }: { label: string }) {
  return (
    <p className="monthly-report-inline-loading" role="status">
      <Spinner size="sm" />
      {label}
    </p>
  );
}

function MonthlyReportInlineAlert({ message, title }: { message: string; title?: string }) {
  return (
    <div className="monthly-report-inline-alert" role="alert">
      {title ? <strong>{title}: </strong> : null}
      {message}
    </div>
  );
}

function MonthlyReportInlineSuccess({ message }: { message: string }) {
  return (
    <div className="monthly-report-inline-success" role="status">
      {message}
    </div>
  );
}

function MonthlyReportInlineNotice({ children }: { children: React.ReactNode }) {
  return <div className="monthly-report-inline-notice">{children}</div>;
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
  onRestoreReport,
  onGeneratePdf,
  onUploadDocument,
  onDownloadDocument,
  onFetchMetrics,
  onImportMetrics,
  onApproveMetricSnapshot,
  onArchiveMetricSnapshot,
  onFetchMiContext,
  onApplyMiHandoff,
  onUpdateMiContextDraft,
  onRemoveMiHandoff
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

  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentDownloading, setDocumentDownloading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<AiDeliveryMonthlyMetricsSummary | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsSaving, setMetricsSaving] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metricsMessage, setMetricsMessage] = useState<string | null>(null);
  const [metricsActionError, setMetricsActionError] = useState<string | null>(null);
  const [metricsForm, setMetricsForm] = useState<MonthlyMetricSnapshotFormValues>(emptyMetricsForm(project.targetMonth));

  const [miContext, setMiContext] = useState<AiDeliveryMonthlyReportMiContext | null>(null);
  const [miContextLoading, setMiContextLoading] = useState(false);
  const [miContextError, setMiContextError] = useState<string | null>(null);
  const [miContextMessage, setMiContextMessage] = useState<string | null>(null);
  const [miApplyHandoffId, setMiApplyHandoffId] = useState("");
  const [miApplySummaryId, setMiApplySummaryId] = useState("");
  const [finalizedSummaryOptions, setFinalizedSummaryOptions] = useState<Array<{ id: string; title: string }>>([]);
  const [miDraftEditing, setMiDraftEditing] = useState(false);
  const [miDraftValue, setMiDraftValue] = useState("");

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

  const loadMetrics = useCallback(
    async (reportId: string | null) => {
      if (!reportId) {
        setMetrics(null);
        setMetricsLoading(false);
        setMetricsError(null);
        setMetricsMessage(null);
        setMetricsActionError(null);
        setMetricsForm(emptyMetricsForm(project.targetMonth));
        return;
      }
      setMetricsLoading(true);
      setMetricsError(null);
      setMetricsActionError(null);
      try {
        const data = await onFetchMetrics(reportId);
        setMetrics(data);
        setMetricsForm((current) => {
          if (current.targetMonth.trim()) {
            return current;
          }
          return emptyMetricsForm(project.targetMonth);
        });
      } catch (error) {
        setMetrics(null);
        setMetricsError(error instanceof Error ? error.message : "Unable to load metrics.");
      } finally {
        setMetricsLoading(false);
      }
    },
    [onFetchMetrics, project.targetMonth]
  );

  useEffect(() => {
    void loadSummary();
    void loadReport();
  }, [loadSummary, loadReport]);

  useEffect(() => {
    if (!report) {
      setMetricsMessage(null);
      void loadMetrics(null);
      return;
    }

    setMetricsMessage(null);
    void loadMetrics(report.id);
  }, [loadMetrics, report]);

  // Load MI context when report becomes available
  useEffect(() => {
    if (!report || !onFetchMiContext) return;
    setMiContextLoading(true);
    setMiContextError(null);
    onFetchMiContext(report.id).then((data) => {
      setMiContext(data);
    }).catch((error) => {
      setMiContextError(error instanceof Error ? error.message : "Unable to load MI context.");
    }).finally(() => {
      setMiContextLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id, onFetchMiContext]);

  useEffect(() => {
    const token = window.sessionStorage.getItem("dcaosv1.authToken");
    if (!token) {
      setFinalizedSummaryOptions([]);
      return;
    }
    fetch(`/api/v1/market-intelligence/finalized-summaries?clientId=${encodeURIComponent(project.clientId)}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const options = (data?.data?.summaries ?? []).map((summary: { id: string; title: string }) => ({
          id: summary.id,
          title: summary.title
        }));
        setFinalizedSummaryOptions(options);
      })
      .catch(() => setFinalizedSummaryOptions([]));
  }, [project.clientId]);

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

  async function handleUploadDocument(event: React.ChangeEvent<HTMLInputElement>) {
    if (!report || !onUploadDocument) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setDocumentUploading(true);
    setDocumentError(null);
    setDocumentMessage(null);
    try {
      const updated = await onUploadDocument(report.id, file);
      if (updated) {
        setReport(updated);
        setDocumentMessage("Report document uploaded.");
      }
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Unable to upload report document.");
    } finally {
      setDocumentUploading(false);
      event.target.value = "";
    }
  }

  async function handleGeneratePdf() {
    if (!report || !onGeneratePdf) return;
    setPdfGenerating(true);
    setPdfError(null);
    setPdfMessage(null);
    try {
      const generated = await onGeneratePdf(report.id);
      if (!generated) {
        throw new Error("Unable to generate monthly report PDF.");
      }
      const refreshed = await onFetchReport(project.id);
      if (refreshed) {
        setReport(refreshed);
        setForm(formFromReport(refreshed));
      } else {
        setReport((current) => (current ? { ...current, hasDocument: generated.hasDocument, updatedAt: generated.updatedAt } : current));
      }
      setPdfMessage(`PDF generated: ${generated.fileName}.`);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "Unable to generate monthly report PDF.");
    } finally {
      setPdfGenerating(false);
    }
  }

  async function handleImportMetrics(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!report) return;
    setMetricsSaving(true);
    setMetricsError(null);
    setMetricsActionError(null);
    setMetricsMessage(null);
    try {
      const imported = await onImportMetrics(report.id, metricsForm);
      if (imported) {
        setMetricsMessage("Snapshot metrics imported.");
        setMetricsForm(emptyMetricsForm(metricsForm.targetMonth || project.targetMonth));
        await loadMetrics(report.id);
      }
    } catch (error) {
      setMetricsActionError(error instanceof Error ? error.message : "Unable to import snapshot metrics.");
    } finally {
      setMetricsSaving(false);
    }
  }

  async function handleApproveMetricSnapshot(snapshotId: string) {
    if (!report) return;
    setMetricsSaving(true);
    setMetricsError(null);
    setMetricsActionError(null);
    setMetricsMessage(null);
    try {
      const approved = await onApproveMetricSnapshot(report.id, snapshotId);
      if (approved) {
        setMetricsMessage("Snapshot approved.");
        await loadMetrics(report.id);
      }
    } catch (error) {
      setMetricsActionError(error instanceof Error ? error.message : "Unable to approve snapshot.");
    } finally {
      setMetricsSaving(false);
    }
  }

  async function handleArchiveMetricSnapshot(snapshotId: string) {
    if (!report) return;
    setMetricsSaving(true);
    setMetricsError(null);
    setMetricsActionError(null);
    setMetricsMessage(null);
    try {
      const archived = await onArchiveMetricSnapshot(report.id, snapshotId);
      if (archived) {
        setMetricsMessage("Snapshot archived.");
        await loadMetrics(report.id);
      }
    } catch (error) {
      setMetricsActionError(error instanceof Error ? error.message : "Unable to archive snapshot.");
    } finally {
      setMetricsSaving(false);
    }
  }

  async function handleDownloadDocument() {
    if (!report || !onDownloadDocument) return;
    setDocumentDownloading(true);
    setDocumentError(null);
    try {
      const ref = await onDownloadDocument(report.id);
      if (ref?.downloadUrl) {
        window.open(ref.downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        setDocumentError("Report document is not available for download.");
      }
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Unable to retrieve download link.");
    } finally {
      setDocumentDownloading(false);
    }
  }

  async function handleMiSummaryApply() {
    if (!report || !miApplySummaryId.trim()) return;
    const token = window.sessionStorage.getItem("dcaosv1.authToken");
    if (!token) return;
    setMiContextLoading(true);
    setMiContextError(null);
    setMiContextMessage(null);
    try {
      const response = await fetch(`/api/v1/ai-delivery/reports/monthly/${encodeURIComponent(report.id)}/mi-context/apply`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ summaryId: miApplySummaryId.trim() })
      });
      if (!response.ok) throw new Error("apply failed");
      const data = await response.json();
      setMiContext(data?.data ?? null);
      setMiApplySummaryId("");
      setMiContextMessage("Finalized MI summary applied to report context.");
    } catch (error) {
      setMiContextError(error instanceof Error ? error.message : "Unable to apply MI summary.");
    } finally {
      setMiContextLoading(false);
    }
  }

  async function handleMiApply() {
    if (!report || !onApplyMiHandoff || !miApplyHandoffId.trim()) return;
    setMiContextLoading(true);
    setMiContextError(null);
    setMiContextMessage(null);
    try {
      const result = await onApplyMiHandoff(report.id, miApplyHandoffId.trim());
      if (result) {
        setMiContext(result);
        setMiApplyHandoffId("");
        setMiContextMessage("Market Intelligence context applied.");
      }
    } catch (error) {
      setMiContextError(error instanceof Error ? error.message : "Unable to apply MI context.");
    } finally {
      setMiContextLoading(false);
    }
  }

  async function handleMiDraftSave() {
    if (!report || !onUpdateMiContextDraft) return;
    setMiContextLoading(true);
    setMiContextError(null);
    setMiContextMessage(null);
    try {
      const result = await onUpdateMiContextDraft(report.id, miDraftValue);
      if (result) {
        setMiContext(result);
        setMiDraftEditing(false);
        setMiContextMessage("Internal context draft updated.");
      }
    } catch (error) {
      setMiContextError(error instanceof Error ? error.message : "Unable to update MI draft.");
    } finally {
      setMiContextLoading(false);
    }
  }

  async function handleMiRemove() {
    if (!report || !onRemoveMiHandoff) return;
    setMiContextLoading(true);
    setMiContextError(null);
    setMiContextMessage(null);
    try {
      const result = await onRemoveMiHandoff(report.id);
      setMiContext(result);
      setMiDraftEditing(false);
      setMiContextMessage("MI context reference removed.");
    } catch (error) {
      setMiContextError(error instanceof Error ? error.message : "Unable to remove MI context.");
    } finally {
      setMiContextLoading(false);
    }
  }

  const normalizedStatus = (report?.status ?? "") as MonthlyReportStatus;
  const canMoveToAdminReview = !reportSaving && !!report && !report.isArchived && normalizedStatus === "DRAFT";
  const canFinalize = !reportSaving && !!report && !report.isArchived && (normalizedStatus === "DRAFT" || normalizedStatus === "ADMIN_REVIEW");
  const canArchive = !reportSaving && !!report && !report.isArchived && normalizedStatus === "FINAL";
  const canRestore = !reportSaving && !!report && report.isArchived;
  const canEdit = !reportSaving && !!report && !report.isArchived && normalizedStatus !== "FINAL" && normalizedStatus !== "ARCHIVED";

  const reportShellCopy = useMemo(() => {
    if (!report) return null;
    return buildReportShellCopy({
      status: report.status,
      isArchived: report.isArchived,
      title: report.title,
      hasDocument: report.hasDocument,
      exportUrl: report.exportUrl,
      projectName: project.name
    });
  }, [project.name, report]);

  const metricsShellCopy = useMemo(() => {
    if (!metrics) return null;
    return buildMetricsShellCopy({
      dataStatus: metrics.computedTrendSummary.dataStatus,
      snapshotCount: metrics.snapshots.length,
      trendMonthCount: metrics.computedTrendSummary.last12Months.length
    });
  }, [metrics]);

  const workflowStepKey = report
    ? resolveWorkflowStepKey(report.status, report.isArchived)
    : null;
  const periodMeta = formatPeriodMeta(project.targetMonth);
  const lastUpdatedMeta = formatLastUpdatedMeta(report?.updatedAt);

  return (
    <Modal
      onClose={onClose}
      title={`Monthly Report — ${project.name}`}
    >
      <div className="monthly-report-panel stack gap-md">
      {/* Computed Summary Section */}
      <SectionPanel
        className="monthly-report-summary-panel"
        description="Read-only overview. FINAL reports use approved snapshots and client-safe metrics only. Live GA/GSC sync deferred."
        title="Computed Monthly Summary"
        tone="compact"
      >
        {summaryLoading ? (
          <MonthlyReportInlineLoading label="Loading computed summary" />
        ) : summaryError ? (
          <MonthlyReportInlineAlert message={summaryError} title="Summary unavailable" />
        ) : summary ? (
          <>
            <div className="summary-grid metric-grid monthly-report-summary-metrics" aria-label="Monthly report snapshot metrics">
              <MetricCard
                accent="cyan"
                helper={summary.project.clientName ?? "Client not set"}
                label="Project"
                metricKey="monthly-report-project"
                value={summary.project.name}
              />
              <MetricCard
                accent="violet"
                helper={summary.project.targetMonth}
                label="Target month"
                metricKey="monthly-report-month"
                value={summary.project.targetMonth}
              />
              <MetricCard
                accent="success"
                helper={`${summary.totals.deliveredCount} delivered · ${summary.totals.acceptedCount} accepted`}
                label="Final deliverables"
                metricKey="monthly-report-deliverables"
                value={String(summary.totals.deliverableCount)}
              />
            </div>
            <dl className="brief-grid monthly-report-deferred-metrics">
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
              <div className="monthly-report-deliverable-list">
                <h4>Final deliverables</h4>
                {summary.deliverables.map((item) => (
                  <article className="entity-card" key={item.id}>
                    <div className="entity-card-header">
                      <div>
                        <StatusBadge status={item.status} />
                        <h3>{item.title}</h3>
                        <p className="muted-text">{formatDeliveryType(item.deliveryType)}</p>
                      </div>
                      {item.exportUrl && isSafeExternalUrl(item.exportUrl) ? (
                        <div className="card-actions">
                          <a
                            className="ghost-action"
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
              <p className="inline-empty muted-text">No final deliverables yet for this project.</p>
            )}

            {(summary.contentPlanItems ?? []).length > 0 ? (
              <div className="table-wrap finance-table-wrap monthly-report-table-scroll">
                <h4 className="monthly-report-plan-heading">Content plan items</h4>
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Keyword</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary.contentPlanItems ?? []).map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.contentType ?? "—"}</td>
                        <td>{item.targetKeyword ?? "—"}</td>
                        <td>{item.approvalStatus ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : (
          <p className="inline-empty muted-text">Computed summary not available for this project.</p>
        )}
      </SectionPanel>

      <SectionPanel
        className="monthly-report-admin-panel"
        description="Admin report shell. FINAL reports are client-visible; internal notes stay hidden."
        title="Persisted Monthly Report"
        tone="compact"
      >

        {reportLoading ? (
          <MonthlyReportInlineLoading label="Loading monthly report" />
        ) : reportError ? (
          <MonthlyReportInlineAlert message={reportError} title="Monthly report unavailable" />
        ) : reportNotFound && !report ? (
          <EmptyState
            title="No persisted monthly report yet"
            message="Create the report shell first. Approved snapshots and metrics import follow after it exists."
            action={(
              <Button
                disabled={reportSaving}
                onClick={() => void handleCreate()}
                type="button"
                variant="primary"
              >
                {reportSaving ? "Creating..." : "Create Monthly Report"}
              </Button>
            )}
          />
        ) : report ? (
          <>
            {reportMessage ? <MonthlyReportInlineSuccess message={reportMessage} /> : null}

            <div className="entity-card monthly-report-status-card">
              <div className="entity-card-header">
                <div>
                  <StatusBadge status={reportShellCopy?.status ?? formatReportStatus(report.status)} />
                  <h3>{reportShellCopy?.headline ?? `${project.name} monthly report`}</h3>
                  <p className="muted-text">
                    {project.targetMonth} • {project.client?.name ?? project.clientId}
                    {report.finalizedAt ? ` • Finalized ${formatDate(report.finalizedAt)}` : " • Draft workflow"}
                  </p>
                </div>
                <div className="card-actions monthly-report-status-actions">
                  {canMoveToAdminReview ? (
                    <Button
                      disabled={reportSaving}
                      onClick={() => void handleSetStatus("ADMIN_REVIEW")}
                      size="sm"
                      type="button"
                      variant="tertiary"
                    >
                      Move to Admin Review
                    </Button>
                  ) : null}
                  {canFinalize ? (
                    <Button
                      disabled={reportSaving}
                      onClick={() => void handleSetStatus("FINAL")}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Finalize
                    </Button>
                  ) : null}
                  {canArchive ? (
                    <Button
                      disabled={reportSaving}
                      onClick={() => void handleArchive()}
                      size="sm"
                      type="button"
                      variant="tertiary"
                    >
                      Archive
                    </Button>
                  ) : null}
                  {canRestore ? (
                    <Button
                      disabled={reportSaving}
                      onClick={() => void handleRestore()}
                      size="sm"
                      type="button"
                      variant="tertiary"
                    >
                      Restore
                    </Button>
                  ) : null}
                </div>
              </div>

              {workflowStepKey ? (
                <ol className="monthly-report-workflow-steps" aria-label="Report workflow">
                  {MONTHLY_REPORT_WORKFLOW_STEPS.map((step) => {
                    const current = isWorkflowStepCurrent(step.key, workflowStepKey);
                    const complete = isWorkflowStepComplete(step.key, workflowStepKey);
                    return (
                      <li
                        className={[
                          "monthly-report-workflow-step",
                          current ? "is-current" : null,
                          complete ? "is-complete" : null
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={step.key}
                      >
                        <span className="monthly-report-workflow-step-label">{step.label}</span>
                      </li>
                    );
                  })}
                  {workflowStepKey === "ARCHIVED" ? (
                    <li className="monthly-report-workflow-step is-current">
                      <span className="monthly-report-workflow-step-label">Archived</span>
                    </li>
                  ) : null}
                </ol>
              ) : null}

              <dl className="brief-grid monthly-report-status-grid">
                {periodMeta ? (
                  <div>
                    <dt>Period</dt>
                    <dd>{periodMeta}</dd>
                  </div>
                ) : null}
                {lastUpdatedMeta ? (
                  <div>
                    <dt>Last updated</dt>
                    <dd>{lastUpdatedMeta}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Document</dt>
                  <dd>{reportShellCopy?.documentState ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Handoff</dt>
                  <dd>{reportShellCopy?.handoffState ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Visibility</dt>
                  <dd>{reportShellCopy?.visibilityState ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Metrics</dt>
                  <dd>
                    {metricsLoading
                      ? "Loading snapshot metrics"
                      : metrics
                        ? `${metricsShellCopy?.snapshotCount ?? 0} snapshot${(metricsShellCopy?.snapshotCount ?? 0) === 1 ? "" : "s"} loaded`
                        : "Awaiting report creation"}
                  </dd>
                </div>
              </dl>

              <p className="monthly-report-status-hint muted-text">
                {reportShellCopy?.actionHint ?? "Use the report actions above to manage the monthly workflow."}
              </p>
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
                  <span className="muted-text">Optional working title.</span>
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
                  <span className="muted-text">Admin-only.</span>
                </label>

                <label className="field-span-2">
                  Recommendations — Optional (client-visible when Final)
                  <textarea
                    disabled={!canEdit}
                    maxLength={4000}
                    rows={4}
                    value={form.recommendationsText}
                    onChange={(event) => setForm((current) => ({ ...current, recommendationsText: event.target.value }))}
                  />
                  <span className="muted-text">Client-visible when FINAL.</span>
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
                  <span className="muted-text">Safe external handoff link.</span>
                </label>
              </div>

              {onUploadDocument || onDownloadDocument ? (
                <div className="field-panel monthly-report-document-panel">
                  <h4>Report document</h4>
                  <p className="muted-text">Upload/download private document or keep a handoff URL.</p>
                  {onGeneratePdf ? (
                    <div className="field-panel monthly-report-pdf-panel">
                      <h5>Generate PDF</h5>
                      <p className="muted-text">Writes into the private monthly report document slot.</p>
                      {pdfMessage ? <MonthlyReportInlineSuccess message={pdfMessage} /> : null}
                      {pdfError ? <MonthlyReportInlineAlert message={pdfError} /> : null}
                      <div className="card-actions">
                        <Button
                          disabled={pdfGenerating || report.isArchived}
                          onClick={() => void handleGeneratePdf()}
                          size="sm"
                          type="button"
                          variant="tertiary"
                        >
                          {pdfGenerating ? "Generating..." : "Generate PDF"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {documentMessage ? <MonthlyReportInlineSuccess message={documentMessage} /> : null}
                  {documentError ? <MonthlyReportInlineAlert message={documentError} /> : null}
                  {report.hasDocument ? (
                    <p className="muted-text monthly-report-document-state">Document attached.</p>
                  ) : (
                    <p className="muted-text monthly-report-document-state">No document uploaded yet.</p>
                  )}
                  <div className="card-actions">
                    {onDownloadDocument && report.hasDocument ? (
                      <Button
                        disabled={documentDownloading}
                        onClick={() => void handleDownloadDocument()}
                        size="sm"
                        type="button"
                        variant="tertiary"
                      >
                        {documentDownloading ? "Loading..." : "Download report document"}
                      </Button>
                    ) : null}
                    {onUploadDocument ? (
                      <label style={{ cursor: documentUploading ? "wait" : "pointer" }}>
                        <span className="ghost-action" style={{ pointerEvents: documentUploading ? "none" : undefined }}>
                          {documentUploading ? "Uploading..." : report.hasDocument ? "Replace document" : "Upload document"}
                        </span>
                        <input
                          accept=".pdf,.doc,.docx"
                          disabled={documentUploading}
                          style={{ display: "none" }}
                          type="file"
                          onChange={(e) => void handleUploadDocument(e)}
                        />
                      </label>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {onFetchMiContext ? (
                <SectionPanel
                  description="Admin-only MI handoff or finalized summary context."
                  title="Market Intelligence context"
                  tone="compact"
                >
                  {miContextLoading ? (
                    <MonthlyReportInlineLoading label="Loading MI context" />
                  ) : (
                    <>
                      {miContextMessage ? <MonthlyReportInlineSuccess message={miContextMessage} /> : null}
                      {miContextError ? <MonthlyReportInlineAlert message={miContextError} /> : null}
                      {miContext?.miHandoffId || miContext?.miSummaryId ? (
                        <p className="muted-text" style={{ marginBottom: "0.75rem" }}>
                          <strong>Source type:</strong>{" "}
                          {miContext.miSummaryId ? "Finalized MI summary" : "MI handoff"}
                        </p>
                      ) : null}
                      {miContext?.handoff || miContext?.summary ? (
                        <div style={{ marginBottom: "0.75rem" }}>
                          {miContext.handoff ? (
                            <p className="muted-text">
                              <strong>Linked handoff:</strong> {miContext.handoff.title}
                              {" — "}
                              <StatusBadge status={miContext.handoff.handoffStatus} />
                            </p>
                          ) : null}
                          {miContext.summary ? (
                            <p className="muted-text">
                              <strong>Linked MI summary:</strong> {miContext.summary.title}
                              {" — "}
                              <StatusBadge status={miContext.summary.status} />
                            </p>
                          ) : null}
                          {miDraftEditing ? (
                            <div style={{ marginTop: "0.5rem" }}>
                              <textarea
                                rows={8}
                                style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8125rem" }}
                                value={miDraftValue}
                                onChange={(e) => setMiDraftValue(e.target.value)}
                              />
                              <div className="card-actions" style={{ marginTop: "0.5rem" }}>
                                <Button disabled={miContextLoading} onClick={() => void handleMiDraftSave()} type="button" variant="primary">
                                  Save draft
                                </Button>
                                <Button onClick={() => setMiDraftEditing(false)} type="button" variant="tertiary">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {miContext.miContextDraft ? (
                                <pre className="monthly-report-mi-draft">{miContext.miContextDraft}</pre>
                              ) : null}
                              <div className="card-actions" style={{ marginTop: "0.5rem" }}>
                                {onUpdateMiContextDraft ? (
                                  <Button
                                    disabled={miContextLoading}
                                    onClick={() => { setMiDraftValue(miContext.miContextDraft ?? ""); setMiDraftEditing(true); }}
                                    size="sm"
                                    type="button"
                                    variant="tertiary"
                                  >
                                    Edit draft
                                  </Button>
                                ) : null}
                                {onRemoveMiHandoff ? (
                                  <Button disabled={miContextLoading} onClick={() => void handleMiRemove()} size="sm" type="button" variant="tertiary">
                                    Remove context
                                  </Button>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <p className="muted-text">No MI context linked. Apply a READY handoff or finalized MI summary by ID.</p>
                          {onApplyMiHandoff ? (
                            <div className="monthly-report-mi-apply-row">
                              <input
                                placeholder="Handoff ID"
                                type="text"
                                value={miApplyHandoffId}
                                onChange={(e) => setMiApplyHandoffId(e.target.value)}
                              />
                              <Button
                                disabled={miContextLoading || !miApplyHandoffId.trim()}
                                onClick={() => void handleMiApply()}
                                size="sm"
                                type="button"
                                variant="tertiary"
                              >
                                Apply handoff
                              </Button>
                            </div>
                          ) : null}
                          <div className="monthly-report-mi-apply-row">
                            <select
                              value={miApplySummaryId}
                              onChange={(e) => setMiApplySummaryId(e.target.value)}
                            >
                              <option value="">Select finalized summary</option>
                              {finalizedSummaryOptions.map((summary) => (
                                <option key={summary.id} value={summary.id}>
                                  {summary.title}
                                </option>
                              ))}
                            </select>
                            <input
                              placeholder="Or summary ID (fallback)"
                              type="text"
                              value={miApplySummaryId}
                              onChange={(e) => setMiApplySummaryId(e.target.value)}
                            />
                            <Button
                              disabled={miContextLoading || !miApplySummaryId.trim()}
                              onClick={() => void handleMiSummaryApply()}
                              size="sm"
                              type="button"
                              variant="tertiary"
                            >
                              Apply summary
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </SectionPanel>
              ) : null}

              <SectionPanel
                className="metrics-section"
                description="Manual snapshot import. Live Google sync deferred."
                title="GA/GSC Metrics"
                tone="compact"
              >
                {metricsLoading ? (
                  <MonthlyReportInlineLoading label="Loading snapshot metrics" />
                ) : metricsError ? (
                  <MonthlyReportInlineAlert message={metricsError} title="Metrics unavailable" />
                ) : metrics ? (
                  <>
                    {metricsMessage ? <MonthlyReportInlineSuccess message={metricsMessage} /> : null}
                    {metricsActionError ? <MonthlyReportInlineAlert message={metricsActionError} /> : null}

                    <MonthlyReportInlineNotice>
                      <strong>Trend summary</strong>
                      <p className="muted-text">
                        {metricsShellCopy?.trendHint ?? "Trend summary is waiting for approved snapshots."}
                      </p>
                      <dl className="brief-grid monthly-report-trend-grid">
                        <div>
                          <dt>Snapshot status</dt>
                          <dd>{metricsShellCopy?.dataStatus ?? "N/A"}</dd>
                        </div>
                        <div>
                          <dt>Imported snapshots</dt>
                          <dd>{metricsShellCopy?.snapshotCount ?? 0}</dd>
                        </div>
                        <div>
                          <dt>Trend months</dt>
                          <dd>{metricsShellCopy?.trendMonthCount ?? 0}</dd>
                        </div>
                        <div>
                          <dt>Latest approved month</dt>
                          <dd>{metrics.computedTrendSummary.latestMonth ?? "N/A"}</dd>
                        </div>
                      </dl>
                    </MonthlyReportInlineNotice>

                    <div className="summary-grid metric-grid finance-table-wrap-spaced monthly-report-metrics-cards">
                      <MetricCard
                        accent={metrics.computedTrendSummary.dataStatus === "READY" ? "success" : "warning"}
                        helper={`${metrics.snapshots.length} snapshot${metrics.snapshots.length === 1 ? "" : "s"}`}
                        label="Data status"
                        value={
                          metrics.computedTrendSummary.dataStatus === "READY"
                            ? "Snapshots complete"
                            : metrics.computedTrendSummary.dataStatus
                        }
                      />
                      <MetricCard
                        accent="cyan"
                        helper="Latest approved month in the trend summary"
                        label="Latest month"
                        value={metrics.computedTrendSummary.latestMonth ?? "N/A"}
                      />
                      <MetricCard
                        helper="12-month approved totals"
                        label="Clicks"
                        value={formatMetricInteger(metrics.computedTrendSummary.totals.gscClicks)}
                      />
                      <MetricCard
                        helper="12-month approved totals"
                        label="Impressions"
                        value={formatMetricInteger(metrics.computedTrendSummary.totals.gscImpressions)}
                      />
                    </div>

                    <dl className="brief-grid" style={{ marginBottom: "1rem" }}>
                      <div>
                        <dt>GA4 sessions</dt>
                        <dd>{formatMetricInteger(metrics.computedTrendSummary.totals.ga4Sessions)}</dd>
                      </div>
                      <div>
                        <dt>GA4 users</dt>
                        <dd>{formatMetricInteger(metrics.computedTrendSummary.totals.ga4Users)}</dd>
                      </div>
                      <div>
                        <dt>GA4 page views</dt>
                        <dd>{formatMetricInteger(metrics.computedTrendSummary.totals.ga4PageViews)}</dd>
                      </div>
                      <div>
                        <dt>CTR average</dt>
                        <dd>{formatMetricDecimal(metrics.computedTrendSummary.averages.gscAverageCtr)}</dd>
                      </div>
                      <div>
                        <dt>Position average</dt>
                        <dd>{formatMetricDecimal(metrics.computedTrendSummary.averages.gscAveragePosition)}</dd>
                      </div>
                    </dl>

                    <div style={{ marginBottom: "1rem" }}>
                      <div className="field-grid">
                        <label>
                          Target month
                          <input
                            disabled={metricsSaving}
                            onChange={(event) => setMetricsForm((current) => ({ ...current, targetMonth: event.target.value }))}
                            required
                            type="month"
                            value={metricsForm.targetMonth}
                          />
                        </label>
                        <label>
                          Source type
                          <select
                            disabled={metricsSaving}
                            value={metricsForm.sourceType}
                            onChange={(event) => setMetricsForm((current) => ({ ...current, sourceType: event.target.value as MonthlyMetricSourceType }))}
                          >
                            <option value="HYBRID">HYBRID</option>
                            <option value="MANUAL">MANUAL</option>
                            <option value="CSV_IMPORT">CSV_IMPORT</option>
                            <option value="GA4">GA4</option>
                            <option value="GSC">GSC</option>
                          </select>
                        </label>
                        <label>
                          Status
                          <select
                            disabled={metricsSaving}
                            value={metricsForm.status}
                            onChange={(event) => setMetricsForm((current) => ({ ...current, status: event.target.value as MonthlyMetricSnapshotFormValues["status"] }))}
                          >
                            <option value="IMPORTED">IMPORTED</option>
                            <option value="DRAFT">DRAFT</option>
                          </select>
                        </label>
                        <label>
                          GSC clicks
                          <input
                            disabled={metricsSaving}
                            min={0}
                            inputMode="numeric"
                            onChange={(event) => setMetricsForm((current) => ({ ...current, gscClicks: event.target.value }))}
                            step="1"
                            type="number"
                            value={metricsForm.gscClicks}
                          />
                        </label>
                        <label>
                          GSC impressions
                          <input
                            disabled={metricsSaving}
                            min={0}
                            inputMode="numeric"
                            onChange={(event) => setMetricsForm((current) => ({ ...current, gscImpressions: event.target.value }))}
                            step="1"
                            type="number"
                            value={metricsForm.gscImpressions}
                          />
                        </label>
                        <label>
                          GSC average CTR
                          <input
                            disabled={metricsSaving}
                            min={0}
                            inputMode="decimal"
                            onChange={(event) => setMetricsForm((current) => ({ ...current, gscAverageCtr: event.target.value }))}
                            step="0.01"
                            type="number"
                            value={metricsForm.gscAverageCtr}
                          />
                        </label>
                        <label>
                          GSC average position
                          <input
                            disabled={metricsSaving}
                            min={0}
                            inputMode="decimal"
                            onChange={(event) => setMetricsForm((current) => ({ ...current, gscAveragePosition: event.target.value }))}
                            step="0.01"
                            type="number"
                            value={metricsForm.gscAveragePosition}
                          />
                        </label>
                        <label>
                          GA4 sessions
                          <input
                            disabled={metricsSaving}
                            min={0}
                            inputMode="numeric"
                            onChange={(event) => setMetricsForm((current) => ({ ...current, ga4Sessions: event.target.value }))}
                            step="1"
                            type="number"
                            value={metricsForm.ga4Sessions}
                          />
                        </label>
                        <label>
                          GA4 users
                          <input
                            disabled={metricsSaving}
                            min={0}
                            inputMode="numeric"
                            onChange={(event) => setMetricsForm((current) => ({ ...current, ga4Users: event.target.value }))}
                            step="1"
                            type="number"
                            value={metricsForm.ga4Users}
                          />
                        </label>
                        <label>
                          GA4 page views
                          <input
                            disabled={metricsSaving}
                            min={0}
                            inputMode="numeric"
                            onChange={(event) => setMetricsForm((current) => ({ ...current, ga4PageViews: event.target.value }))}
                            step="1"
                            type="number"
                            value={metricsForm.ga4PageViews}
                          />
                        </label>
                        <label className="field-span-2">
                          Notes
                          <textarea
                            disabled={metricsSaving}
                            maxLength={4000}
                            onChange={(event) => setMetricsForm((current) => ({ ...current, notes: event.target.value }))}
                            rows={3}
                            value={metricsForm.notes}
                          />
                        </label>
                      </div>
                      <div className="modal-footer modal-footer-spaced">
                        <Button disabled={metricsSaving} onClick={() => void handleImportMetrics()} type="button" variant="primary">
                          {metricsSaving ? "Importing..." : "Import snapshot metrics"}
                        </Button>
                      </div>
                    </div>

                    {metrics.snapshots.length === 0 ? (
                      <p className="inline-empty muted-text">
                        No snapshot metrics imported yet. Import a manual or CSV snapshot here; live GA/GSC sync is deferred and is not implied by empty metrics.
                      </p>
                    ) : (
                      <div className="table-wrap finance-table-wrap finance-table-wrap-spaced monthly-report-metrics-table monthly-report-table-scroll" aria-label="Monthly metrics snapshots">
                        <table>
                          <thead>
                            <tr>
                              <th>Month</th>
                              <th>Source</th>
                              <th>Status</th>
                              <th>Clicks</th>
                              <th>Impressions</th>
                              <th>CTR</th>
                              <th>Position</th>
                              <th>Sessions</th>
                              <th>Users</th>
                              <th>Page views</th>
                              <th>Imported</th>
                              <th>Approved</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metrics.snapshots.map((snapshot) => (
                              <tr key={snapshot.id}>
                                <td>{snapshot.targetMonth}</td>
                                <td>{snapshot.sourceType}</td>
                                <td><StatusBadge status={snapshot.status} /></td>
                                <td>{formatMetricInteger(snapshot.gscClicks)}</td>
                                <td>{formatMetricInteger(snapshot.gscImpressions)}</td>
                                <td>{typeof snapshot.gscAverageCtr === "number" ? `${formatMetricDecimal(snapshot.gscAverageCtr)}%` : "—"}</td>
                                <td>{formatMetricDecimal(snapshot.gscAveragePosition)}</td>
                                <td>{formatMetricInteger(snapshot.ga4Sessions)}</td>
                                <td>{formatMetricInteger(snapshot.ga4Users)}</td>
                                <td>{formatMetricInteger(snapshot.ga4PageViews)}</td>
                                <td>{formatDate(snapshot.importedAt)}</td>
                                <td>{formatDate(snapshot.approvedAt)}</td>
                                <td>
                                  <div className="card-actions">
                                    <Button
                                      disabled={metricsSaving || snapshot.status === "APPROVED" || snapshot.status === "ARCHIVED"}
                                      onClick={() => void handleApproveMetricSnapshot(snapshot.id)}
                                      size="sm"
                                      type="button"
                                      variant="tertiary"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      disabled={metricsSaving || snapshot.status === "ARCHIVED"}
                                      onClick={() => void handleArchiveMetricSnapshot(snapshot.id)}
                                      size="sm"
                                      type="button"
                                      variant="tertiary"
                                    >
                                      Archive
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {metrics.computedTrendSummary.last12Months.length > 0 ? (
                      <div className="table-wrap monthly-report-table-scroll monthly-report-metrics-table" aria-label="Monthly metrics trend summary">
                        <table>
                          <thead>
                            <tr>
                              <th>Month</th>
                              <th>Source</th>
                              <th>Clicks</th>
                              <th>Impressions</th>
                              <th>CTR</th>
                              <th>Position</th>
                              <th>Sessions</th>
                              <th>Users</th>
                              <th>Page views</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metrics.computedTrendSummary.last12Months.map((month) => (
                              <tr key={month.targetMonth}>
                                <td>{month.targetMonth}</td>
                                <td>{month.sourceType}</td>
                                <td>{formatMetricInteger(month.gscClicks)}</td>
                                <td>{formatMetricInteger(month.gscImpressions)}</td>
                                <td>{typeof month.gscAverageCtr === "number" ? `${formatMetricDecimal(month.gscAverageCtr)}%` : "—"}</td>
                                <td>{formatMetricDecimal(month.gscAveragePosition)}</td>
                                <td>{formatMetricInteger(month.ga4Sessions)}</td>
                                <td>{formatMetricInteger(month.ga4Users)}</td>
                                <td>{formatMetricInteger(month.ga4PageViews)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <EmptyState
                    title="Snapshot metrics not loaded yet"
                    message="Create or open the persisted monthly report first, then import a manual or CSV snapshot. Live GA/GSC sync is deferred."
                  />
                )}
              </SectionPanel>

              <div className="modal-footer monthly-report-footer">
                <Button disabled={reportSaving} onClick={onClose} type="button" variant="tertiary">
                  Close
                </Button>
                <Button
                  disabled={reportSaving || !canEdit}
                  type="submit"
                  variant="primary"
                >
                  {reportSaving ? "Saving..." : "Save report"}
                </Button>
              </div>
            </form>
          </>
        ) : null}

        {/* Footer when no report / error / loading */}
        {(reportNotFound && !report) || reportError || reportLoading ? (
          <div className="modal-footer modal-footer-spaced monthly-report-footer">
            <Button onClick={onClose} type="button" variant="tertiary">
              Close
            </Button>
          </div>
        ) : null}
      </SectionPanel>
      </div>
    </Modal>
  );
}
