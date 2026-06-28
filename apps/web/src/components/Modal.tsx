import { useId, type ReactNode } from "react";

export type ModalSize = "sm" | "md" | "lg";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  eyebrow?: string;
};

export function Modal({ title, onClose, children, footer, size = "md", eyebrow }: ModalProps) {
  const titleId = useId();
  const panelClass = ["modal-panel", `modal-panel-${size}`].join(" ");

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={panelClass}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button aria-label="Close dialog" className="ghost-action modal-close-action" onClick={onClose} type="button">
            Close
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer modal-footer-slot">{footer}</footer> : null}
      </section>
    </div>
  );
}
