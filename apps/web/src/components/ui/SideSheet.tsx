import type { HTMLAttributes, ReactNode } from "react";

export type SideSheetProps = HTMLAttributes<HTMLDivElement> & {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function SideSheet({ isOpen, onClose, title, children, footer, ...props }: SideSheetProps) {
  return (
    <>
      {isOpen ? <div className="side-sheet-backdrop" onClick={onClose} role="presentation" /> : null}
      <div aria-hidden={!isOpen} className={`side-sheet${isOpen ? " open" : ""}`} {...props}>
        <div className="side-sheet-header">
          <h2>{title}</h2>
          <button aria-label="Close" className="side-sheet-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className="side-sheet-body">{children}</div>
        {footer ? <div className="side-sheet-footer">{footer}</div> : null}
      </div>
    </>
  );
}
