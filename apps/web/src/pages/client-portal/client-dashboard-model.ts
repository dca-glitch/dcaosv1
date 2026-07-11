export type ClientDashboardBrief = {
  id: string;
  title: string;
  status: "DRAFT" | "AWAITING_CLIENT" | "SUBMITTED" | string;
  createdAt: string;
  hubCount: number;
  geoSeoCount: number;
  lifestyleCount: number;
  otherCount: number;
};

export type ClientDashboardAttentionItem = {
  id: string;
  kind: "brief" | "approval";
  title: string;
  detail: string;
  href: string;
  urgent: boolean;
};

export type ClientDashboardKpis = {
  briefCount: number;
  awaitingApprovalCount: number;
  awaitingBriefCount: number;
  submittedBriefCount: number;
};

export function formatClientBriefDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(parsed.getDate())}.${pad(parsed.getMonth() + 1)}.${parsed.getFullYear()}`;
}

export function formatClientBriefArticleSummary(brief: ClientDashboardBrief): string | null {
  const parts: string[] = [];
  if (brief.hubCount > 0) parts.push(`Hub ×${brief.hubCount}`);
  if (brief.geoSeoCount > 0) parts.push(`Geo SEO ×${brief.geoSeoCount}`);
  if (brief.lifestyleCount > 0) parts.push(`Lifestyle ×${brief.lifestyleCount}`);
  if (brief.otherCount > 0) parts.push(`Other ×${brief.otherCount}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function buildClientDashboardKpis(
  briefs: ClientDashboardBrief[],
  pendingApprovalCount: number
): ClientDashboardKpis {
  return {
    briefCount: briefs.length,
    awaitingApprovalCount: Math.max(0, pendingApprovalCount),
    awaitingBriefCount: briefs.filter((brief) => brief.status === "AWAITING_CLIENT").length,
    submittedBriefCount: briefs.filter((brief) => brief.status === "SUBMITTED").length
  };
}

export function buildClientDashboardAttentionItems(
  briefs: ClientDashboardBrief[],
  pendingApprovalCount: number
): ClientDashboardAttentionItem[] {
  const items: ClientDashboardAttentionItem[] = [];

  if (pendingApprovalCount > 0) {
    items.push({
      id: "pending-approvals",
      kind: "approval",
      title:
        pendingApprovalCount === 1
          ? "1 article needs your approval"
          : `${pendingApprovalCount} articles need your approval`,
      detail: "Review the draft and approve or request changes.",
      href: "pending-approvals",
      urgent: true
    });
  }

  const awaitingBriefs = briefs.filter((brief) => brief.status === "AWAITING_CLIENT");
  for (const brief of awaitingBriefs.slice(0, 4)) {
    items.push({
      id: `brief-${brief.id}`,
      kind: "brief",
      title: brief.title,
      detail: "This brief is waiting for your input.",
      href: "briefs",
      urgent: false
    });
  }

  return items;
}

export function selectRecentClientBriefs(
  briefs: ClientDashboardBrief[],
  limit = 6
): ClientDashboardBrief[] {
  return [...briefs]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit);
}
