import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyGscSiteUrl,
  extractGscSiteDomain,
  validateGscSiteUrlMapping
} from "./ga-gsc-site-url-mapping";

describe("ga-gsc-site-url-mapping (G520)", () => {
  it("accepts sc-domain and https URL-prefix mappings that match client domain", () => {
    const sc = validateGscSiteUrlMapping({
      tenantId: "tenant-1",
      aiDeliveryProjectId: "project-1",
      clientDomain: "example.com",
      gscSiteUrl: "sc-domain:example.com",
      reportingTimezone: "Asia/Bangkok"
    });
    assert.equal(sc.ok, true);
    assert.equal(sc.siteUrlKind, "sc_domain");
    assert.equal(sc.domainMatchesClient, true);
    assert.equal(sc.liveSyncDeferred, true);

    const prefix = validateGscSiteUrlMapping({
      tenantId: "tenant-1",
      aiDeliveryProjectId: "project-1",
      clientDomain: "example.com",
      gscSiteUrl: "https://www.example.com/",
      reportingTimezone: "UTC"
    });
    assert.equal(prefix.ok, true);
    assert.equal(prefix.siteUrlKind, "url_prefix");
    assert.equal(prefix.domainMatchesClient, true);
  });

  it("rejects invalid site URLs and domain mismatches", () => {
    assert.equal(classifyGscSiteUrl("example.com"), "invalid");
    assert.equal(classifyGscSiteUrl("http://example.com"), "invalid");
    assert.equal(extractGscSiteDomain("sc-domain:puriva.example"), "puriva.example");

    const mismatch = validateGscSiteUrlMapping({
      tenantId: "tenant-1",
      aiDeliveryProjectId: "project-1",
      clientDomain: "example.com",
      gscSiteUrl: "sc-domain:other.com",
      reportingTimezone: "UTC"
    });
    assert.equal(mismatch.ok, false);
    assert.equal(mismatch.domainMatchesClient, false);
    assert.equal(mismatch.normalized, null);

    const missing = validateGscSiteUrlMapping({
      tenantId: "tenant-1",
      gscSiteUrl: "sc-domain:example.com"
    });
    assert.equal(missing.ok, false);
    assert.ok(missing.missingFields.includes("clientDomain"));
  });
});
