import type { Criticality } from "@prisma/client";

// RIF - Relative Importance Factor = Prioridad x Criticidad del equipo.
// Sirve para ordenar el backlog de OTs por lo que realmente importa primero,
// en vez de solo por la prioridad que puso quien la solicitó.
const WEIGHT: Record<Criticality, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export function criticalityWeight(value: Criticality): number {
  return WEIGHT[value];
}

export function computeRif(priority: Criticality, assetCriticality: Criticality): number {
  return criticalityWeight(priority) * criticalityWeight(assetCriticality);
}
