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
          background: "rgba(3, 3, 8, 0.72)",
          backdropFilter: "blur(2px)",
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
          border: "1px solid rgba(255, 255, 255, 0.13)",
          background: "linear-gradient(150deg, #09090F 0%, #0E0B1C 100%)",
          boxShadow: "var(--ds-shadow-overlay)",
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
