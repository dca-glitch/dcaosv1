import { Button } from "../ui";
import type { ShellUser } from "./types";

type ShellUserPanelProps = {
  user: ShellUser;
  onLogout: () => void;
  collapsed?: boolean;
};

export function ShellUserPanel({ user, onLogout, collapsed = false }: ShellUserPanelProps) {
  const displayName = user.name || user.email;

  return (
    <div
      className={
        collapsed
          ? "user-panel sidebar-footer shell-user-panel shell-user-panel--collapsed"
          : "user-panel sidebar-footer shell-user-panel"
      }
      title={collapsed ? displayName : undefined}
    >
      {!collapsed ? (
        <>
          <span>{displayName}</span>
          <small>{user.email}</small>
        </>
      ) : (
        <span className="shell-user-panel__avatar" aria-hidden="true">
          {displayName.slice(0, 1).toUpperCase()}
        </span>
      )}
      <Button
        className="ghost-action shell-logout-action"
        onClick={onLogout}
        type="button"
        variant="tertiary"
        aria-label="Log out"
        title="Log out"
      >
        {collapsed ? "Out" : "Log out"}
      </Button>
    </div>
  );
}
