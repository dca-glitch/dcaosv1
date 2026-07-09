import type {
  AiAgentRole,
  AiMaterialClass,
  AiMaterialReference,
  AiPolicyDecision
} from "@dca-os-v1/shared";
import { getAiAgentRoleDefinition } from "./ai-agent-role-registry";

export const AI_MATERIAL_POLICY_VERSION = "AI_MATERIAL_POLICY_V1";

const ALWAYS_FORBIDDEN: AiMaterialClass[] = ["forbidden_medical_data"];

const DEFAULT_EXCLUDED: AiMaterialClass[] = ["saas_user_account_billing_data"];

const BEFORE_AFTER_ALLOWED_ROLES = new Set<AiAgentRole>(["vision_technical_qa_agent"]);

export function classifyMaterialExclusion(
  materialClass: AiMaterialClass,
  agentRole: AiAgentRole
): { included: boolean; exclusionReason: string | null } {
  if (ALWAYS_FORBIDDEN.includes(materialClass)) {
    return {
      included: false,
      exclusionReason: "Medical/patient data is forbidden in all AI workflows."
    };
  }

  if (DEFAULT_EXCLUDED.includes(materialClass)) {
    return {
      included: false,
      exclusionReason: "SaaS/user/account/billing data is not sent to AI by default."
    };
  }

  if (materialClass === "before_after_asset" && !BEFORE_AFTER_ALLOWED_ROLES.has(agentRole)) {
    return {
      included: false,
      exclusionReason: "Before/after assets are restricted to Vision Technical QA when explicitly enabled."
    };
  }

  const roleDefinition = getAiAgentRoleDefinition(agentRole);
  if (!roleDefinition) {
    return { included: false, exclusionReason: `Unknown agent role "${agentRole}".` };
  }

  if (roleDefinition.forbiddenMaterialClasses.includes(materialClass)) {
    return {
      included: false,
      exclusionReason: `Material class "${materialClass}" is forbidden for role "${agentRole}".`
    };
  }

  if (!roleDefinition.allowedMaterialClasses.includes(materialClass)) {
    return {
      included: false,
      exclusionReason: `Material class "${materialClass}" is not in the allowed set for role "${agentRole}".`
    };
  }

  return { included: true, exclusionReason: null };
}

export function applyAiMaterialPolicy(
  agentRole: AiAgentRole,
  materials: AiMaterialReference[]
): {
  inputMaterials: AiMaterialReference[];
  excludedMaterials: AiMaterialReference[];
  policyDecision: AiPolicyDecision;
} {
  const inputMaterials: AiMaterialReference[] = [];
  const excludedMaterials: AiMaterialReference[] = [];
  const checks: string[] = [];

  for (const material of materials) {
    const decision = classifyMaterialExclusion(material.materialClass, agentRole);
    const normalized: AiMaterialReference = {
      ...material,
      included: decision.included,
      exclusionReason: decision.exclusionReason
    };

    if (decision.included) {
      inputMaterials.push(normalized);
      checks.push(`ALLOW:${material.materialClass}`);
    } else {
      excludedMaterials.push(normalized);
      checks.push(`EXCLUDE:${material.materialClass}`);
    }
  }

  const blocked = excludedMaterials.some((m) => m.materialClass === "forbidden_medical_data");
  const policyDecision: AiPolicyDecision = {
    allowed: !blocked,
    blockedReason: blocked ? "Forbidden medical data detected in material set." : null,
    checks
  };

  return { inputMaterials, excludedMaterials, policyDecision };
}

export function buildDefaultAiSafeMaterialSet(
  workflow: string
): AiMaterialReference[] {
  const base: AiMaterialReference[] = [
    {
      materialClass: "client_brief",
      referenceId: null,
      label: "Client brief (approved context)",
      included: true,
      exclusionReason: null
    },
    {
      materialClass: "approved_business_facts",
      referenceId: null,
      label: "Approved business facts",
      included: true,
      exclusionReason: null
    }
  ];

  if (workflow.includes("seo") || workflow.includes("content")) {
    base.push({
      materialClass: "public_research",
      referenceId: null,
      label: "Public research notes",
      included: true,
      exclusionReason: null
    });
  }

  return base;
}
