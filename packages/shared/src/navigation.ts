import type { PermissionKey } from "./permissions";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  moduleKey?: string;
  requiredPermission?: PermissionKey;
  children?: NavigationItem[];
};
