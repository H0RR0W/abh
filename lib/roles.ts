export const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  inspector: "Инспектор",
  operator: "Оператор",
  analyst: "Аналитик",
  management: "Руководство",
};

export type Permission =
  | "migrants.view"
  | "migrants.edit"
  | "migrants.status"
  | "migrants.delete"
  | "map.view"
  | "tasks.view"
  | "tasks.edit"
  | "alerts.view"
  | "messages.view"
  | "messages.send"
  | "reports.view"
  | "staff.manage";

const ALL_PERMISSIONS: Permission[] = [
  "migrants.view",
  "migrants.edit",
  "migrants.status",
  "migrants.delete",
  "map.view",
  "tasks.view",
  "tasks.edit",
  "alerts.view",
  "messages.view",
  "messages.send",
  "reports.view",
  "staff.manage",
];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ALL_PERMISSIONS,
  inspector: [
    "migrants.view",
    "migrants.edit",
    "migrants.status",
    "map.view",
    "tasks.view",
    "tasks.edit",
    "alerts.view",
    "messages.view",
    "messages.send",
  ],
  operator: [
    "migrants.view",
    "migrants.edit",
    "tasks.view",
    "tasks.edit",
    "messages.view",
    "messages.send",
  ],
  analyst: ["migrants.view", "map.view", "reports.view"],
  management: [
    "migrants.view",
    "map.view",
    "tasks.view",
    "alerts.view",
    "reports.view",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
