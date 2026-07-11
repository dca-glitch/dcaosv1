import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "../Button";

export type ExportButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "children"
> & {
  onExport: () => void;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
};

/**
 * Triggers the caller-provided `onExport` callback.
 * Never invents endpoints or fake success toasts.
 */
export function ExportButton({
  onExport,
  label = "Export CSV",
  variant = "secondary",
  size = "md",
  children,
  className,
  type = "button",
  ...props
}: ExportButtonProps) {
  return (
    <span className="op-export-button">
      <Button
        className={className}
        onClick={onExport}
        size={size}
        type={type}
        variant={variant}
        {...props}
      >
        {children ?? label}
      </Button>
    </span>
  );
}
