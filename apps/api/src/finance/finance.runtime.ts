import type { Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import { putPrivateStorageObject, getPrivateStorageDownloadReference } from "../storage/private-storage.service";
import { runFinanceIntegrityChecks } from "./finance-integrity.service";
import {
  getFinanceClientSummaryFromLedger,
  getFinanceProjectSummaryFromLedger,
  getFinanceSummaryFromLedger,
  listFinanceEventsFromLedger
} from "./finance-ledger.service";
import { generateFinanceMonthlyReportPdf } from "./finance-monthly-report-pdf.service";
import { migrateLegacyFinanceToLedger } from "./finance-sync.service";
import type {
  FinanceEventsResponse,
  FinanceIntegrityResponse,
  FinanceSummaryResponse,
  FinanceClientSummaryResponse,
  FinanceProjectSummaryResponse
} from "./finance.types";
import { normalizeFinanceMonth } from "./finance-snapshot.service";

const prisma = createPrismaClient();
type PrismaTx = Prisma.TransactionClient;

const migratedTenants = new Set<string>();

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

async function ensureFinanceLedgerMigrated(tenantId: string): Promise<void> {
  if (migratedTenants.has(tenantId)) {
    return;
  }
  await prisma.$transaction(async (tx) => {
    await migrateLegacyFinanceToLedger(tx, tenantId);
  });
  migratedTenants.add(tenantId);
}

export async function getFinanceSummary(
  authSession: AuthResolvedSessionContext,
  month?: string | null
): Promise<FinanceSummaryResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }
  await ensureFinanceLedgerMigrated(tenantId);
  return prisma.$transaction((tx) => getFinanceSummaryFromLedger(tx, tenantId, month));
}

export async function getFinanceClientSummary(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<FinanceClientSummaryResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !clientId) {
    return null;
  }
  await ensureFinanceLedgerMigrated(tenantId);
  return prisma.$transaction((tx) => getFinanceClientSummaryFromLedger(tx, tenantId, clientId));
}

export async function getFinanceProjectSummary(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<FinanceProjectSummaryResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !projectId) {
    return null;
  }
  await ensureFinanceLedgerMigrated(tenantId);
  return prisma.$transaction((tx) => getFinanceProjectSummaryFromLedger(tx, tenantId, projectId));
}

export async function listFinanceEvents(
  authSession: AuthResolvedSessionContext,
  options: {
    month?: string | null;
    clientId?: string | null;
    projectId?: string | null;
    limit?: number;
  } = {}
): Promise<FinanceEventsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }
  await ensureFinanceLedgerMigrated(tenantId);
  return prisma.$transaction((tx) => listFinanceEventsFromLedger(tx, tenantId, options));
}

export async function getFinanceIntegrity(
  authSession: AuthResolvedSessionContext
): Promise<FinanceIntegrityResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }
  await ensureFinanceLedgerMigrated(tenantId);
  return prisma.$transaction((tx) => runFinanceIntegrityChecks(tx, tenantId));
}

export async function generateFinanceMonthlyReportPdfForMonth(
  authSession: AuthResolvedSessionContext,
  monthInput?: string | null
): Promise<{
  month: string;
  storageKey: string | null;
  downloadReference: ReturnType<typeof getPrivateStorageDownloadReference>;
} | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }
  await ensureFinanceLedgerMigrated(tenantId);

  const summary = await getFinanceSummary(authSession, monthInput);
  if (!summary) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, slug: true }
  });
  if (!tenant) {
    return null;
  }

  const pdfBytes = await generateFinanceMonthlyReportPdf({
    tenantName: tenant.name,
    generatedAt: new Date(),
    snapshot: summary.snapshot
  });

  const month = normalizeFinanceMonth(monthInput) ?? summary.month;
  const upload = await putPrivateStorageObject({
    body: Buffer.from(pdfBytes),
    mimeType: "application/pdf",
    namespace: "finance-report",
    originalFileName: `finance-monthly-${month}.pdf`,
    tenantSlugOrId: tenant.slug,
    documentDate: new Date()
  });

  let storageKey: string | null = null;
  if (upload?.storageKey) {
    storageKey = upload.storageKey;
    await prisma.financeMonthlySnapshot.update({
      where: { tenantId_month: { tenantId, month } },
      data: { reportStorageKey: storageKey }
    });
  }

  return {
    month,
    storageKey,
    downloadReference: storageKey ? getPrivateStorageDownloadReference(storageKey) : null
  };
}

export { syncInvoiceToFinanceEvent, syncBillToFinanceEvent, migrateLegacyFinanceToLedger } from "./finance-sync.service";
export { linkDeliveryRevenueAttribution } from "./finance-attribution.service";
