import DSButton from "../../design-system/components/Button";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const variantMap: Record<ButtonVariant, "primary" | "secondary" | "ghost" | "danger"> = {
  primary:     "primary",
  secondary:   "secondary",
  tertiary:    "ghost",
  destructive: "danger",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <DSButton variant={variantMap[variant]} size={size} {...props}>
      {children}
    </DSButton>
  );
}
