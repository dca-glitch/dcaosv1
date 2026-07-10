import { Building2, ChevronDown } from "lucide-react";
import type { ShellTenant } from "./types";

type WorkspaceSwitcherProps = {
  currentTenant: ShellTenant;
  /** Optional handler — when absent, control is display-only (no fake switching). */
  onSwitchWorkspace?: () => void;
};

export function WorkspaceSwitcher({ currentTenant, onSwitchWorkspace }: WorkspaceSwitcherProps) {
  const label = currentTenant?.name ?? "No workspace selected";
  const slug = currentTenant?.slug;
  const interactive = typeof onSwitchWorkspace === "function";

  return (
    <div className="shell-workspace-switcher">
      <span className="shell-workspace-switcher__eyebrow">Workspace</span>
      {interactive ? (
        <button
          className="shell-workspace-switcher__control"
          onClick={onSwitchWorkspace}
          type="button"
          aria-label={`Switch workspace. Current: ${label}`}
        >
          <Building2 size={13} strokeWidth={2} aria-hidden="true" className="shell-workspace-switcher__icon" />
          <span className="shell-workspace-switcher__copy">
            <strong>{label}</strong>
            {slug ? <small>{slug}</small> : null}
          </span>
          <ChevronDown size={13} strokeWidth={2} aria-hidden="true" className="shell-workspace-switcher__chevron" />
        </button>
      ) : (
        <div
          className="shell-workspace-switcher__control shell-workspace-switcher__control--static"
          aria-label={`Current workspace: ${label}`}
        >
          <Building2 size={13} strokeWidth={2} aria-hidden="true" className="shell-workspace-switcher__icon" />
          <span className="shell-workspace-switcher__copy">
            <strong>{label}</strong>
            {slug ? <small>{slug}</small> : null}
          </span>
        </div>
      )}
    </div>
  );
}
