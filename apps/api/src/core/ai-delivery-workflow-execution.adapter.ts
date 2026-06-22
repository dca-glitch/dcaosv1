export interface AiDeliveryWorkflowExecutionStartInput {
  projectName: string;
  targetMonth: string;
  briefStatus: string;
  startedAtIso: string;
}

export interface AiDeliveryWorkflowExecutionAdapterInput {
  projectName: string;
  targetMonth: string;
  adminNotes: string | null;
  existingResultPlaceholder: string | null;
  finishedAtIso: string;
}

export interface AiDeliveryWorkflowExecutionAdapterOutput {
  finishedLogEntries: string[];
  executionError: string | null;
  resultPlaceholder: string | null;
  finalStatus: "FAILED" | "REVIEW";
}

export interface AiDeliveryWorkflowExecutionAdapter {
  createStartedLogEntries(input: AiDeliveryWorkflowExecutionStartInput): string[];
  execute(input: AiDeliveryWorkflowExecutionAdapterInput): AiDeliveryWorkflowExecutionAdapterOutput;
}

function shouldSimulateAiDeliveryWorkflowFailure(adminNotes: string | null): boolean {
  return (adminNotes ?? "").toLowerCase().includes("[stub-fail]");
}

function buildExecutionLogEntries(timestamp: string, lines: string[]): string[] {
  return lines.map((line) => `[${timestamp}] ${line}`);
}

export function createLocalAiDeliveryWorkflowExecutionAdapter(): AiDeliveryWorkflowExecutionAdapter {
  return {
    createStartedLogEntries(input) {
      return buildExecutionLogEntries(input.startedAtIso, [
        "Stub execution started.",
        `Project "${input.projectName}" for ${input.targetMonth}; brief status ${input.briefStatus}.`,
        "Local deterministic execution only. No external AI services were called."
      ]);
    },
    execute(input) {
      if (shouldSimulateAiDeliveryWorkflowFailure(input.adminNotes)) {
        const executionError = "Stub execution failed because admin notes include [stub-fail].";
        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [`Stub execution failed: ${executionError}`]),
          executionError,
          resultPlaceholder: null,
          finalStatus: "FAILED"
        };
      }

      const resultPlaceholder =
        input.existingResultPlaceholder ??
        `Stub workflow output prepared for admin review for ${input.projectName} (${input.targetMonth}). No external AI services were called.`;

      return {
        finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
          "Stub execution completed successfully.",
          "Result placeholder prepared and moved to admin review."
        ]),
        executionError: null,
        resultPlaceholder,
        finalStatus: "REVIEW"
      };
    }
  };
}

export const localAiDeliveryWorkflowExecutionAdapter = createLocalAiDeliveryWorkflowExecutionAdapter();
