import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal } from "../../components/Modal";
import { MetricCard, SectionPanel, StatusBadge } from "../../components/ui";
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
  storageKey?: string | null;
  hasDocument: boolean;
  isArchived: boolean;
  finalizedAt: string | null;
  miHandoffId?: string | null;
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

export type MonthlyMetricSnapshotFormValues = {
  targetMonth: string;
  sourceType: MonthlyMetricSourceType;
  status: "DRAFT" | "IMPORTED";
  gscClicks: string;
  gscImpressions: string;
  gscAverageCtr: string;
  gscAveragePosition: string;
  ga4Sessions: string;
  ga4Users: string;
  ga4PageViews: string;
  notes: string;
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

function emptyMetricsForm(targetMonth: string): MonthlyMetricSnapshotFormValues {
  return {
    targetMonth,
    sourceType: "HYBRID",
    status: "IMPORTED",
    gscClicks: "",
    gscImpressions: "",
    gscAverageCtr: "",
    gscAveragePosition: "",
    ga4Sessions: "",
    ga4Users: "",
    ga4PageViews: "",
    notes: ""
  };
}

function parseMetricInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatMetricInteger(value: number | null | undefined): string {
  return typeof value === "number" ? value.toLocaleString() : "—";
}

function formatMetricDecimal(value: number | null | undefined): string {
  return typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";
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
        setDocumentError("No download available.");
      }
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Unable to retrieve download link.");
    } finally {
      setDocumentDownloading(false);
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

    const status = report.isArchived ? "Archived" : formatReportStatus(report.status);
    const headline = report.title?.trim() || `${project.name} monthly report`;
    const documentState = report.hasDocument ? "Document attached" : "No document attached";
    const handoffState = report.exportUrl ? "Manual handoff URL set" : "No handoff URL";
    const visibilityState = report.status === "FINAL" ? "Client-safe when portal delivery is enabled" : "Admin-only working copy";
    const actionHint = report.isArchived
      ? "Restore the report to resume edits or replace the document."
      : report.status === "FINAL"
        ? "Finalize is complete; archive when the handoff is settled."
        : "Use review/finalize actions, then attach the report document.";

    return {
      status,
      headline,
      documentState,
      handoffState,
      visibilityState,
      actionHint
    };
  }, [project.name, report]);

  const metricsShellCopy = useMemo(() => {
    if (!metrics) return null;

    const dataStatus = metrics.computedTrendSummary.dataStatus;
    const trendHint =
      dataStatus === "READY"
        ? "Trend summary is ready from approved snapshots."
        : dataStatus === "PARTIAL"
          ? "Trend summary is partial; approve more snapshots to complete it."
          : "No approved snapshot data yet. Import or approve snapshots to populate the trend summary.";

    return {
      dataStatus,
      trendHint,
      snapshotCount: metrics.snapshots.length,
      trendMonthCount: metrics.computedTrendSummary.last12Months.length
    };
  }, [metrics]);

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
        <p className="muted-text">Admin-authored monthly report narrative. FINAL reports appear in Client Portal MVP for linked client users. Internal metrics and admin notes stay hidden.</p>

        {reportLoading ? (
          <LoadingState label="Loading monthly report..." />
        ) : reportError ? (
          <ErrorState title="Monthly report unavailable" message={reportError} />
        ) : reportNotFound && !report ? (
          <EmptyState
            title="No persisted monthly report yet"
            message="Create the admin report shell first. Snapshot metrics appear after a report exists. FINAL reports become client-visible in Client Portal MVP."
            action={(
              <button
                className="primary-action"
                disabled={reportSaving}
                onClick={() => void handleCreate()}
                type="button"
              >
                {reportSaving ? "Creating..." : "Create Monthly Report"}
              </button>
            )}
          />
        ) : report ? (
          <>
            {reportMessage ? (
              <div className="state-panel" style={{ marginBottom: "1rem", borderLeft: "4px solid var(--color-success)", paddingLeft: "1rem" }}>
                {reportMessage}
              </div>
            ) : null}

            <div className="entity-card" style={{ marginBottom: "1rem" }}>
              <div className="entity-card-header">
                <div>
                  <StatusBadge status={reportShellCopy?.status ?? formatReportStatus(report.status)} />
                  <h3>{reportShellCopy?.headline ?? `${project.name} monthly report`}</h3>
                  <p className="muted-text">
                    {project.targetMonth} • {project.client?.name ?? project.clientId}
                    {report.finalizedAt ? ` • Finalized ${formatDate(report.finalizedAt)}` : " • Draft workflow"}
                  </p>
                </div>
                <div className="card-actions">
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
              </div>

              <dl className="brief-grid" style={{ marginTop: "0.75rem" }}>
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
                        : "Pending"}
                  </dd>
                </div>
              </dl>

              <p className="muted-text" style={{ marginTop: "0.5rem" }}>
                {reportShellCopy?.actionHint ?? "Use the report actions above to manage the monthly workflow."}
              </p>

              {normalizedStatus === "FINAL" ? (
                <p className="muted-text" style={{ marginTop: "0.5rem" }}>
                  This report is final. Recommendations, completed deliverables, approved performance metrics, and the PDF appear in the Client Portal final monthly report view for linked client users.
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
                  Recommendations — Optional (client-visible when Final)
                  <textarea
                    disabled={!canEdit}
                    maxLength={4000}
                    rows={4}
                    value={form.recommendationsText}
                    onChange={(event) => setForm((current) => ({ ...current, recommendationsText: event.target.value }))}
                  />
                  <span className="muted-text">Admin-written recommendations for next month. Visible in the Client Portal final monthly report view when status is FINAL.</span>
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
                  <span className="muted-text">Manual safe handoff link (e.g. Google Doc, shared folder).</span>
                </label>
              </div>

              {/* Document upload / download */}
              {onUploadDocument || onDownloadDocument ? (
                <div className="field-panel" style={{ marginTop: "1rem" }}>
                  <h4>Report document</h4>
                  <p className="muted-text">This is the admin handoff surface: upload or download the stored report document, or keep a safe external export URL for manual sharing. PDF generation stays outside this block.</p>
                  {onGeneratePdf ? (
                    <div className="field-panel" style={{ marginBottom: "0.75rem" }}>
                      <h5>Generate PDF</h5>
                      <p className="muted-text">Admin-triggered PDF generation writes into the private monthly report document slot. No client/public link is exposed here, and the VPS/production R2 switch remains deferred.</p>
                      {pdfMessage ? (
                        <div className="state-panel" style={{ marginBottom: "0.75rem", borderLeft: "4px solid var(--color-success)", paddingLeft: "1rem" }}>
                          {pdfMessage}
                        </div>
                      ) : null}
                      {pdfError ? (
                        <div className="state-panel" role="alert" style={{ marginBottom: "0.75rem", borderLeft: "4px solid var(--color-error)", paddingLeft: "1rem" }}>
                          {pdfError}
                        </div>
                      ) : null}
                      <div className="card-actions">
                        <button
                          className="secondary-action"
                          disabled={pdfGenerating || report.isArchived}
                          onClick={() => void handleGeneratePdf()}
                          type="button"
                        >
                          {pdfGenerating ? "Generating..." : "Generate PDF"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {documentMessage ? (
                    <div className="state-panel" style={{ marginBottom: "0.75rem", borderLeft: "4px solid var(--color-success)", paddingLeft: "1rem" }}>
                      {documentMessage}
                    </div>
                  ) : null}
                  {documentError ? (
                    <div className="state-panel" role="alert" style={{ marginBottom: "0.75rem", borderLeft: "4px solid var(--color-error)", paddingLeft: "1rem" }}>
                      {documentError}
                    </div>
                  ) : null}
                  {report.hasDocument ? (
                    <p className="muted-text" style={{ marginBottom: "0.5rem" }}>A report document has been uploaded.</p>
                  ) : (
                    <p className="muted-text" style={{ marginBottom: "0.5rem" }}>No report document uploaded yet.</p>
                  )}
                  <div className="card-actions">
                    {onDownloadDocument && report.hasDocument ? (
                      <button
                        className="secondary-action"
                        disabled={documentDownloading}
                        onClick={() => void handleDownloadDocument()}
                        type="button"
                      >
                        {documentDownloading ? "Loading..." : "Download report document"}
                      </button>
                    ) : null}
                    {onUploadDocument ? (
                      <label style={{ cursor: documentUploading ? "wait" : "pointer" }}>
                        <span className="secondary-action" style={{ pointerEvents: documentUploading ? "none" : undefined }}>
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

              {/* Market Intelligence internal context (admin-only, not exposed to client portal) */}
              {onFetchMiContext ? (
                <SectionPanel
                  title="Market Intelligence context"
                  description="Internal admin context from an approved Market Intelligence handoff. Not exposed to client portal."
                >
                  {miContextLoading ? (
                    <LoadingState label="Loading MI context..." />
                  ) : (
                    <>
                      {miContextMessage ? (
                        <div className="state-panel" style={{ marginBottom: "0.75rem", borderLeft: "4px solid var(--color-success)", paddingLeft: "1rem" }}>
                          {miContextMessage}
                        </div>
                      ) : null}
                      {miContextError ? (
                        <div className="state-panel" role="alert" style={{ marginBottom: "0.75rem", borderLeft: "4px solid var(--color-error)", paddingLeft: "1rem" }}>
                          {miContextError}
                        </div>
                      ) : null}
                      {miContext?.handoff ? (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <p className="muted-text">
                            <strong>Linked handoff:</strong> {miContext.handoff.title}
                            {" — "}
                            <StatusBadge status={miContext.handoff.handoffStatus} />
                          </p>
                          {miDraftEditing ? (
                            <div style={{ marginTop: "0.5rem" }}>
                              <textarea
                                rows={8}
                                style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8125rem" }}
                                value={miDraftValue}
                                onChange={(e) => setMiDraftValue(e.target.value)}
                              />
                              <div className="card-actions" style={{ marginTop: "0.5rem" }}>
                                <button className="primary-action" disabled={miContextLoading} onClick={() => void handleMiDraftSave()} type="button">
                                  Save draft
                                </button>
                                <button className="secondary-action" onClick={() => setMiDraftEditing(false)} type="button">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {miContext.miContextDraft ? (
                                <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.8125rem", background: "var(--color-surface)", padding: "0.75rem", borderRadius: "0.25rem", marginTop: "0.5rem", maxHeight: "14rem", overflow: "auto" }}>
                                  {miContext.miContextDraft}
                                </pre>
                              ) : null}
                              <div className="card-actions" style={{ marginTop: "0.5rem" }}>
                                {onUpdateMiContextDraft ? (
                                  <button
                                    className="secondary-action"
                                    disabled={miContextLoading}
                                    onClick={() => { setMiDraftValue(miContext.miContextDraft ?? ""); setMiDraftEditing(true); }}
                                    type="button"
                                  >
                                    Edit draft
                                  </button>
                                ) : null}
                                {onRemoveMiHandoff ? (
                                  <button className="secondary-action" disabled={miContextLoading} onClick={() => void handleMiRemove()} type="button">
                                    Remove context
                                  </button>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <p className="muted-text">No Market Intelligence context linked yet. Apply a READY handoff by its ID.</p>
                          {onApplyMiHandoff ? (
                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center" }}>
                              <input
                                placeholder="Handoff ID"
                                style={{ flex: 1 }}
                                type="text"
                                value={miApplyHandoffId}
                                onChange={(e) => setMiApplyHandoffId(e.target.value)}
                              />
                              <button
                                className="secondary-action"
                                disabled={miContextLoading || !miApplyHandoffId.trim()}
                                onClick={() => void handleMiApply()}
                                type="button"
                              >
                                Apply
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </>
                  )}
                </SectionPanel>
              ) : null}

              <SectionPanel
                title="GA/GSC Metrics"
                description="Snapshot metrics imported manually for this monthly report. This block does not sync live with Google."
                className="metrics-section"
              >
                <p className="muted-text" style={{ marginBottom: "0.75rem" }}>Snapshot metrics are admin-only and snapshot-first. Live Google sync remains deferred.</p>
                {metricsLoading ? (
                  <LoadingState label="Loading snapshot metrics..." />
                ) : metricsError ? (
                  <ErrorState title="Metrics unavailable" message={metricsError} />
                ) : metrics ? (
                  <>
                    {metricsMessage ? (
                      <div className="state-panel" style={{ marginBottom: "0.75rem", borderLeft: "4px solid var(--color-success)", paddingLeft: "1rem" }}>
                        {metricsMessage}
                      </div>
                    ) : null}
                    {metricsActionError ? (
                      <div className="state-panel" role="alert" style={{ marginBottom: "0.75rem", borderLeft: "4px solid var(--color-error)", paddingLeft: "1rem" }}>
                        {metricsActionError}
                      </div>
                    ) : null}

                    <div className="state-panel" style={{ marginBottom: "1rem" }}>
                      <strong>Trend summary</strong>
                      <p className="muted-text" style={{ marginTop: "0.25rem" }}>
                        {metricsShellCopy?.trendHint ?? "Trend summary is waiting for approved snapshots."}
                      </p>
                      <dl className="brief-grid" style={{ marginTop: "0.75rem" }}>
                        <div>
                          <dt>Snapshot status</dt>
                          <dd>{metricsShellCopy?.dataStatus ?? "Not set"}</dd>
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
                          <dd>{metrics.computedTrendSummary.latestMonth ?? "Not set"}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="summary-grid metric-grid" style={{ marginBottom: "1rem" }}>
                      <MetricCard
                        accent={metrics.computedTrendSummary.dataStatus === "READY" ? "success" : "warning"}
                        helper={`${metrics.snapshots.length} snapshot${metrics.snapshots.length === 1 ? "" : "s"}`}
                        label="Data status"
                        value={metrics.computedTrendSummary.dataStatus}
                      />
                      <MetricCard
                        accent="cyan"
                        helper="Latest approved month in the trend summary"
                        label="Latest month"
                        value={metrics.computedTrendSummary.latestMonth ?? "Not set"}
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
                      <div className="modal-footer" style={{ marginTop: "0.75rem" }}>
                        <button className="primary-action" disabled={metricsSaving} onClick={() => void handleImportMetrics()} type="button">
                          {metricsSaving ? "Importing..." : "Import snapshot metrics"}
                        </button>
                      </div>
                    </div>

                    {metrics.snapshots.length === 0 ? (
                      <div className="state-panel">No snapshot metrics have been imported yet.</div>
                    ) : (
                      <div className="table-wrap" aria-label="Monthly metrics snapshots" style={{ marginBottom: "1rem" }}>
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
                                    <button
                                      className="secondary-action"
                                      disabled={metricsSaving || snapshot.status === "APPROVED" || snapshot.status === "ARCHIVED"}
                                      onClick={() => void handleApproveMetricSnapshot(snapshot.id)}
                                      type="button"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="secondary-action"
                                      disabled={metricsSaving || snapshot.status === "ARCHIVED"}
                                      onClick={() => void handleArchiveMetricSnapshot(snapshot.id)}
                                      type="button"
                                    >
                                      Archive
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {metrics.computedTrendSummary.last12Months.length > 0 ? (
                      <div className="table-wrap" aria-label="Monthly metrics trend summary">
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
                    message="Create or open the persisted monthly report first. Metrics remain admin-only, snapshot-first, and do not sync live with Google."
                  />
                )}
              </SectionPanel>

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
