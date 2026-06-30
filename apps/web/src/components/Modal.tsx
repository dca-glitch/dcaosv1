import type { ReactNode } from "react";
import DSModal from "../design-system/components/Modal";
import type { ModalSize as DSModalSize } from "../design-system/components/Modal";

export type ModalSize = "sm" | "md" | "lg";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  eyebrow?: string;
};

const sizeMap: Record<ModalSize, DSModalSize> = {
  sm: "md",
  md: "xl",
  lg: "full",
};

export function Modal({ title, onClose, children, footer, size = "md", eyebrow }: ModalProps) {
  return (
    <DSModal
      isOpen={true}
      onClose={onClose}
      title={title}
      subtitle={eyebrow}
      footer={footer}
      size={sizeMap[size]}
    >
      {children}
    </DSModal>
  );
}
