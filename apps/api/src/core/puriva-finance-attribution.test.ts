import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPurivaFinanceAttributionAdminSummary,
  buildPurivaFinanceAttributionContext,
  buildPurivaFinanceAttributionFinanceEventMetadata,
  buildPurivaFinanceAttributionInvoicePlaceholderRequest,
  buildPurivaFinanceAttributionRecurringInvoiceRequest,
  buildPurivaFinanceAttributionServiceItemRequest,
  financeAttributionHasPurivaMarker,
  findUnsafeFinanceExposurePhrases,
  parsePurivaFinanceAttributionEmbed,
  purivaFinanceAttributionInvoiceNumber,
  PURIVA_FINANCE_ATTRIBUTION_MARKER,
  PURIVA_FINANCE_ATTRIBUTION_VERSION,
  serializePurivaFinanceAttributionNotes,
  validatePurivaFinanceAttributionContext
} from "./puriva-finance-attribution";

describe("puriva-finance-attribution", () => {
  const targetMonth = "2026-07";
  const links = {
    clientId: "client-1",
    aiDeliveryProjectId: "adp-1",
    monthlyReportId: "report-1",
    serviceItemId: "item-1",
    recurringInvoiceId: "rec-1",
    invoicePlaceholderId: "inv-1"
  };

  it("builds monthly service package attribution context with delivery links", () => {
    const context = buildPurivaFinanceAttributionContext(targetMonth, links);

    assert.equal(context.version, PURIVA_FINANCE_ATTRIBUTION_VERSION);
    assert.equal(context.links.clientId, links.clientId);
    assert.equal(context.links.aiDeliveryProjectId, links.aiDeliveryProjectId);
    assert.equal(context.links.monthlyReportId, links.monthlyReportId);
    assert.equal(context.revenueRecognitionMode, "invoice_ready_placeholder");
    assert.equal(context.invoicePlaceholder.status, "DRAFT");
    assert.equal(context.localTestOnly, true);
    assert.equal(context.noPaymentProcessor, true);
  });

  it("uses deterministic invoice number and DRAFT placeholder status", () => {
    const context = buildPurivaFinanceAttributionContext(targetMonth, links);

    assert.equal(context.invoicePlaceholder.invoiceNumber, purivaFinanceAttributionInvoiceNumber(targetMonth));
    assert.equal(context.invoicePlaceholder.status, "DRAFT");
    assert.ok(context.servicePackage.unitPriceCents > 0);
  });

  it("serializes and parses finance attribution embed in invoice notes", () => {
    const context = buildPurivaFinanceAttributionContext(targetMonth, links);
    const notes = serializePurivaFinanceAttributionNotes(context);

    assert.ok(financeAttributionHasPurivaMarker(notes));
    const parsed = parsePurivaFinanceAttributionEmbed(notes);
    assert.ok(parsed);
    assert.equal(parsed.links.clientId, links.clientId);
    assert.equal(parsed.links.monthlyReportId, links.monthlyReportId);
  });

  it("builds admin-only summary without finance event sync for DRAFT placeholder", () => {
    const context = buildPurivaFinanceAttributionContext(targetMonth, links);
    const summary = buildPurivaFinanceAttributionAdminSummary(context);

    assert.equal(summary.localTestOnly, true);
    assert.equal(summary.noPaymentProcessor, true);
    assert.equal(summary.financeEventSynced, false);
    assert.equal(summary.links.monthlyReportId, links.monthlyReportId);
    assert.ok(summary.disclaimer.toLowerCase().includes("placeholder"));
  });

  it("builds finance-lite API requests for service item, recurring package, and invoice placeholder", () => {
    const context = buildPurivaFinanceAttributionContext(targetMonth, links);
    const serviceItem = buildPurivaFinanceAttributionServiceItemRequest(context);
    const recurring = buildPurivaFinanceAttributionRecurringInvoiceRequest(links.clientId, context);
    const invoice = buildPurivaFinanceAttributionInvoicePlaceholderRequest(links.clientId, context);

    assert.ok(serviceItem.name.includes(PURIVA_FINANCE_ATTRIBUTION_MARKER));
    assert.equal(recurring.interval, "MONTHLY");
    assert.equal(invoice.status, "DRAFT");
    assert.ok(financeAttributionHasPurivaMarker(invoice.notes));
    assert.equal(invoice.invoiceNumber, purivaFinanceAttributionInvoiceNumber(targetMonth));
  });

  it("builds finance event metadata linking delivery and invoice placeholder ids", () => {
    const context = buildPurivaFinanceAttributionContext(targetMonth, links);
    const metadata = buildPurivaFinanceAttributionFinanceEventMetadata(context);

    assert.equal(metadata.purivaFinanceAttributionVersion, PURIVA_FINANCE_ATTRIBUTION_VERSION);
    assert.equal(metadata.aiDeliveryProjectId, links.aiDeliveryProjectId);
    assert.equal(metadata.invoicePlaceholderId, links.invoicePlaceholderId);
    assert.equal(metadata.localTestOnly, true);
  });

  it("validates linked context and avoids unsafe finance exposure phrases", () => {
    const context = buildPurivaFinanceAttributionContext(targetMonth, links);
    const validation = validatePurivaFinanceAttributionContext(context);
    const unsafe = findUnsafeFinanceExposurePhrases(context);

    assert.equal(validation.ok, true);
    assert.equal(unsafe.length, 0);
  });
});
