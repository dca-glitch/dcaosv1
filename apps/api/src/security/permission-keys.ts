export const PERMISSION_KEYS = {
  auditRead: "audit:read",
  modulesManage: "modules:manage",
  rolesManage: "roles:manage",
  settingsRead: "settings:read",
  settingsUpdate: "settings:update",
  usersInvite: "users:invite",
  usersRead: "users:read"
} as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export const CORE_PERMISSION_KEYS: PermissionKey[] = [
  PERMISSION_KEYS.auditRead,
  PERMISSION_KEYS.modulesManage,
  PERMISSION_KEYS.rolesManage,
  PERMISSION_KEYS.settingsRead,
  PERMISSION_KEYS.settingsUpdate,
  PERMISSION_KEYS.usersInvite,
  PERMISSION_KEYS.usersRead
];
