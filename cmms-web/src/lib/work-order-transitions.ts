import type { WorkOrderStatus } from "@prisma/client";

// Transiciones permitidas desde cada estado, y qué rol las puede ejecutar.
// MANAGER/ADMIN aprueban, rechazan y cierran; TECHNICIAN mueve el trabajo del día a día.
export const TRANSITIONS: Record<
  WorkOrderStatus,
  { to: WorkOrderStatus; roles: Array<"ADMIN" | "MANAGER" | "TECHNICIAN">; label: string }[]
> = {
  REQUESTED: [
    { to: "IN_PROGRESS", roles: ["ADMIN", "MANAGER"], label: "Aprobar y asignar" },
    { to: "REJECTED", roles: ["ADMIN", "MANAGER"], label: "Rechazar" },
  ],
  IN_PROGRESS: [
    { to: "WAITING_PARTS", roles: ["ADMIN", "MANAGER", "TECHNICIAN"], label: "Esperando repuestos" },
    { to: "COMPLETED", roles: ["ADMIN", "MANAGER", "TECHNICIAN"], label: "Marcar completada" },
  ],
  WAITING_PARTS: [
    { to: "IN_PROGRESS", roles: ["ADMIN", "MANAGER", "TECHNICIAN"], label: "Reanudar trabajo" },
  ],
  COMPLETED: [
    { to: "CLOSED", roles: ["ADMIN", "MANAGER"], label: "Cerrar orden" },
    { to: "IN_PROGRESS", roles: ["ADMIN", "MANAGER"], label: "Reabrir (no resuelto)" },
  ],
  CLOSED: [],
  REJECTED: [],
};

export function availableTransitions(status: WorkOrderStatus, role: "ADMIN" | "MANAGER" | "TECHNICIAN") {
  return TRANSITIONS[status].filter((t) => t.roles.includes(role));
}
