import type { PermissionKey } from "./permissions";

export type DashboardCardContract = {
  id: string;
  title: string;
  valueLabel?: string;
  description?: string;
  moduleKey?: string;
  requiredPermission?: PermissionKey;
  href?: string;
};
