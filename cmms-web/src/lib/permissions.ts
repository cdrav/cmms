import type { Role } from "@prisma/client";

export type Resource =
  | "asset"
  | "pmSchedule"
  | "workOrder"
  | "inventory"
  | "user"
  | "report"
  | "adverseEvent"
  | "settings"
  | "task"
  | "purchaseRequest"
  | "vendor"
  | "contract"
  | "warranty"
  | "ticket";

export type Action = "view" | "create" | "update" | "delete" | "manage";

// Matriz de permisos: por rol, qué recursos puede gestionar por completo ("manage")
// y cuáles puede al menos ver ("view"). Reemplaza a la gema CanCan del proyecto original
// con una tabla explícita, fácil de auditar a simple vista.
const MANAGE: Record<Role, Resource[]> = {
  ADMIN: ["asset", "pmSchedule", "workOrder", "inventory", "user", "report", "adverseEvent", "settings", "task", "purchaseRequest", "vendor", "contract", "warranty", "ticket"],
  MANAGER: ["asset", "pmSchedule", "workOrder", "inventory", "report", "adverseEvent", "task", "purchaseRequest", "vendor", "contract", "warranty", "ticket"],
  TECHNICIAN: [],
};

const VIEW_ONLY: Record<Role, Resource[]> = {
  ADMIN: [],
  MANAGER: [],
  TECHNICIAN: ["asset", "pmSchedule", "workOrder", "inventory", "report", "adverseEvent", "task", "purchaseRequest", "vendor", "contract", "warranty", "ticket"],
};

// Excepciones puntuales: acciones que un TECHNICIAN sí puede hacer aunque el
// recurso en general sea de solo lectura para su rol.
const EXTRA_ALLOW: { role: Role; resource: Resource; action: Action }[] = [
  { role: "TECHNICIAN", resource: "workOrder", action: "create" }, // solicitar OT
  { role: "TECHNICIAN", resource: "workOrder", action: "update" }, // avanzar su OT asignada
  { role: "TECHNICIAN", resource: "adverseEvent", action: "create" }, // reportar un evento adverso
  { role: "TECHNICIAN", resource: "task", action: "create" }, // crear una tarea
  { role: "TECHNICIAN", resource: "task", action: "update" }, // actualizar el estado de su propia tarea
  { role: "TECHNICIAN", resource: "purchaseRequest", action: "create" }, // solicitar una compra
];

export function can(role: Role, action: Action, resource: Resource): boolean {
  if (MANAGE[role].includes(resource)) return true;

  if (action === "view" && VIEW_ONLY[role].includes(resource)) return true;

  return EXTRA_ALLOW.some(
    (rule) => rule.role === role && rule.resource === resource && rule.action === action
  );
}

export function assertCan(role: Role, action: Action, resource: Resource) {
  if (!can(role, action, resource)) {
    throw new Error(`No autorizado: el rol ${role} no puede ${action} ${resource}`);
  }
}
