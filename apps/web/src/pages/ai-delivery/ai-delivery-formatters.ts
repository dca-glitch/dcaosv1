import { formatAiDeliveryDeliverableStatusLabel } from "@dca-os-v1/shared";
import type {
  AiDeliveryArticleImageSummary,
  AiDeliveryContentDraftSummary,
  AiDeliveryContentPlanSummary,
  AiDeliveryDeliverableFormValues,
  AiDeliveryDeliverableReviewSummary,
  AiDeliveryDeliverableSummary,
  WorkflowRunResultPreview
} from "./ai-delivery-types";

export function formatOptionalDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : "Not set";
}

/** Preview/approve/request-changes: URL fields or private hasDocument (storageKey). */
export function hasArticleImagePreviewReferenceUi(image: {
  previewImageUrl?: string | null;
  finalImageUrl?: string | null;
  hasDocument?: boolean;
}): boolean {
  return Boolean(
    (image.previewImageUrl ?? "").trim() ||
      (image.finalImageUrl ?? "").trim() ||
      image.hasDocument
  );
}

/** Final-ready: final URL or private hasDocument. */
export function hasArticleImageFinalReferenceUi(image: {
  finalImageUrl?: string | null;
  hasDocument?: boolean;
}): boolean {
  return Boolean((image.finalImageUrl ?? "").trim() || image.hasDocument);
}

export function formatPreview(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  if (!text) return "Not set";
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

export function formatContentPlanReviewStatus(plan: AiDeliveryContentPlanSummary | null): string {
  if (!plan) return "Pending / not requested";
  if (plan.status === "CLIENT_REVIEW_REQUESTED") return "Ready for review";
  if (plan.status === "CLIENT_APPROVED") return "Approved";
  if (plan.status === "CLIENT_CHANGES_REQUESTED") return "Changes requested";
  return "Draft / preparing";
}

export function formatContentPlanItemApprovalStatus(value?: string | null): string {
  if (!value || value === "DRAFT") return "Planned";
  if (value === "CLIENT_APPROVED") return "Approved";
  if (value === "CLIENT_CHANGES_REQUESTED") return "Changes requested";
  return formatEnumLabel(value);
}

export function formatContentDraftStatus(value?: string | null): string {
  if (!value || value === "DRAFT") return "Draft / preparing";
  if (value === "READY_FOR_REVIEW") return "Ready for review";
  if (value === "APPROVED") return "Approved";
  if (value === "CHANGES_REQUESTED") return "Changes requested";
  if (value === "ARCHIVED") return "Archived";
  return formatEnumLabel(value);
}

export function formatArticleImageStatus(value?: string | null): string {
  if (!value || value === "DRAFT") return "Draft / preparing";
  if (value === "READY_FOR_GENERATION") return "Preparing preview";
  if (value === "PREVIEW_READY") return "Preview ready";
  if (value === "CHANGES_REQUESTED") return "Changes requested";
  if (value === "APPROVED") return "Approved";
  if (value === "FINAL_READY") return "Final ready";
  if (value === "ARCHIVED") return "Archived";
  return formatEnumLabel(value);
}

export function formatDeliverableStatus(value?: string | null): string {
  // Delegates to the canonical shared status policy so admin, client portal, and API stay aligned.
  // Unknown/legacy statuses are humanized rather than silently coerced to DRAFT.
  return formatAiDeliveryDeliverableStatusLabel(value);
}

export function formatEnumLabel(value?: string | null): string {
  if (!value) return "Not set";
  return String(value).toLowerCase().replace(/_/g, " ").replace(/(^|\s)\S/g, (s) => s.toUpperCase());
}

export function parseWorkflowRunResultPreview(value: string | null | undefined): WorkflowRunResultPreview | null {
  const text = (value ?? "").trim();
  if (!text) return null;

  if (text.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      const record = parsed as Record<string, unknown>;
      return {
        version: typeof record.version === "string" ? record.version : null,
        gateway: typeof record.gateway === "string" ? record.gateway : null,
        model: typeof record.model === "string" ? record.model : null,
        outputType: typeof record.outputType === "string" ? record.outputType : null,
        title: typeof record.title === "string" ? record.title : null,
        summary: typeof record.summary === "string" ? record.summary : null,
        generatedAt: typeof record.generatedAt === "string" ? record.generatedAt : null,
        safeError: typeof record.safeError === "string" ? record.safeError : null
      };
    } catch {
      return null;
    }
  }

  const gatewayMatch = text.match(/^Gateway:\s*(.+)$/m);
  const modelMatch = text.match(/^Model:\s*(.+)$/m);
  const generatedAtMatch = text.match(/^Generated at:\s*(.+)$/m);
  const safeErrorMatch = text.match(/^Safe error:\s*(.+)$/m);

  if (!gatewayMatch && !modelMatch) {
    return null;
  }

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const metadataLineIndexes = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (
      line.startsWith("Gateway:") ||
      line.startsWith("Model:") ||
      line.startsWith("Generated at:") ||
      line.startsWith("Budget policy:") ||
      line.startsWith("Approximate input tokens:") ||
      line.startsWith("Max output tokens:") ||
      line.startsWith("Safe error:")
    ) {
      metadataLineIndexes.add(index);
    }
  }

  const contentLines = lines.filter((_, index) => !metadataLineIndexes.has(index));
  return {
    version: "AI_WORKFLOW_RESULT_V1",
    gateway: gatewayMatch?.[1]?.trim() ?? null,
    model: modelMatch?.[1]?.trim() ?? null,
    outputType: "summary",
    title: contentLines[0] ?? null,
    summary: contentLines[1] ?? contentLines[0] ?? null,
    generatedAt: generatedAtMatch?.[1]?.trim() ?? null,
    safeError: safeErrorMatch?.[1]?.trim() ?? null
  };
}

export function getDeliverableExportState(item: AiDeliveryDeliverableSummary): string {
  if ((item.exportUrl ?? "").trim()) return "Export URL reference set (visible to client in their portal).";
  if (item.hasDocument) return "Private document stored (admin download-reference only).";
  return "No export or storage reference recorded.";
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function canPackageApprovedContentDraft(draft: Pick<AiDeliveryContentDraftSummary, "isArchived" | "status"> | null | undefined) {
  return !!draft && draft.isArchived !== true && draft.status === "APPROVED";
}

export function canPackageApprovedArticleImage(image: Pick<AiDeliveryArticleImageSummary, "isArchived" | "status"> | null | undefined) {
  return !!image && image.isArchived !== true && ["APPROVED", "FINAL_READY"].includes(image.status);
}

export function deliverableStatusNeedsApprovedLinks(status: string | null | undefined) {
  return ["READY", "DELIVERED", "ACCEPTED"].includes((status ?? "").trim().toUpperCase());
}

export function deliverableFormHasReadyLinks(
  form: AiDeliveryDeliverableFormValues,
  drafts: AiDeliveryContentDraftSummary[],
  images: AiDeliveryArticleImageSummary[]
) {
  if (!deliverableStatusNeedsApprovedLinks(form.status)) {
    return true;
  }

  const linkedDraft = drafts.find((draft) => draft.id === form.contentDraftId) ?? null;
  const linkedImage = images.find((image) => image.id === form.articleImageId) ?? null;

  if (!linkedDraft && !linkedImage) {
    return false;
  }

  if (linkedDraft && !canPackageApprovedContentDraft(linkedDraft)) {
    return false;
  }

  if (linkedImage && !canPackageApprovedArticleImage(linkedImage)) {
    return false;
  }

  return true;
}

export function getMostRecentReview(reviews: AiDeliveryDeliverableReviewSummary[]): AiDeliveryDeliverableReviewSummary | null {
  return reviews.reduce<AiDeliveryDeliverableReviewSummary | null>((latest, review) => {
    if (!latest) return review;
    const latestTime = new Date(latest.updatedAt || latest.createdAt).getTime();
    const reviewTime = new Date(review.updatedAt || review.createdAt).getTime();
    return reviewTime > latestTime ? review : latest;
  }, null);
}

export function formatStatusBreakdown(items: Array<{ status: string }>, fallback = "No records loaded"): string {
  if (items.length === 0) return fallback;
  const counts = items.reduce<Record<string, number>>((summary, item) => {
    summary[item.status] = (summary[item.status] ?? 0) + 1;
    return summary;
  }, {});
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `${formatEnumLabel(status)}: ${count}`)
    .join(" - ");
}
