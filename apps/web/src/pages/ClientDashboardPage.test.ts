import { describe, expect, it } from "vitest";
import {
  buildClientDashboardAttentionItems,
  buildClientDashboardKpis,
  selectRecentClientBriefs
} from "./client-portal/client-dashboard-model";

describe("ClientDashboardPage model extraction", () => {
  it("does not invent performance or notification metrics", () => {
    const kpis = buildClientDashboardKpis([], 0);
    expect(kpis).toEqual({
      briefCount: 0,
      awaitingApprovalCount: 0,
      awaitingBriefCount: 0,
      submittedBriefCount: 0
    });
    expect(buildClientDashboardAttentionItems([], 0)).toEqual([]);
    expect(selectRecentClientBriefs([], 6)).toEqual([]);
  });
});
