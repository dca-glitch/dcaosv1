import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getClientOperatingPackConfigFromBindingKey,
  isRegisteredOperatingPackBindingKey,
  listClientOperatingPackBindingKeys,
  normalizeOperatingPackBindingKey,
  PURIVA_OPERATING_PACK_BINDING_KEY,
  PURIVA_OPERATING_PACK_V1
} from "@dca-os-v1/shared";
import { lookupOperatingPackConfigFromBindingKey } from "./client-operating-pack.resolver";
import { resolveMonthlyCapUsd, isAiBudgetBlocked, buildAiBudgetSnapshot, PURIVA_AI_MONTHLY_CAP_USD } from "./ai-budget-guard.service";

describe("client operating pack binding registry", () => {
  it("lists PURIVA_OPERATING_PACK_V1 as the binding key", () => {
    assert.deepEqual(listClientOperatingPackBindingKeys(), ["PURIVA_OPERATING_PACK_V1"]);
    assert.equal(PURIVA_OPERATING_PACK_BINDING_KEY, "PURIVA_OPERATING_PACK_V1");
  });

  it("normalizes binding and registry aliases to PURIVA_OPERATING_PACK_V1", () => {
    assert.equal(normalizeOperatingPackBindingKey("PURIVA_OPERATING_PACK_V1"), "PURIVA_OPERATING_PACK_V1");
    assert.equal(normalizeOperatingPackBindingKey("puriva"), "PURIVA_OPERATING_PACK_V1");
    assert.equal(normalizeOperatingPackBindingKey("  puriva  "), "PURIVA_OPERATING_PACK_V1");
  });

  it("rejects unknown and empty keys fail-closed", () => {
    assert.equal(normalizeOperatingPackBindingKey("PURIVA"), null);
    assert.equal(normalizeOperatingPackBindingKey("unknown-pack"), null);
    assert.equal(normalizeOperatingPackBindingKey(""), null);
    assert.equal(normalizeOperatingPackBindingKey(null), null);
    assert.equal(isRegisteredOperatingPackBindingKey("typo"), false);
  });

  it("resolves Puriva pack config from binding key", () => {
    const config = getClientOperatingPackConfigFromBindingKey("PURIVA_OPERATING_PACK_V1");
    assert.equal(config.packKey, "puriva");
    assert.equal(config.monthlyAiCapUsd, 100);
    assert.equal(config, PURIVA_OPERATING_PACK_V1);
  });
});

describe("lookupOperatingPackConfigFromBindingKey", () => {
  it("returns database-style success for Puriva binding", () => {
    const result = lookupOperatingPackConfigFromBindingKey("PURIVA_OPERATING_PACK_V1");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.operatingPackKey, "PURIVA_OPERATING_PACK_V1");
      assert.equal(result.resolvedPackKey, "puriva");
      assert.equal(result.config.monthlyAiCapUsd, 100);
    }
  });

  it("returns PACK_BINDING_MISSING for null", () => {
    const result = lookupOperatingPackConfigFromBindingKey(null);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "PACK_BINDING_MISSING");
    }
  });

  it("returns PACK_KEY_UNKNOWN for corrupt key", () => {
    const result = lookupOperatingPackConfigFromBindingKey("not-a-pack");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "PACK_KEY_UNKNOWN");
    }
  });
});

describe("ai-budget-guard pack binding fail-closed", () => {
  it("applies Puriva $100 only for registered binding keys", () => {
    assert.equal(resolveMonthlyCapUsd("PURIVA_OPERATING_PACK_V1"), PURIVA_AI_MONTHLY_CAP_USD);
    assert.equal(resolveMonthlyCapUsd("puriva"), PURIVA_AI_MONTHLY_CAP_USD);
  });

  it("does not silently assign Puriva cap to unbound or unknown keys", () => {
    assert.equal(resolveMonthlyCapUsd(null), null);
    assert.equal(resolveMonthlyCapUsd(undefined), null);
    assert.equal(resolveMonthlyCapUsd("unknown"), null);
  });

  it("blocks AI budget when pack is unbound", () => {
    const budget = buildAiBudgetSnapshot({
      operatingPackKey: null,
      taskType: "article_draft",
      spentThisPeriodUsd: 0
    });
    const blocked = isAiBudgetBlocked(budget);
    assert.equal(blocked.blocked, true);
    assert.match(String(blocked.reason), /fail-closed|binding missing/i);
  });
});
