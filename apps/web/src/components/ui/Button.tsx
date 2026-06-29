import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classNames = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    disabled ? "btn-disabled" : null,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classNames} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  );
}
