import DSButton from "../../design-system/components/Button";
import type { ButtonVariant as DSButtonVariant } from "../../design-system/components/Button";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Product adapter variants — preserved for existing call sites. */
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const variantMap: Record<ButtonVariant, DSButtonVariant> = {
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
