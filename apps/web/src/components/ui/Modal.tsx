import { useId, useRef, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOverlayA11y } from "../../design-system/useOverlayA11y";

export type ModalProps = HTMLAttributes<HTMLDivElement> & {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Product Modal shell — preserves isOpen/onClose/title/footer API with overlay a11y. */
export function Modal({ isOpen, onClose, title, children, footer, className, ...props }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayA11y(isOpen, onClose, panelRef);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
      style={{
        background: "rgba(3, 3, 8, 0.72)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        ref={panelRef}
        aria-modal="true"
        aria-labelledby={titleId}
        className={["modal", "modal-panel", className].filter(Boolean).join(" ")}
        role="dialog"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: "var(--ds-radius-xl)",
          border: "1px solid rgba(255, 255, 255, 0.13)",
          background: "linear-gradient(150deg, #09090F 0%, #0E0B1C 100%)",
          boxShadow: "var(--ds-shadow-modal)",
          maxHeight: "88vh",
          overflow: "hidden",
        }}
        {...props}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button aria-label="Close" className="modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
