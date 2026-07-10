import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidGa4PropertyId,
  validateGa4PropertyMapping
} from "./ga-gsc-property-mapping";

describe("ga-gsc-property-mapping (G519)", () => {
  it("accepts properties/{digits} with full mapping", () => {
    const result = validateGa4PropertyMapping({
      tenantId: "tenant-1",
      aiDeliveryProjectId: "project-1",
      clientDomain: "example.com",
      ga4PropertyId: "properties/123456789",
      reportingTimezone: "Asia/Bangkok",
      ga4PropertyDisplayName: "Puriva Web"
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.missingFields, []);
    assert.equal(result.invalidGa4PropertyId, false);
    assert.equal(result.normalized?.ga4PropertyId, "properties/123456789");
    assert.equal(result.liveSyncDeferred, true);
    assert.equal(result.secretFieldsAllowed, false);
  });

  it("rejects missing fields and invalid property id shapes", () => {
    assert.equal(isValidGa4PropertyId("123"), false);
    assert.equal(isValidGa4PropertyId("properties/abc"), false);
    assert.equal(isValidGa4PropertyId("properties/1"), true);

    const missing = validateGa4PropertyMapping({
      tenantId: "tenant-1",
      ga4PropertyId: "properties/1"
    });
    assert.equal(missing.ok, false);
    assert.ok(missing.missingFields.includes("aiDeliveryProjectId"));
    assert.ok(missing.missingFields.includes("clientDomain"));
    assert.ok(missing.missingFields.includes("reportingTimezone"));

    const invalid = validateGa4PropertyMapping({
      tenantId: "tenant-1",
      aiDeliveryProjectId: "project-1",
      clientDomain: "example.com",
      ga4PropertyId: "UA-123",
      reportingTimezone: "UTC"
    });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.invalidGa4PropertyId, true);
    assert.equal(invalid.normalized, null);
  });
});
