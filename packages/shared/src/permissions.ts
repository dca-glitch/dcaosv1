export type PermissionAction = "read" | "create" | "update" | "delete" | "manage";

export type PermissionKey = `${string}:${PermissionAction}`;

export type PermissionContract = {
  key: PermissionKey;
  label: string;
  description?: string;
};
