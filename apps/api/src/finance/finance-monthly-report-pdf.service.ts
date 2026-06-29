import { PDFDocument, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";
import type { FinanceMonthlySnapshotSummary } from "./finance.types";

interface FinanceMonthlyReportPdfInput {
  tenantName: string;
  generatedAt: Date;
  snapshot: FinanceMonthlySnapshotSummary;
}

interface RenderState {
  page: PDFPage;
  y: number;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TITLE_SIZE = 18;
const SECTION_SIZE = 12;
const BODY_SIZE = 10;
const LINE_HEIGHT = 14;

function formatMoney(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function ensureSpace(state: RenderState, font: PDFFont, doc: PDFDocument, needed = LINE_HEIGHT): RenderState {
  if (state.y - needed < MARGIN) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return { page, y: PAGE_HEIGHT - MARGIN };
  }
  return state;
}

function drawLine(
  state: RenderState,
  text: string,
  font: PDFFont,
  size: number,
  doc: PDFDocument
): RenderState {
  let next = ensureSpace(state, font, doc, size + 4);
  next.page.drawText(text, { x: MARGIN, y: next.y, size, font, maxWidth: CONTENT_WIDTH });
  return { page: next.page, y: next.y - (size + 4) };
}

export async function generateFinanceMonthlyReportPdf(input: FinanceMonthlyReportPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let state: RenderState = { page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN };

  state = drawLine(state, "DCA OS Lite — Finance Monthly Report", bold, TITLE_SIZE, doc);
  state = drawLine(state, input.tenantName, regular, BODY_SIZE, doc);
  state = drawLine(state, `Month: ${input.snapshot.month}`, regular, BODY_SIZE, doc);
  state = drawLine(state, `Generated: ${input.generatedAt.toISOString()}`, regular, BODY_SIZE, doc);

  state = drawLine(state, "", regular, BODY_SIZE, doc);
  state = drawLine(state, "Summary", bold, SECTION_SIZE, doc);
  state = drawLine(state, `Total revenue: ${formatMoney(input.snapshot.totalRevenue)}`, regular, BODY_SIZE, doc);
  state = drawLine(state, `Total cost: ${formatMoney(input.snapshot.totalCost)}`, regular, BODY_SIZE, doc);
  state = drawLine(state, `Profit: ${formatMoney(input.snapshot.profit)}`, regular, BODY_SIZE, doc);
  state = drawLine(
    state,
    `Margin: ${input.snapshot.marginPercent.toFixed(2)}%`,
    regular,
    BODY_SIZE,
    doc
  );

  state = drawLine(state, "", regular, BODY_SIZE, doc);
  state = drawLine(
    state,
    "This report is derived from FinanceEvent ledger snapshots only.",
    regular,
    BODY_SIZE,
    doc
  );

  return doc.save();
}
