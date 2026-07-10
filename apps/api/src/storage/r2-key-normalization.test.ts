import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildR2StorageKey, validateR2Upload } from "./r2.service";

describe("r2 key normalization (path/extension)", () => {
  it("uses mimeType for extension when filename has no allowed extension", () => {
    const key = buildR2StorageKey({
      tenantSlugOrId: "Acme Corp!",
      projectSlugOrId: "Project One",
      documentType: "documents",
      documentDate: new Date("2026-07-15T12:00:00.000Z"),
      originalFileName: "monthly-report",
      mimeType: "application/pdf"
    });

    assert.match(key, /^tenants\/acme-corp\/years\/2026\/projects\/project-one\/months\/07\/documents\/monthly-report-\d+-[a-f0-9]{8}\.pdf$/);
  });

  it("prefers filename extension over mimeType when both are allowed", () => {
    const key = buildR2StorageKey({
      tenantSlugOrId: "tenant-1",
      documentType: "invoices",
      documentDate: new Date("2026-01-01T00:00:00.000Z"),
      originalFileName: "invoice.PDF",
      mimeType: "application/pdf"
    });

    assert.match(key, /\.pdf$/);
    assert.equal(key.includes("tenants/tenant-1/"), true);
  });

  it("falls back to bin when mimeType is missing and filename has no extension", () => {
    const key = buildR2StorageKey({
      tenantSlugOrId: "t1",
      documentType: "documents",
      originalFileName: "untitled"
    });

    assert.match(key, /\.bin$/);
  });

  it("sanitizes path segments and rejects path traversal characters", () => {
    const key = buildR2StorageKey({
      tenantSlugOrId: "../evil/tenant",
      projectSlugOrId: "proj/../../x",
      documentType: "documents",
      originalFileName: "ok.pdf",
      mimeType: "application/pdf"
    });

    assert.equal(key.includes(".."), false);
    assert.equal(key.includes("//"), false);
    assert.match(key, /^tenants\/evil-tenant\//);
    assert.match(key, /\/projects\/proj-x\//);
  });

  it("validateR2Upload accepts pdf mime with extensionless name", () => {
    assert.equal(
      validateR2Upload({
        body: Buffer.from("%PDF-1.4"),
        mimeType: "application/pdf",
        originalFileName: "report"
      }),
      true
    );
  });
});
