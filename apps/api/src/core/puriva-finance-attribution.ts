/**
 * Puriva finance / delivery attribution v1 — deterministic local admin foundation.
 * Links Puriva monthly delivery context to finance-lite placeholders without payment processors or external accounting APIs.
 */

import financeAttributionSeed from "./puriva-finance-attribution.json";

export const PURIVA_FINANCE_ATTRIBUTION_VERSION = "PURIVA_FINANCE_ATTRIBUTION_V1";

export const PURIVA_FINANCE_ATTRIBUTION_KIND = "puriva_finance_attribution_seed";

export const PURIVA_FINANCE_ATTRIBUTION_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_FINANCE_ATTRIBUTION_V1";

export type PurivaFinanceAttributionRevenueRecognitionMode = "invoice_ready_placeholder";

export type PurivaFinanceAttributionServicePackage = {
  name: string;
  sku: string;
  unitPriceCents: number;
  currency: string;
};

export type PurivaFinanceAttributionLinks = {
  clientId: string;
  aiDeliveryProjectId: string;
  monthlyReportId: string;
  serviceItemId: string | null;
  recurringInvoiceId: string | null;
  invoicePlaceholderId: string | null;
};

export type PurivaFinanceAttributionInvoicePlaceholder = {
  status: "DRAFT";
  invoiceNumber: string;
  title: string;
  totalCents: number;
  currency: string;
};

export type PurivaFinanceAttributionRecurringPackage = {
  interval: "MONTHLY";
  title: string;
  totalCents: number;
  currency: string;
};

export type PurivaFinanceAttributionContext = {
  version: typeof PURIVA_FINANCE_ATTRIBUTION_VERSION;
  kind: typeof PURIVA_FINANCE_ATTRIBUTION_KIND;
  seedLabel: string;
  targetMonth: string;
  servicePackage: PurivaFinanceAttributionServicePackage;
  revenueRecognitionMode: PurivaFinanceAttributionRevenueRecognitionMode;
  localTestOnly: true;
  noPaymentProcessor: true;
  localTestDisclaimer: string;
  adminSummaryLabel: string;
  links: PurivaFinanceAttributionLinks;
  invoicePlaceholder: PurivaFinanceAttributionInvoicePlaceholder;
  recurringPackage: PurivaFinanceAttributionRecurringPackage;
};

export type PurivaFinanceAttributionAdminSummary = {
  label: string;
  targetMonth: string;
  localTestOnly: true;
  noPaymentProcessor: true;
  revenueRecognitionMode: PurivaFinanceAttributionRevenueRecognitionMode;
  attributedAmountCents: number;
  currency: string;
  disclaimer: string;
  links: PurivaFinanceAttributionLinks;
  financeEventSynced: false;
};

export type PurivaFinanceAttributionServiceItemRequest = {
  name: string;
  description: string;
  unitPriceCents: number;
};

export type PurivaFinanceAttributionRecurringInvoiceRequest = {
  clientId: string;
  title: string;
  interval: "MONTHLY";
  startDate: string;
  endDate: null;
  nextRunDate: string;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  isActive: boolean;
  notes: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    sortOrder: number;
  }>;
};

export type PurivaFinanceAttributionInvoicePlaceholderRequest = {
  clientId: string;
  invoiceNumber: string;
  status: "DRAFT";
  issueDate: null;
  dueDate: null;
  paidAt: null;
  title: string;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number;
  notes: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    sortOrder: number;
  }>;
};

export type PurivaFinanceAttributionFinanceEventMetadata = {
  purivaFinanceAttributionVersion: typeof PURIVA_FINANCE_ATTRIBUTION_VERSION;
  purivaFinanceAttributionKind: typeof PURIVA_FINANCE_ATTRIBUTION_KIND;
  targetMonth: string;
  clientId: string;
  aiDeliveryProjectId: string;
  monthlyReportId: string;
  serviceItemId: string | null;
  recurringInvoiceId: string | null;
  invoicePlaceholderId: string | null;
  localTestOnly: true;
  revenueRecognitionMode: PurivaFinanceAttributionRevenueRecognitionMode;
};

export type PurivaFinanceAttributionRevenueAttributionMetadata = PurivaFinanceAttributionFinanceEventMetadata;

type FinanceAttributionSeed = typeof financeAttributionSeed;

function getSeed(): FinanceAttributionSeed {
  return financeAttributionSeed;
}

export function purivaFinanceAttributionInvoiceNumber(targetMonth: string): string {
  return `PURIVA-FA-${targetMonth}`;
}

export function purivaFinanceAttributionServiceItemName(): string {
  const seed = getSeed();
  return `${PURIVA_FINANCE_ATTRIBUTION_MARKER} ${seed.servicePackageName}`;
}

export function purivaFinanceAttributionRecurringTitle(): string {
  const seed = getSeed();
  return `${PURIVA_FINANCE_ATTRIBUTION_MARKER} ${seed.servicePackageName}`;
}

export function buildPurivaFinanceAttributionContext(
  targetMonth: string,
  deps: Partial<PurivaFinanceAttributionLinks> = {}
): PurivaFinanceAttributionContext {
  const seed = getSeed();
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
    revenueRecognitionMode: seed.revenueRecognitionMode as PurivaFinanceAttributionRevenueRecognitionMode,
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
      interval: seed.recurringInterval as "MONTHLY",
      title: purivaFinanceAttributionRecurringTitle(),
      totalCents: unitPriceCents,
      currency
    }
  };
}

export function serializePurivaFinanceAttributionNotes(context: PurivaFinanceAttributionContext): string {
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

export function financeAttributionHasPurivaMarker(value: string | null | undefined): boolean {
  return typeof value === "string" && value.includes(PURIVA_FINANCE_ATTRIBUTION_MARKER);
}

export function parsePurivaFinanceAttributionEmbed(
  notes: string | null | undefined
): PurivaFinanceAttributionContext | null {
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
    const parsed = JSON.parse(jsonLine) as {
      version?: string;
      kind?: string;
      targetMonth?: string;
      revenueRecognitionMode?: PurivaFinanceAttributionRevenueRecognitionMode;
      servicePackage?: PurivaFinanceAttributionServicePackage;
      links?: Partial<PurivaFinanceAttributionLinks>;
      invoicePlaceholder?: Partial<PurivaFinanceAttributionInvoicePlaceholder>;
    };

    if (parsed.version !== PURIVA_FINANCE_ATTRIBUTION_VERSION || parsed.kind !== PURIVA_FINANCE_ATTRIBUTION_KIND) {
      return null;
    }

    const targetMonth = parsed.targetMonth ?? "";
    const context = buildPurivaFinanceAttributionContext(targetMonth, parsed.links ?? {});

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

export function buildPurivaFinanceAttributionServiceItemRequest(
  context: PurivaFinanceAttributionContext = buildPurivaFinanceAttributionContext(currentPurivaFinanceAttributionMonth())
): PurivaFinanceAttributionServiceItemRequest {
  return {
    name: purivaFinanceAttributionServiceItemName(),
    description: `${context.localTestDisclaimer} SKU: ${context.servicePackage.sku}.`,
    unitPriceCents: context.servicePackage.unitPriceCents
  };
}

export function buildPurivaFinanceAttributionRecurringInvoiceRequest(
  clientId: string,
  context: PurivaFinanceAttributionContext
): PurivaFinanceAttributionRecurringInvoiceRequest {
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

export function buildPurivaFinanceAttributionInvoicePlaceholderRequest(
  clientId: string,
  context: PurivaFinanceAttributionContext
): PurivaFinanceAttributionInvoicePlaceholderRequest {
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

export function buildPurivaFinanceAttributionFinanceEventMetadata(
  context: PurivaFinanceAttributionContext
): PurivaFinanceAttributionFinanceEventMetadata {
  return {
    purivaFinanceAttributionVersion: context.version,
    purivaFinanceAttributionKind: context.kind,
    targetMonth: context.targetMonth,
    clientId: context.links.clientId,
    aiDeliveryProjectId: context.links.aiDeliveryProjectId,
    monthlyReportId: context.links.monthlyReportId,
    serviceItemId: context.links.serviceItemId,
    recurringInvoiceId: context.links.recurringInvoiceId,
    invoicePlaceholderId: context.links.invoicePlaceholderId,
    localTestOnly: true,
    revenueRecognitionMode: context.revenueRecognitionMode
  };
}

export function buildPurivaFinanceAttributionRevenueAttributionMetadata(
  context: PurivaFinanceAttributionContext
): PurivaFinanceAttributionRevenueAttributionMetadata {
  return buildPurivaFinanceAttributionFinanceEventMetadata(context);
}

export function buildPurivaFinanceAttributionAdminSummary(
  context: PurivaFinanceAttributionContext
): PurivaFinanceAttributionAdminSummary {
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

export function currentPurivaFinanceAttributionMonth(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function validatePurivaFinanceAttributionContext(context: PurivaFinanceAttributionContext): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];

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

export function findUnsafeFinanceExposurePhrases(context: PurivaFinanceAttributionContext): string[] {
  const haystack = [
    context.localTestDisclaimer,
    context.adminSummaryLabel,
    context.servicePackage.name,
    serializePurivaFinanceAttributionNotes(context)
  ].join("\n");

  const forbidden = ["stripe", "quickbooks", "xero", "payment processor", "wire transfer due", "pay now"];
  return forbidden.filter((phrase) => haystack.toLowerCase().includes(phrase));
}
