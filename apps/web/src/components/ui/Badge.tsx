import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "success" | "error" | "warning" | "info" | "neutral";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

/** Maps legacy Badge variants onto Botanical Soft status token families. */
const VARIANT_TO_STATUS: Record<BadgeVariant, string> = {
  success: "approved",
  error: "failed",
  warning: "in_review",
  info: "in_progress",
  neutral: "draft"
};

/**
 * Compatibility badge — Botanical Soft presentation via status CSS vars.
 * Prefer StatusBadge for domain status enums. Do not invent page-local palettes.
 */
export function Badge({ variant = "neutral", className, children, style, ...props }: BadgeProps) {
  const statusKey = VARIANT_TO_STATUS[variant];
  const token = statusKey.replace(/_/g, "-");
  const classNames = ["ds-status-badge", "badge", `badge-${variant}`, className].filter(Boolean).join(" ");
  return (
    <span
      className={classNames}
      data-status={statusKey}
      style={{
        color: `var(--status-${token}-text)`,
        background: `var(--status-${token}-bg)`,
        border: `1px solid var(--status-${token}-border)`,
        fontSize: "12px",
        fontWeight: 650,
        letterSpacing: "0.01em",
        textTransform: "none",
        borderRadius: "var(--ds-radius-control, 3px)",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "2px 8px",
        ...style
      }}
      {...props}
    >
      <span aria-hidden="true" className="ds-status-dot" />
      {children}
    </span>
  );
}
