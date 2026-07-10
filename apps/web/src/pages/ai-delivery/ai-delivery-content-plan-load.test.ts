import { describe, expect, it } from "vitest";
import {
  classifyContentPlanLoadFailure,
  isMissingContentPlanFailure,
} from "./ai-delivery-content-plan-load";

describe("ai-delivery-content-plan-load", () => {
  it("maps historical missing-plan 404 codes to missing_plan", () => {
    expect(
      classifyContentPlanLoadFailure({
        code: "AI_DELIVERY_PROJECT_NOT_FOUND",
        message: "AI Delivery project was not found.",
      }),
    ).toBe("missing_plan");
    expect(
      classifyContentPlanLoadFailure({
        code: "AI_DELIVERY_CONTENT_PLAN_NOT_FOUND",
        message: "Content plan not found.",
      }),
    ).toBe("missing_plan");
    expect(
      isMissingContentPlanFailure({
        code: "AI_DELIVERY_PROJECT_NOT_FOUND",
        message: "AI Delivery project was not found.",
      }),
    ).toBe(true);
  });

  it("keeps auth and unexpected failures distinct", () => {
    expect(classifyContentPlanLoadFailure({ code: "AUTH_UNAUTHORIZED", message: "Please sign in again." })).toBe(
      "auth",
    );
    expect(classifyContentPlanLoadFailure({ code: "AUTH_FORBIDDEN", message: "Forbidden" })).toBe("forbidden");
    expect(
      classifyContentPlanLoadFailure({
        code: "AI_DELIVERY_CONTENT_PLAN_RUNTIME_ERROR",
        message: "Fetching content plan could not be completed.",
      }),
    ).toBe("unexpected");
  });

  it("does not treat unrelated messages as missing plan", () => {
    expect(
      isMissingContentPlanFailure({
        code: "REQUEST_FAILED",
        message: "Request could not be completed.",
      }),
    ).toBe(false);
  });
});
