import { PDFDocument, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";

export interface ContentPlanPdfItem {
  title: string;
  targetKeyword: string | null;
  contentType: string | null;
  notes: string | null;
  sortOrder: number;
  approvalStatus: string | null;
}

interface ContentPlanPdfInput {
  generatedAt: Date;
  projectName: string;
  clientName: string | null;
  targetMonth: string;
  status: string;
  items: ContentPlanPdfItem[];
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
  return { page: nextState.page, y: nextState.y - height };
}

function writeSectionTitle(doc: PDFDocument, state: RenderState, font: PDFFont, title: string): RenderState {
  let nextState = writeLines(doc, state, font, SECTION_SIZE, title, LINE_HEIGHT);
  nextState.y -= 2;
  return nextState;
}

export async function generateAiDeliveryContentPlanPdf(
  input: ContentPlanPdfInput
): Promise<{ fileName: string; pdfBuffer: Buffer }> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${input.targetMonth} AI SEO Content Plan`);
  pdf.setAuthor("DCA OS Lite");
  pdf.setCreator("DCA OS Lite");
  pdf.setSubject("AI SEO content plan PDF — admin only");
  pdf.setCreationDate(input.generatedAt);
  pdf.setModificationDate(input.generatedAt);

  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  let state = createPage(pdf);
  state = writeLines(pdf, state, boldFont, TITLE_SIZE, "AI SEO Content Plan", LINE_HEIGHT + 2);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Generated at ${input.generatedAt.toISOString()}`, LINE_HEIGHT);
  state = writeBlankLine(pdf, state);

  state = writeSectionTitle(pdf, state, boldFont, "Plan details");
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Project: ${formatText(input.projectName)}`);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Client: ${formatText(input.clientName)}`);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Target month: ${formatText(input.targetMonth)}`);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Plan status: ${formatText(input.status)}`);
  state = writeLines(pdf, state, regularFont, BODY_SIZE, `Total items: ${input.items.length}`);
  state = writeBlankLine(pdf, state);

  state = writeSectionTitle(pdf, state, boldFont, "Content plan items");

  if (input.items.length === 0) {
    state = writeLines(pdf, state, regularFont, BODY_SIZE, "No content plan items.");
  } else {
    for (const item of input.items) {
      state = ensureSpace(pdf, state, LINE_HEIGHT * 3);
      state = writeLines(pdf, state, boldFont, BODY_SIZE, `${item.sortOrder + 1}. ${formatText(item.title)}`, LINE_HEIGHT);
      const keyword = item.targetKeyword ? `Keyword: ${item.targetKeyword}` : "Keyword: —";
      const type = item.contentType ? `Type: ${item.contentType}` : "Type: —";
      const approval = item.approvalStatus ? `Approval: ${item.approvalStatus}` : "Approval: —";
      state = writeLines(pdf, state, regularFont, BODY_SIZE, `${keyword} | ${type} | ${approval}`, LINE_HEIGHT, 12);
      if (item.notes) {
        state = writeLines(pdf, state, regularFont, BODY_SIZE, `Notes: ${item.notes}`, LINE_HEIGHT, 12);
      }
      state.y -= 4;
    }
  }

  const pdfBytes = await pdf.save({ useObjectStreams: false });
  const fileName = `content-plan-${input.targetMonth}.pdf`;
  return {
    fileName,
    pdfBuffer: Buffer.from(pdfBytes)
  };
}
