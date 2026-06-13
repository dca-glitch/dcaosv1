import type { CrudContract } from "./crud";
import type { DashboardCardContract } from "./dashboard";
import type { NavigationItem } from "./navigation";
import type { PermissionContract, PermissionKey } from "./permissions";

export type ModuleStatus = "internal" | "active" | "planned";

export type ModuleMetadata = {
  key: string;
  name: string;
  description: string;
  status: ModuleStatus;
  version: string;
};

export type ModuleRouteContract = {
  id: string;
  path: string;
  label: string;
  requiredPermission?: PermissionKey;
};

export type AppModuleContract = {
  metadata: ModuleMetadata;
  routes: ModuleRouteContract[];
  navigation: NavigationItem[];
  permissions: PermissionContract[];
  dashboardCards: DashboardCardContract[];
  crud?: CrudContract;
};

export type ModuleRegistry = Record<string, AppModuleContract>;
