export type ApprovalChecklistItem = {
  id: string;
  label: string;
};

/** Default Deliverable Approval checklist (MODAL_PATTERNS.md). */
export const DEFAULT_APPROVAL_CHECKLIST: ApprovalChecklistItem[] = [
  {
    id: "tone",
    label: "Tone and language match client brand voice"
  },
  {
    id: "claims",
    label: "Health claims are accurate and appropriately qualified"
  },
  {
    id: "products",
    label: "Product mentions are correct and consistent"
  },
  {
    id: "headings",
    label: "Headings and keywords look natural and relevant"
  },
  {
    id: "links",
    label: "All links and references have been reviewed"
  }
];

export function createEmptyApprovalChecklistState(
  items: ApprovalChecklistItem[] = DEFAULT_APPROVAL_CHECKLIST
): Record<string, boolean> {
  return Object.fromEntries(items.map((item) => [item.id, false]));
}

export function isApprovalChecklistComplete(
  state: Record<string, boolean>,
  items: ApprovalChecklistItem[] = DEFAULT_APPROVAL_CHECKLIST
): boolean {
  return items.every((item) => state[item.id] === true);
}
