import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AI_PROVIDER_REGISTRY,
  AI_ROLE_PROVIDER_MAPPINGS,
  listAiProviderRegistrySnapshot,
  resolveProviderForRole
} from "./ai-provider-registry.service";
import type { AiAgentRole } from "@dca-os-v1/shared";

const ALL_ROLES: AiAgentRole[] = [
  "research_agent",
  "seo_planning_agent",
  "content_drafting_agent",
  "rewrite_localization_agent",
  "compliance_review_agent",
  "report_narrative_agent",
  "image_prompt_agent",
  "image_generation_agent",
  "vision_technical_qa_agent",
  "local_disabled_safe_agent"
];

describe("ai-provider-registry", () => {
  it("maps every agent role to a provider mapping", () => {
    for (const role of ALL_ROLES) {
      const mapping = AI_ROLE_PROVIDER_MAPPINGS.find((entry) => entry.role === role);
      assert.ok(mapping, `missing mapping for ${role}`);
      assert.ok(AI_PROVIDER_REGISTRY[mapping!.primaryProviderKey], `primary missing for ${role}`);
    }
  });

  it("never resolves to a live provider when placeholders are disabled", () => {
    for (const role of ALL_ROLES) {
      const resolution = resolveProviderForRole(role);
      assert.notEqual(resolution.effective.executionMode, "live");
      assert.ok(
        resolution.effective.executionMode === "local" || resolution.effective.executionMode === "disabled"
      );
    }
  });

  it("lists registry snapshot with all providers", () => {
    const snapshot = listAiProviderRegistrySnapshot();
    assert.ok(snapshot.providers.length >= 9);
    assert.equal(snapshot.roleMappings.length, ALL_ROLES.length);
  });

  it("keeps openrouter gateway disabled by default", () => {
    const entry = AI_PROVIDER_REGISTRY.openrouter_gateway;
    assert.equal(entry.enabled, false);
    assert.equal(entry.executionMode, "disabled");
  });
});
