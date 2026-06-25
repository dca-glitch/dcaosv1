import { PDFDocument, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";
import type {
  AiDeliveryMonthlyMetricsSummary,
  AiDeliveryMonthlyReportSummary,
  AiDeliveryMonthlySummaryResponse
} from "./core.types";

type MonthlyReportSummary = NonNullable<AiDeliveryMonthlySummaryResponse["summary"]>;

interface MonthlyReportPdfInput {
  generatedAt: Date;
  metrics: AiDeliveryMonthlyMetricsSummary | null;
  monthlySummary: MonthlyReportSummary | null;
  report: AiDeliveryMonthlyReportSummary;
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
const SMALL_LINE_HEIGHT = 12;

function formatText(value: string | null | undefined, fallback = "Not provided"): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
}

function formatNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-US") : "—";
}

function formatDecimal(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "—";
}

function wrapParagraph(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines.push("");
      continue;
    }

    const words = trimmed.split(/\s+/);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) {
        lines.push(current);
      }

      if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
        current = word;
        continue;
      }

      let segment = "";
      for (const character of word) {
        const next = `${segment}${character}`;
        if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
          segment = next;
        } else {
          if (segment) {
            lines.push(segment);
          }
          segment = character;
        }
      }
      current = segment;
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [""];
}

function createPage(doc: PDFDocument): RenderState {
  return {
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN
  };
}

function ensureSpace(doc: PDFDocument, state: RenderState, requiredHeight: number): RenderState {
  if (state.y - requiredHeight >= MARGIN) {
    return state;
  }

  return createPage(doc);
}

function writeLines(
  doc: PDFDocument,
  state: RenderState,
  font: PDFFont,
  fontSize: number,
  text: string,
  lineHeight = LINE_HEIGHT,
  indent = 0
): RenderState {
  const lines = wrapParagraph(text, font, fontSize, CONTENT_WIDTH - indent);
  let nextState = state;

  for (const line of lines) {
    nextState = ensureSpace(doc, nextState, lineHeight);
    if (line) {
      nextState.page.drawText(line, {
        x: MARGIN + indent,
        y: nextState.y,
        size: fontSize,
        font
      });
    }
    nextState.y -= lineHeight;
  }

  return nextState;
}

function writeBlankLine(doc: PDFDocument, state: RenderState, height = SMALL_LINE_HEIGHT): RenderState {
  const nextState = ensureSpace(doc, state, height);
  return {
    page: nextState.page,
    y: nextState.y - height
  };
}

function writeSectionTitle(doc: PDFDocument, state: RenderState, font: PDFFont, title: string): RenderState {
  let nextState = writeLines(doc, state, font, SECTION_SIZE, title, LINE_HEIGHT);
  nextState.y -= 2;
  return nextState;
}

function appendBullets(
  doc: PDFDocument,
  state: RenderState,
  font: PDFFont,
  items: string[],
  indent = 12
): RenderState {
  let nextState = state;

  for (const item of items) {
    nextState = writeLines(doc, nextState, font, BODY_SIZE, `- ${item}`, LINE_HEIGHT, indent);
  }

  return nextState;
}

function formatApprovedSnapshotLine(snapshot: AiDeliveryMonthlyMetricsSummary["snapshots"][number]): string {
  return [
    snapshot.targetMonth,
    snapshot.sourceType,
    `status ${snapshot.status}`,
    `clicks ${formatNumber(snapshot.gscClicks)}`,
    `impr ${formatNumber(snapshot.gscImpressions)}`,
    `ctr ${formatDecimal(snapshot.gscAverageCtr)}%`,
    `pos ${formatDecimal(snapshot.gscAveragePosition)}`,
    `sessions ${formatNumber(snapshot.ga4Sessions)}`,
    `users ${formatNumber(snapshot.ga4Users)}`,
    `views ${formatNumber(snapshot.ga4PageViews)}`
  ].join(" | ");
}

function formatTrendMonthLine(month: AiDeliveryMonthlyMetricsSummary["computedTrendSummary"]["last12Months"][number]): string {
  return [
    month.targetMonth,
    month.sourceType,
    `clicks ${formatNumber(month.gscClicks)}`,
    `impr ${formatNumber(month.gscImpressions)}`,
    `ctr ${formatDecimal(month.gscAverageCtr)}%`,
    `pos ${formatDecimal(month.gscAveragePosition)}`,
    `sessions ${formatNumber(month.ga4Sessions)}`,
    `users ${formatNumber(month.ga4Users)}`,
    `views ${formatNumber(month.ga4PageViews)}`
  ].join(" | ");
}

export async function generateAiDeliveryMonthlyReportPdf(
  input: MonthlyReportPdfInput
): Promise<{ fileName: string; pdfBuffer: Buffer }> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${input.report.project?.targetMonth ?? "Monthly"} Monthly Report`);
  pdf.setAuthor("DCA OS Lite");
  pdf.setCreator("DCA OS Lite");
  pdf.setSubject("Monthly report PDF");
  pdf.setCreationDate(input.generatedAt);
  pdf.setModificationDate(input.generatedAt);

  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  let state = createPage(pdf);
  state = writeLines(pdf, state, boldFont, TITLE_SIZE, "Monthly Report", LINE_HEIGHT + 2);
  state = writeLines(
    pdf,
    state,
    regularFont,
    BODY_SIZE,
    `Generated at ${input.generatedAt.toISOString()}`,
    LINE_HEIGHT
  );
  state = writeBlankLine(pdf, state);

  const reportProject = input.report.project;
  const monthlyProject = input.monthlySummary?.project ?? null;
  const clientName = reportProject?.clientName ?? monthlyProject?.clientName ?? "Not provided";
  const projectName = reportProject?.name ?? monthlyProject?.name ?? "Not provided";
  const targetMonth = reportProject?.targetMonth ?? monthlyProject?.targetMonth ?? "Not provided";

  state = writeSectionTitle(pdf, state, boldFont, "Report details");
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Title: ${formatText(input.report.title, `Monthly Report ${targetMonth}`)}`);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Client: ${clientName}`);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Project: ${projectName}`);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Target month: ${targetMonth}`);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Status: ${input.report.status}`);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Document available: ${input.report.hasDocument ? "Yes" : "No"}`);
  state = writeBlankLine(pdf, state);

  state = writeSectionTitle(pdf, state, boldFont, "Monthly report narrative");
  state = writeLines(
    pdf,
    state,
    regularFont,
    BODY_SIZE,
    `Admin summary notes: ${formatText(input.report.adminSummaryNotes)}`
  );
  state = writeLines(
    pdf,
    state,
    regularFont,
    BODY_SIZE,
    `Recommendations: ${formatText(input.report.recommendationsText)}`
  );
  if (input.report.exportUrl) {
    state = writeLines(pdf, state, regularFont, BODY_SIZE, `Export URL: ${input.report.exportUrl}`);
  }
  state = writeBlankLine(pdf, state);

  state = writeSectionTitle(pdf, state, boldFont, "Computed monthly summary");
  if (input.monthlySummary) {
    state = writeLines(
      pdf,
      state,
      regularFont,
      BODY_SIZE,
      `Final deliverables: ${input.monthlySummary.deliverables.length}`
    );
    state = writeLines(
      pdf,
      state,
      regularFont,
      BODY_SIZE,
      `Delivered / accepted: ${input.monthlySummary.totals.deliveredCount} / ${input.monthlySummary.totals.acceptedCount}`
    );
    state = writeLines(
      pdf,
      state,
      regularFont,
      BODY_SIZE,
      `Content plan items: ${input.monthlySummary.contentPlanItems.length}`
    );

    if (input.monthlySummary.deliverables.length > 0) {
      state = writeLines(pdf, state, regularFont, BODY_SIZE, "Final deliverables:");
      state = appendBullets(
        pdf,
        state,
        regularFont,
        input.monthlySummary.deliverables.map((deliverable) => {
          const link = deliverable.exportUrl ? ` | export ${deliverable.exportUrl}` : "";
          return `${deliverable.title} (${deliverable.deliveryType}, ${deliverable.status})${link}`;
        })
      );
    }
  } else {
    state = writeLines(pdf, state, regularFont, BODY_SIZE, "Monthly summary not available.");
  }
  state = writeBlankLine(pdf, state);

  state = writeSectionTitle(pdf, state, boldFont, "Approved metrics snapshot trend");
  if (input.metrics) {
    const approvedSnapshots = input.metrics.snapshots
      .filter((snapshot) => snapshot.status === "APPROVED")
      .slice()
      .sort((left, right) => {
        const monthOrder = left.targetMonth.localeCompare(right.targetMonth);
        if (monthOrder !== 0) return monthOrder;
        return left.updatedAt.localeCompare(right.updatedAt);
      });

    state = writeLines(pdf, state, regularFont, BODY_SIZE, `Data status: ${input.metrics.computedTrendSummary.dataStatus}`);
    state = writeLines(pdf, state, regularFont, BODY_SIZE, `Latest approved month: ${input.metrics.computedTrendSummary.latestMonth ?? "Not set"}`);
    state = writeLines(pdf, state, regularFont, BODY_SIZE, `Approved snapshot count: ${approvedSnapshots.length}`);
    state = writeLines(
      pdf,
      state,
      regularFont,
      BODY_SIZE,
      `Totals: clicks ${formatNumber(input.metrics.computedTrendSummary.totals.gscClicks)}, impressions ${formatNumber(input.metrics.computedTrendSummary.totals.gscImpressions)}, sessions ${formatNumber(input.metrics.computedTrendSummary.totals.ga4Sessions)}, users ${formatNumber(input.metrics.computedTrendSummary.totals.ga4Users)}, page views ${formatNumber(input.metrics.computedTrendSummary.totals.ga4PageViews)}`
    );
    state = writeLines(
      pdf,
      state,
      regularFont,
      BODY_SIZE,
      `Averages: CTR ${formatDecimal(input.metrics.computedTrendSummary.averages.gscAverageCtr)}%, position ${formatDecimal(input.metrics.computedTrendSummary.averages.gscAveragePosition)}`
    );

    if (input.metrics.computedTrendSummary.last12Months.length > 0) {
      state = writeLines(pdf, state, regularFont, BODY_SIZE, "Trend months:");
      state = appendBullets(
        pdf,
        state,
        regularFont,
        input.metrics.computedTrendSummary.last12Months.map(formatTrendMonthLine)
      );
    }
  } else {
    state = writeLines(pdf, state, regularFont, BODY_SIZE, "Metrics snapshot data not available.");
  }

  const pdfBytes = await pdf.save({ useObjectStreams: false });
  const fileName = `monthly-report-${targetMonth}.pdf`;
  return {
    fileName,
    pdfBuffer: Buffer.from(pdfBytes)
  };
}
