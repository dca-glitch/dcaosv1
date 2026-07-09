/**
 * AI prompt template versioning skeleton (G56).
 * Metadata only — no live provider prompts stored here.
 */

export const AI_PROMPT_TEMPLATE_REGISTRY_VERSION = "AI_PROMPT_TEMPLATE_REGISTRY_V1";

export interface AiPromptTemplateMetadata {
  templateId: string;
  version: string;
  taskType: string;
  agentRole: string;
  clientPolicyProfile: string | null;
  outputSchemaRef: string | null;
  safetyNotes: string[];
}

export function formatPromptTemplateVersion(templateId: string, version: string): string {
  return `${templateId}@${version}`;
}
