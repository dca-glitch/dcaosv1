import { Button } from "../ui";
import type { ShellUser } from "./types";

type ShellUserPanelProps = {
  user: ShellUser;
  onLogout: () => void;
};

export function ShellUserPanel({ user, onLogout }: ShellUserPanelProps) {
  return (
    <div className="user-panel sidebar-footer shell-user-panel">
      <span>{user.name || user.email}</span>
      <small>{user.email}</small>
      <Button className="ghost-action shell-logout-action" onClick={onLogout} type="button" variant="tertiary">
        Logout
      </Button>
    </div>
  );
}
