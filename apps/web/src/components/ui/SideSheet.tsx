import { useId, useRef, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOverlayA11y } from "../../design-system/useOverlayA11y";

export type SideSheetProps = HTMLAttributes<HTMLDivElement> & {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Side sheet shell — preserves API; adds Escape, scroll lock, focus trap/return. */
export function SideSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  ...props
}: SideSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayA11y(isOpen, onClose, panelRef);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <>
      <div
        className="side-sheet-backdrop"
        onClick={onClose}
        role="presentation"
        style={{
          background: "var(--ds-modal-backdrop)",
        }}
      />
      <div
        ref={panelRef}
        aria-modal="true"
        aria-labelledby={titleId}
        className={["side-sheet", "open", className].filter(Boolean).join(" ")}
        role="dialog"
        tabIndex={-1}
        style={{
          borderRadius: "var(--ds-radius-lg) 0 0 var(--ds-radius-lg)",
          border: "1px solid var(--ds-modal-border)",
          background: "var(--ds-surface-panel)",
        }}
        {...props}
      >
        <div className="side-sheet-header">
          <h2 id={titleId}>{title}</h2>
          <button aria-label="Close" className="side-sheet-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className="side-sheet-body">{children}</div>
        {footer ? <div className="side-sheet-footer">{footer}</div> : null}
      </div>
    </>,
    document.body,
  );
}
