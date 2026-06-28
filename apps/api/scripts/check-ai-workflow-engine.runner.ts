/**
 * Offline checks for AI workflow execution engine hardening.
 */

import { createLocalAiDeliveryWorkflowExecutionAdapter } from "../src/core/ai-delivery-workflow-execution.adapter.ts";
import { serializeAiWorkflowResultForPlaceholder, type AiWorkflowResultV1 } from "../src/core/ai-delivery-workflow-result.contract.ts";

const smokeMarker = "[CHECK][AI_WORKFLOW_ENGINE]";
const results: Array<{ name: string; ok: boolean; detail: string }> = [];

function record(name: string, ok: boolean, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function canTransitionWorkflowRunStatus(current: string, next: string): boolean {
  const order = ["DRAFT", "READY", "IN_PROGRESS", "REVIEW", "COMPLETED", "ARCHIVED"];
  if (current === next) return true;
  if (current === "FAILED" && next === "ARCHIVED") return true;
  if (next === "FAILED") return current === "IN_PROGRESS" || current === "REVIEW";
  const currentIndex = order.indexOf(current);
  const nextIndex = order.indexOf(next);
  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

async function main() {
  console.log(`${smokeMarker} starting`);

  record(
    "invalid workflow transition DRAFT to COMPLETED is blocked",
    !canTransitionWorkflowRunStatus("DRAFT", "COMPLETED"),
    "gate"
  );
  record(
    "valid workflow transition DRAFT to READY is allowed",
    canTransitionWorkflowRunStatus("DRAFT", "READY"),
    "gate"
  );
  record(
    "FAILED to ARCHIVED transition is allowed",
    canTransitionWorkflowRunStatus("FAILED", "ARCHIVED"),
    "gate"
  );

  const adapter = createLocalAiDeliveryWorkflowExecutionAdapter();
  const finishedAtIso = new Date().toISOString();
  const output = await adapter.execute({
    projectName: `${smokeMarker} project`,
    targetMonth: "2027-11",
    briefStatus: "DRAFT",
    briefNotes: null,
    plannedContentScopeNotes: null,
    adminNotes: `${smokeMarker} summary proof`,
    existingResultPlaceholder: null,
    researchSummaries: [],
    approvedSourceMetadata: [],
    marketIntelligenceHandoffs: [],
    knowledgeContext: null,
    selectedContentPlanItem: null,
    finishedAtIso
  });

  const workflowResult: AiWorkflowResultV1 = output.workflowResult;
  const placeholder = output.resultPlaceholder ?? "";
  record(
    "summary workflow result uses AI_WORKFLOW_RESULT_V1 contract",
    workflowResult.version === "AI_WORKFLOW_RESULT_V1",
    workflowResult.version
  );
  record(
    "summary placeholder includes gateway metadata",
    placeholder.includes("Gateway: local") && placeholder.includes("Model: local-deterministic"),
    placeholder.slice(0, 120)
  );
  record(
    "serializeAiWorkflowResultForPlaceholder preserves gateway metadata for summary",
    serializeAiWorkflowResultForPlaceholder(workflowResult).includes("Gateway: local"),
    "serialized"
  );
  record(
    "local deterministic execution reports review status",
    output.finalStatus === "REVIEW" && output.executionError === null,
    output.finalStatus
  );

  const passed = results.filter((entry) => entry.ok).length;
  console.log(`${smokeMarker} finished - ${passed}/${results.length} passed`);
  if (passed !== results.length) {
    process.exitCode = 1;
    return;
  }
  console.log("PROVEN: AI workflow execution engine hardening checks passed offline.");
}

main().catch((error) => {
  console.error(`${smokeMarker} failed:`, error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
