import type { AiProviderConfig } from "../config";
import { executeOpenRouterTextSummary } from "../services/openrouter-text.service";

export interface AiDeliveryWorkflowExecutionStartInput {
  projectName: string;
  targetMonth: string;
  briefStatus: string;
  startedAtIso: string;
}

export interface AiDeliveryWorkflowExecutionAdapterInput {
  projectName: string;
  targetMonth: string;
  briefStatus: string;
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
  execute(input: AiDeliveryWorkflowExecutionAdapterInput): Promise<AiDeliveryWorkflowExecutionAdapterOutput>;
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
    async execute(input) {
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

function getOpenRouterFallbackReason(config: AiProviderConfig): string | null {
  if (config.textGateway !== "openrouter") {
    return null;
  }

  if (!config.hasOpenRouterApiKey) {
    return "OpenRouter API key is not configured";
  }

  if (!config.openRouterTextPrimaryModel) {
    return "OpenRouter primary text model is not configured";
  }

  return null;
}

export function createAiDeliveryWorkflowExecutionAdapter(config: AiProviderConfig): AiDeliveryWorkflowExecutionAdapter {
  const localAdapter = createLocalAiDeliveryWorkflowExecutionAdapter();

  if (config.textGateway !== "openrouter") {
    return localAdapter;
  }

  const fallbackReason = getOpenRouterFallbackReason(config);
  if (fallbackReason) {
    return {
      createStartedLogEntries(input) {
        return [
          ...localAdapter.createStartedLogEntries(input),
          ...buildExecutionLogEntries(input.startedAtIso, [
            `OpenRouter gateway requested but not fully configured (${fallbackReason}); falling back to local deterministic adapter.`
          ])
        ];
      },
      execute(input) {
        return localAdapter.execute(input);
      }
    };
  }

  return {
    createStartedLogEntries(input) {
      return buildExecutionLogEntries(input.startedAtIso, [
        "OpenRouter text execution started.",
        `Project "${input.projectName}" for ${input.targetMonth}; brief status ${input.briefStatus}.`,
        `Admin-only provider/model: OpenRouter / ${config.openRouterTextPrimaryModel}.`
      ]);
    },
    async execute(input) {
      const result = await executeOpenRouterTextSummary({
        config,
        projectName: input.projectName,
        targetMonth: input.targetMonth,
        briefStatus: input.briefStatus,
        adminNotes: input.adminNotes
      });

      if (!result.ok) {
        const executionError = result.errorMessage ?? "OpenRouter text execution failed.";
        return {
          finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [`OpenRouter text execution failed: ${executionError}`]),
          executionError,
          resultPlaceholder: null,
          finalStatus: "FAILED"
        };
      }

      return {
        finishedLogEntries: buildExecutionLogEntries(input.finishedAtIso, [
          "OpenRouter text execution completed successfully.",
          `Result placeholder prepared with admin-facing OpenRouter summary using model ${result.model}.`
        ]),
        executionError: null,
        resultPlaceholder: result.content,
        finalStatus: "REVIEW"
      };
    }
  };
}

export const localAiDeliveryWorkflowExecutionAdapter = createLocalAiDeliveryWorkflowExecutionAdapter();
