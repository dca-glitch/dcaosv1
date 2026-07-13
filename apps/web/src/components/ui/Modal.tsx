import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import DSModal from "../../design-system/components/Modal";
import type { ModalSize as DSModalSize } from "../../design-system/components/Modal";

/**
 * Canonical product Modal — singular public API.
 * Underlying shell: design-system Modal + portal to document.body.
 * Do not import design-system Modal from pages.
 */
export type ModalSize = "sm" | "md" | "lg";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Product sizes (mapped to DS widths to preserve live layout). */
  size?: ModalSize;
  /** Product eyebrow → DS subtitle. */
  eyebrow?: string;
  /** Optional visible description; mapped to DS subtitle when eyebrow is absent. */
  description?: string;
  /** Backdrop click closes when true (default). */
  closeOnBackdrop?: boolean;
};

/** Preserve existing product width contract used by all live consumers. */
const sizeMap: Record<ModalSize, DSModalSize> = {
  sm: "md",
  md: "xl",
  lg: "full",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  eyebrow,
  description,
  closeOnBackdrop = true,
}: ModalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <DSModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={eyebrow ?? description}
      footer={footer}
      size={sizeMap[size]}
      closeOnBackdrop={closeOnBackdrop}
    >
      {children}
    </DSModal>,
    document.body,
  );
}
