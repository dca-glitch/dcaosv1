import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AI_PROMPT_TEMPLATE_REGISTRY,
  getPromptTemplateMetadata,
  resolvePromptTemplateVersion
} from "./ai-prompt-template-registry.service";

describe("ai-prompt-template-registry", () => {
  it("resolves version for article draft task", () => {
    const version = resolvePromptTemplateVersion("article_draft", "content_drafting_agent");
    assert.equal(version, "article_draft@v1");
  });

  it("returns metadata for known template", () => {
    const meta = getPromptTemplateMetadata("compliance_review");
    assert.ok(meta);
    assert.equal(meta!.agentRole, "compliance_review_agent");
    assert.ok(meta!.safetyNotes.length > 0);
  });

  it("includes registry entries for core task types", () => {
    const taskTypes = new Set(AI_PROMPT_TEMPLATE_REGISTRY.map((entry) => entry.taskType));
    assert.ok(taskTypes.has("research_pack"));
    assert.ok(taskTypes.has("seo_plan"));
    assert.ok(taskTypes.has("compliance_review"));
  });
});
