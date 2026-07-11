import type { ReactNode } from "react";
import { SideSheet, type SideSheetProps } from "../SideSheet";
import { Button } from "../Button";

export type FilterSideSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  onApply?: () => void;
  onReset?: () => void;
  applyLabel?: string;
  resetLabel?: string;
  className?: string;
};

/**
 * Filter form shell composed on product SideSheet (Escape / focus trap already handled).
 */
export function FilterSideSheet({
  isOpen,
  onClose,
  title = "Filters",
  children,
  onApply,
  onReset,
  applyLabel = "Apply filters",
  resetLabel = "Reset",
  className,
}: FilterSideSheetProps) {
  const footer =
    onApply || onReset ? (
      <>
        {onReset ? (
          <Button onClick={onReset} type="button" variant="secondary">
            {resetLabel}
          </Button>
        ) : null}
        {onApply ? (
          <Button onClick={onApply} type="button">
            {applyLabel}
          </Button>
        ) : null}
      </>
    ) : undefined;

  const sheetProps: SideSheetProps = {
    isOpen,
    onClose,
    title,
    footer,
    className,
    children: <div className="op-filter-side-sheet-body">{children}</div>,
  };

  return <SideSheet {...sheetProps} />;
}
