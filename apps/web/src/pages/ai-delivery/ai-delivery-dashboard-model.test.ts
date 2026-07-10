import { describe, expect, it } from "vitest";
import {
  buildAiDeliveryActionQueue,
  buildAiDeliveryDashboardKpis,
  buildAiDeliveryDashboardRows,
  buildAiDeliveryPipelineStages,
  inferProjectPipelineStage,
} from "./ai-delivery-dashboard-model";
import type { AiDeliveryProjectSummary } from "./AiDeliveryPage";

function project(partial: Partial<AiDeliveryProjectSummary> & { id: string }): AiDeliveryProjectSummary {
  return {
    id: partial.id,
    clientId: partial.clientId ?? "client-1",
    client: partial.client ?? { id: "client-1", name: "Acme" },
    projectId: partial.projectId ?? null,
    project: partial.project ?? { id: "proj-1", name: "SEO" },
    name: partial.name ?? "June delivery",
    targetMonth: partial.targetMonth ?? "2026-06",
    plannedContentScopeNotes: partial.plannedContentScopeNotes ?? null,
    isArchived: partial.isArchived ?? false,
    brief: partial.brief ?? null,
    createdAt: partial.createdAt ?? "2026-06-01T00:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-06-02T00:00:00.000Z",
  };
}

describe("ai-delivery-dashboard-model", () => {
  it("infers brief stage when brief missing or not approved", () => {
    expect(inferProjectPipelineStage(project({ id: "a" }))).toBe("brief");
    expect(
      inferProjectPipelineStage(
        project({
          id: "b",
          brief: { id: "br", status: "SUBMITTED", createdAt: "", updatedAt: "" },
        }),
      ),
    ).toBe("brief");
  });

  it("infers research stage when brief approved", () => {
    expect(
      inferProjectPipelineStage(
        project({
          id: "c",
          brief: { id: "br", status: "APPROVED", createdAt: "", updatedAt: "" },
        }),
      ),
    ).toBe("research");
  });

  it("builds KPIs from active projects only", () => {
    const kpis = buildAiDeliveryDashboardKpis([
      project({ id: "1" }),
      project({ id: "2", isArchived: true }),
      project({
        id: "3",
        brief: { id: "b", status: "SUBMITTED", createdAt: "", updatedAt: "" },
      }),
    ]);
    expect(kpis.activeProjects).toBe(2);
    expect(kpis.pendingReviews).toBe(1);
    expect(kpis.clientApprovals).toBeNull();
  });

  it("queues projects missing brief or pending approval", () => {
    const queue = buildAiDeliveryActionQueue([
      project({ id: "1" }),
      project({
        id: "2",
        brief: { id: "b", status: "APPROVED", createdAt: "", updatedAt: "" },
      }),
    ]);
    expect(queue).toHaveLength(1);
    expect(queue[0]?.actionLabel).toBe("Create brief");
  });

  it("keeps queue and table next-action labels aligned for pending review", () => {
    const submitted = project({
      id: "submitted-1",
      brief: { id: "b", status: "SUBMITTED", createdAt: "", updatedAt: "" },
    });
    const queue = buildAiDeliveryActionQueue([submitted]);
    const rows = buildAiDeliveryDashboardRows([submitted]);
    expect(queue[0]?.actionLabel).toBe("Review brief");
    expect(rows[0]?.nextActionLabel).toBe("Review brief");
  });

  it("counts pipeline stages without fabricating downstream totals", () => {
    const stages = buildAiDeliveryPipelineStages([
      project({ id: "1" }),
      project({
        id: "2",
        brief: { id: "b", status: "APPROVED", createdAt: "", updatedAt: "" },
      }),
    ]);
    const brief = stages.find((s) => s.id === "brief");
    const research = stages.find((s) => s.id === "research");
    expect(brief?.count).toBe(1);
    expect(research?.count).toBe(1);
    expect(stages.find((s) => s.id === "plan")?.count).toBe(0);
  });
});
