import type { CSSProperties } from "react";

/**
 * Panel / card surface helper (SPEC §1.5).
 * Uses P1A CSS custom properties — no ad-hoc surface colors.
 * `tint` should be a 6-digit hex (e.g. #E07070); alpha suffix `09` is appended per spec.
 */
export function panelCSS(tint?: string, raised = false): CSSProperties {
  const base = "var(--ds-panel-gradient)";
  const bg =
    tint && /^#[0-9A-Fa-f]{6}$/.test(tint)
      ? `radial-gradient(ellipse 200% 120% at -5% -5%, ${tint}09 0%, transparent 50%), ${base}`
      : base;

  return {
    background: bg,
    border: "1px solid var(--ds-border)",
    boxShadow: raised ? "var(--ds-shadow-raised)" : "var(--ds-shadow-flat)",
  };
}

/** Convenience: raised content card with optional accent tint. */
export function raisedPanelCSS(tint?: string): CSSProperties {
  return panelCSS(tint, true);
}
