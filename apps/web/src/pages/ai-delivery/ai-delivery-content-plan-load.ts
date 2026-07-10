/**
 * Content-plan GET historically returns AI_DELIVERY_PROJECT_NOT_FOUND when the
 * plan row is missing (backend reuses the project-not-found failure). Treat that
 * as an empty plan for load flows, while keeping auth and unexpected failures.
 */

export type ContentPlanLoadClassification =
  | "missing_plan"
  | "auth"
  | "forbidden"
  | "unexpected";

export function classifyContentPlanLoadFailure(input: {
  code?: string | null;
  message?: string | null;
}): ContentPlanLoadClassification {
  const code = (input.code ?? "").trim().toUpperCase();
  const message = (input.message ?? "").trim().toLowerCase();

  if (code === "AUTH_UNAUTHORIZED" || code === "AUTH_LOGIN_FAILED") {
    return "auth";
  }
  if (code === "AUTH_FORBIDDEN") {
    return "forbidden";
  }

  if (
    code === "AI_DELIVERY_CONTENT_PLAN_NOT_FOUND" ||
    code === "AI_DELIVERY_PROJECT_NOT_FOUND" ||
    message.includes("content plan not found") ||
    message.includes("ai delivery project was not found")
  ) {
    return "missing_plan";
  }

  return "unexpected";
}

export function isMissingContentPlanFailure(input: {
  code?: string | null;
  message?: string | null;
}): boolean {
  return classifyContentPlanLoadFailure(input) === "missing_plan";
}
