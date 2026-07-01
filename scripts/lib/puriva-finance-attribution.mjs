import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const financeAttributionJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/api/src/core/puriva-finance-attribution.json"
);

export const PURIVA_FINANCE_ATTRIBUTION_VERSION = "PURIVA_FINANCE_ATTRIBUTION_V1";
export const PURIVA_FINANCE_ATTRIBUTION_KIND = "puriva_finance_attribution_seed";
export const PURIVA_FINANCE_ATTRIBUTION_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_FINANCE_ATTRIBUTION_V1";

let cachedSeed = null;

export function getPurivaFinanceAttributionSeed() {
  if (!cachedSeed) {
    cachedSeed = JSON.parse(readFileSync(financeAttributionJsonPath, "utf8"));
  }
  return cachedSeed;
}

export function purivaFinanceAttributionInvoiceNumber(targetMonth) {
  return `PURIVA-FA-${targetMonth}`;
}

export function purivaFinanceAttributionServiceItemName() {
  const seed = getPurivaFinanceAttributionSeed();
  return `${PURIVA_FINANCE_ATTRIBUTION_MARKER} ${seed.servicePackageName}`;
}

export function purivaFinanceAttributionRecurringTitle() {
  return purivaFinanceAttributionServiceItemName();
}

export function buildPurivaFinanceAttributionContext(targetMonth, deps = {}) {
  const seed = getPurivaFinanceAttributionSeed();
  const unitPriceCents = seed.unitPriceCents;
  const currency = seed.currency;

  return {
    version: PURIVA_FINANCE_ATTRIBUTION_VERSION,
    kind: PURIVA_FINANCE_ATTRIBUTION_KIND,
    seedLabel: seed.seedLabel,
    targetMonth,
    servicePackage: {
      name: seed.servicePackageName,
      sku: seed.servicePackageSku,
      unitPriceCents,
      currency
    },
    revenueRecognitionMode: seed.revenueRecognitionMode,
    localTestOnly: true,
    noPaymentProcessor: true,
    localTestDisclaimer: seed.localTestDisclaimer,
    adminSummaryLabel: seed.adminSummaryLabel,
    links: {
      clientId: deps.clientId ?? "",
      aiDeliveryProjectId: deps.aiDeliveryProjectId ?? "",
      monthlyReportId: deps.monthlyReportId ?? "",
      serviceItemId: deps.serviceItemId ?? null,
      recurringInvoiceId: deps.recurringInvoiceId ?? null,
      invoicePlaceholderId: deps.invoicePlaceholderId ?? null
    },
    invoicePlaceholder: {
      status: "DRAFT",
      invoiceNumber: purivaFinanceAttributionInvoiceNumber(targetMonth),
      title: `${seed.invoicePlaceholderTitle} — ${targetMonth}`,
      totalCents: unitPriceCents,
      currency
    },
    recurringPackage: {
      interval: seed.recurringInterval,
      title: purivaFinanceAttributionRecurringTitle(),
      totalCents: unitPriceCents,
      currency
    }
  };
}

export function serializePurivaFinanceAttributionNotes(context) {
  const embed = {
    version: context.version,
    kind: context.kind,
    targetMonth: context.targetMonth,
    revenueRecognitionMode: context.revenueRecognitionMode,
    localTestOnly: context.localTestOnly,
    noPaymentProcessor: context.noPaymentProcessor,
    servicePackage: context.servicePackage,
    links: context.links,
    invoicePlaceholder: {
      invoiceNumber: context.invoicePlaceholder.invoiceNumber,
      status: context.invoicePlaceholder.status,
      totalCents: context.invoicePlaceholder.totalCents,
      currency: context.invoicePlaceholder.currency
    }
  };

  return [PURIVA_FINANCE_ATTRIBUTION_MARKER, context.localTestDisclaimer, JSON.stringify(embed)].join("\n");
}

export function financeAttributionHasPurivaMarker(value) {
  return typeof value === "string" && value.includes(PURIVA_FINANCE_ATTRIBUTION_MARKER);
}

export function parsePurivaFinanceAttributionEmbed(notes) {
  if (!financeAttributionHasPurivaMarker(notes)) {
    return null;
  }

  const jsonLine = (notes ?? "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("{") && line.includes(PURIVA_FINANCE_ATTRIBUTION_KIND));

  if (!jsonLine) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonLine);
    if (parsed.version !== PURIVA_FINANCE_ATTRIBUTION_VERSION || parsed.kind !== PURIVA_FINANCE_ATTRIBUTION_KIND) {
      return null;
    }

    const context = buildPurivaFinanceAttributionContext(parsed.targetMonth ?? "", parsed.links ?? {});
    if (parsed.servicePackage) {
      context.servicePackage = parsed.servicePackage;
    }
    if (parsed.invoicePlaceholder?.invoiceNumber) {
      context.invoicePlaceholder = {
        status: "DRAFT",
        invoiceNumber: parsed.invoicePlaceholder.invoiceNumber,
        title: parsed.invoicePlaceholder.title ?? context.invoicePlaceholder.title,
        totalCents: parsed.invoicePlaceholder.totalCents ?? context.invoicePlaceholder.totalCents,
        currency: parsed.invoicePlaceholder.currency ?? context.invoicePlaceholder.currency
      };
    }

    return context;
  } catch {
    return null;
  }
}

export function buildPurivaFinanceAttributionServiceItemRequest(context) {
  return {
    name: purivaFinanceAttributionServiceItemName(),
    description: `${context.localTestDisclaimer} SKU: ${context.servicePackage.sku}.`,
    unitPriceCents: context.servicePackage.unitPriceCents
  };
}

export function buildPurivaFinanceAttributionRecurringInvoiceRequest(clientId, context) {
  const lineItem = {
    description: context.servicePackage.name,
    quantity: 1,
    unitPriceCents: context.servicePackage.unitPriceCents,
    totalCents: context.servicePackage.unitPriceCents,
    sortOrder: 0
  };
  const monthStart = `${context.targetMonth}-01T00:00:00.000Z`;

  return {
    clientId,
    title: context.recurringPackage.title,
    interval: context.recurringPackage.interval,
    startDate: monthStart,
    endDate: null,
    nextRunDate: monthStart,
    currency: context.recurringPackage.currency,
    subtotalCents: context.recurringPackage.totalCents,
    taxCents: 0,
    discountCents: 0,
    totalCents: context.recurringPackage.totalCents,
    isActive: true,
    notes: serializePurivaFinanceAttributionNotes(context),
    lineItems: [lineItem]
  };
}

export function buildPurivaFinanceAttributionInvoicePlaceholderRequest(clientId, context) {
  const lineItem = {
    description: `${context.servicePackage.name} — ${context.targetMonth}`,
    quantity: 1,
    unitPriceCents: context.servicePackage.unitPriceCents,
    totalCents: context.servicePackage.unitPriceCents,
    sortOrder: 0
  };

  return {
    clientId,
    invoiceNumber: context.invoicePlaceholder.invoiceNumber,
    status: "DRAFT",
    issueDate: null,
    dueDate: null,
    paidAt: null,
    title: context.invoicePlaceholder.title,
    currency: context.invoicePlaceholder.currency,
    subtotalCents: context.invoicePlaceholder.totalCents,
    taxCents: 0,
    discountCents: 0,
    totalCents: context.invoicePlaceholder.totalCents,
    amountPaidCents: 0,
    notes: serializePurivaFinanceAttributionNotes(context),
    lineItems: [lineItem]
  };
}

export function buildPurivaFinanceAttributionAdminSummary(context) {
  return {
    label: context.adminSummaryLabel,
    targetMonth: context.targetMonth,
    localTestOnly: true,
    noPaymentProcessor: true,
    revenueRecognitionMode: context.revenueRecognitionMode,
    attributedAmountCents: context.invoicePlaceholder.totalCents,
    currency: context.invoicePlaceholder.currency,
    disclaimer: context.localTestDisclaimer,
    links: { ...context.links },
    financeEventSynced: false
  };
}

export function validatePurivaFinanceAttributionContext(context) {
  const errors = [];

  if (context.version !== PURIVA_FINANCE_ATTRIBUTION_VERSION) {
    errors.push("version mismatch");
  }
  if (context.kind !== PURIVA_FINANCE_ATTRIBUTION_KIND) {
    errors.push("kind mismatch");
  }
  if (!/^\d{4}-\d{2}$/.test(context.targetMonth)) {
    errors.push("targetMonth invalid");
  }
  if (context.revenueRecognitionMode !== "invoice_ready_placeholder") {
    errors.push("revenueRecognitionMode must be invoice_ready_placeholder");
  }
  if (context.localTestOnly !== true || context.noPaymentProcessor !== true) {
    errors.push("local test safety flags required");
  }
  if (!context.links.clientId) {
    errors.push("clientId required");
  }
  if (!context.links.aiDeliveryProjectId) {
    errors.push("aiDeliveryProjectId required");
  }
  if (!context.links.monthlyReportId) {
    errors.push("monthlyReportId required");
  }
  if (context.invoicePlaceholder.status !== "DRAFT") {
    errors.push("invoice placeholder must remain DRAFT");
  }
  if (context.servicePackage.unitPriceCents <= 0) {
    errors.push("service package amount must be positive");
  }

  return { ok: errors.length === 0, errors };
}

export function findUnsafeFinanceExposurePhrases(context) {
  const haystack = [
    context.localTestDisclaimer,
    context.adminSummaryLabel,
    context.servicePackage.name,
    serializePurivaFinanceAttributionNotes(context)
  ].join("\n");

  const forbidden = ["stripe", "quickbooks", "xero", "payment processor", "wire transfer due", "pay now"];
  return forbidden.filter((phrase) => haystack.toLowerCase().includes(phrase));
}

function invoiceMatchesPlaceholder(invoice, clientId, targetMonth) {
  if (!invoice || invoice.clientId !== clientId || invoice.isArchived) {
    return false;
  }
  return (
    invoice.invoiceNumber === purivaFinanceAttributionInvoiceNumber(targetMonth) ||
    financeAttributionHasPurivaMarker(invoice.notes) ||
    financeAttributionHasPurivaMarker(invoice.title)
  );
}

export async function ensurePurivaFinanceAttributionApiSeed({
  request,
  token,
  clientId,
  aiDeliveryProjectId,
  monthlyReportId,
  targetMonth,
  log = () => {}
}) {
  const created = {
    serviceItem: false,
    recurringInvoice: false,
    invoicePlaceholder: false
  };

  let context = buildPurivaFinanceAttributionContext(targetMonth, {
    clientId,
    aiDeliveryProjectId,
    monthlyReportId
  });

  const validation = validatePurivaFinanceAttributionContext(context);
  if (!validation.ok) {
    throw new Error(`Puriva finance attribution invalid: ${validation.errors.join("; ")}`);
  }

  const itemsResponse = await request("/invoice-items", { token });
  if (itemsResponse.status !== 200 || itemsResponse.body?.ok !== true) {
    throw new Error(`Invoice items list failed with HTTP ${itemsResponse.status}.`);
  }

  const serviceItemName = purivaFinanceAttributionServiceItemName();
  let serviceItem =
    (itemsResponse.body?.data?.invoiceItems ?? []).find(
      (entry) => entry.name === serviceItemName && entry.isArchived !== true
    ) ?? null;

  if (!serviceItem) {
    const createItemResponse = await request("/invoice-items", {
      method: "POST",
      token,
      body: buildPurivaFinanceAttributionServiceItemRequest(context)
    });
    if (createItemResponse.status !== 201 || createItemResponse.body?.ok !== true) {
      throw new Error(`Puriva finance service item create failed with HTTP ${createItemResponse.status}.`);
    }
    serviceItem = createItemResponse.body.data?.invoiceItem ?? null;
    created.serviceItem = true;
    log("created finance service item", serviceItem?.id ?? "missing");
  } else {
    log("reused finance service item", serviceItem.id);
  }

  context = buildPurivaFinanceAttributionContext(targetMonth, {
    clientId,
    aiDeliveryProjectId,
    monthlyReportId,
    serviceItemId: serviceItem?.id ?? null
  });

  const recurringResponse = await request("/recurring-invoices", { token });
  if (recurringResponse.status !== 200 || recurringResponse.body?.ok !== true) {
    throw new Error(`Recurring invoices list failed with HTTP ${recurringResponse.status}.`);
  }

  const recurringTitle = purivaFinanceAttributionRecurringTitle();
  let recurringInvoice =
    (recurringResponse.body?.data?.recurringInvoices ?? []).find(
      (entry) =>
        entry.clientId === clientId &&
        entry.title === recurringTitle &&
        entry.isArchived !== true &&
        financeAttributionHasPurivaMarker(entry.notes)
    ) ?? null;

  if (!recurringInvoice) {
    const createRecurringResponse = await request("/recurring-invoices", {
      method: "POST",
      token,
      body: buildPurivaFinanceAttributionRecurringInvoiceRequest(clientId, context)
    });
    if (createRecurringResponse.status !== 201 || createRecurringResponse.body?.ok !== true) {
      throw new Error(`Puriva recurring invoice create failed with HTTP ${createRecurringResponse.status}.`);
    }
    recurringInvoice = createRecurringResponse.body.data?.recurringInvoice ?? null;
    created.recurringInvoice = true;
    log("created recurring service package", recurringInvoice?.id ?? "missing");
  } else {
    log("reused recurring service package", recurringInvoice.id);
  }

  context = buildPurivaFinanceAttributionContext(targetMonth, {
    clientId,
    aiDeliveryProjectId,
    monthlyReportId,
    serviceItemId: serviceItem?.id ?? null,
    recurringInvoiceId: recurringInvoice?.id ?? null
  });

  const invoicesResponse = await request(`/invoices?clientId=${encodeURIComponent(clientId)}`, { token });
  if (invoicesResponse.status !== 200 || invoicesResponse.body?.ok !== true) {
    throw new Error(`Invoices list failed with HTTP ${invoicesResponse.status}.`);
  }

  let invoicePlaceholder =
    (invoicesResponse.body?.data?.invoices ?? [])
      .filter((entry) => entry.clientId === clientId)
      .find((entry) => invoiceMatchesPlaceholder(entry, clientId, targetMonth)) ?? null;

  if (!invoicePlaceholder) {
    const createInvoiceResponse = await request("/invoices", {
      method: "POST",
      token,
      body: buildPurivaFinanceAttributionInvoicePlaceholderRequest(clientId, context)
    });
    if (createInvoiceResponse.status !== 201 || createInvoiceResponse.body?.ok !== true) {
      throw new Error(`Puriva invoice placeholder create failed with HTTP ${createInvoiceResponse.status}.`);
    }
    invoicePlaceholder = createInvoiceResponse.body.data?.invoice ?? null;
    created.invoicePlaceholder = true;
    log("created invoice placeholder", invoicePlaceholder?.id ?? "missing");
  } else {
    log("reused invoice placeholder", invoicePlaceholder.id);
  }

  context = buildPurivaFinanceAttributionContext(targetMonth, {
    clientId,
    aiDeliveryProjectId,
    monthlyReportId,
    serviceItemId: serviceItem?.id ?? null,
    recurringInvoiceId: recurringInvoice?.id ?? null,
    invoicePlaceholderId: invoicePlaceholder?.id ?? null
  });

  const finalValidation = validatePurivaFinanceAttributionContext(context);
  if (!finalValidation.ok) {
    throw new Error(`Puriva finance attribution final invalid: ${finalValidation.errors.join("; ")}`);
  }

  const adminSummary = buildPurivaFinanceAttributionAdminSummary(context);
  const parsedNotes = parsePurivaFinanceAttributionEmbed(invoicePlaceholder?.notes ?? "");

  return {
    context,
    adminSummary,
    parsedNotes,
    serviceItem,
    recurringInvoice,
    invoicePlaceholder,
    created
  };
}

export function assertPurivaClientPortalFinanceAttributionAbsent(record, label, response) {
  const text = response.text ?? "";
  record(
    `${label} omits finance attribution marker`,
    !text.includes(PURIVA_FINANCE_ATTRIBUTION_MARKER),
    text.includes(PURIVA_FINANCE_ATTRIBUTION_MARKER) ? "finance marker leaked" : "clean"
  );
  record(
    `${label} omits finance attribution embed kind`,
    !text.includes(PURIVA_FINANCE_ATTRIBUTION_KIND),
    text.includes(PURIVA_FINANCE_ATTRIBUTION_KIND) ? "finance kind leaked" : "clean"
  );
  record(
    `${label} omits invoice placeholder ids`,
    !/"invoicePlaceholderId"/.test(text) && !/"recurringInvoiceId"/.test(text),
    /"invoicePlaceholderId"|"recurringInvoiceId"/.test(text) ? "finance ids leaked" : "clean"
  );
  record(
    `${label} omits admin revenue attribution summary`,
    !/"attributedAmountCents"/.test(text) && !/"financeEventSynced"/.test(text),
    /"attributedAmountCents"|"financeEventSynced"/.test(text) ? "admin summary leaked" : "clean"
  );
}
