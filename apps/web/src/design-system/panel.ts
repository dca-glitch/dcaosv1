import type { CSSProperties } from "react";

/**
 * Panel / card surface helper (SPEC §1.5).
 * Uses P1A CSS custom properties — no ad-hoc surface colors.
 * Botanical Light panels are flat; `tint` is retained only for call-site compatibility.
 */
export function panelCSS(tint?: string, raised = false): CSSProperties {
  void tint;
  void raised;

  return {
    background: "var(--ds-surface-panel)",
    border: "1px solid var(--ds-border)",
    boxShadow: "none",
  };
}

/** Convenience: raised content card with optional accent tint. */
export function raisedPanelCSS(tint?: string): CSSProperties {
  return panelCSS(tint, true);
}
