import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "success" | "error" | "warning" | "info" | "neutral";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  const classNames = ["badge", `badge-${variant}`, className].filter(Boolean).join(" ");
  return (
    <span className={classNames} {...props}>
      {children}
    </span>
  );
}
