import { Building2, ChevronDown } from "lucide-react";
import type { ShellTenant } from "./types";

type WorkspaceSwitcherProps = {
  currentTenant: ShellTenant;
  collapsed?: boolean;
  /** Optional handler — when absent, control is display-only (no fake switching). */
  onSwitchWorkspace?: () => void;
};

export function WorkspaceSwitcher({
  currentTenant,
  collapsed = false,
  onSwitchWorkspace
}: WorkspaceSwitcherProps) {
  const label = currentTenant?.name ?? "No workspace selected";
  const slug = currentTenant?.slug;
  const interactive = typeof onSwitchWorkspace === "function";

  return (
    <div
      className={
        collapsed
          ? "shell-workspace-switcher shell-workspace-switcher--collapsed"
          : "shell-workspace-switcher"
      }
      title={collapsed ? `Workspace: ${label}` : undefined}
    >
      {!collapsed ? <span className="shell-workspace-switcher__eyebrow">Workspace</span> : null}
      {interactive ? (
        <button
          className="shell-workspace-switcher__control"
          onClick={onSwitchWorkspace}
          type="button"
          aria-label={`Switch workspace. Current: ${label}`}
          title={label}
        >
          <Building2 size={16} strokeWidth={2} aria-hidden="true" className="shell-workspace-switcher__icon" />
          {!collapsed ? (
            <>
              <span className="shell-workspace-switcher__copy">
                <strong>{label}</strong>
                {slug ? <small>{slug}</small> : null}
              </span>
              <ChevronDown size={16} strokeWidth={2} aria-hidden="true" className="shell-workspace-switcher__chevron" />
            </>
          ) : null}
        </button>
      ) : (
        <div
          className="shell-workspace-switcher__control shell-workspace-switcher__control--static"
          aria-label={`Current workspace: ${label}`}
          title={label}
        >
          <Building2 size={16} strokeWidth={2} aria-hidden="true" className="shell-workspace-switcher__icon" />
          {!collapsed ? (
            <span className="shell-workspace-switcher__copy">
              <strong>{label}</strong>
              {slug ? <small>{slug}</small> : null}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
