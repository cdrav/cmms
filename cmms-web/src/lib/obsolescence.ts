// Heurística simple de obsolescencia: no es "IA", son reglas explícitas y auditables
// sobre antigüedad, frecuencia de correctivos y costo de mantenimiento acumulado
// frente al valor de compra. Marca candidatos a evaluación de reemplazo, no una
// decisión automática.
const AGE_THRESHOLD_YEARS = 8;
const CORRECTIVE_THRESHOLD_12M = 3;
const COST_RATIO_THRESHOLD = 0.5; // 50% del valor de compra en mantenimiento acumulado

export type ObsolescenceInput = {
  purchaseDate: Date | null;
  purchaseCost: number | null;
  correctiveCountLast12Months: number;
  totalMaintenanceCost: number;
};

export type ObsolescenceResult = {
  flagged: boolean;
  reasons: string[];
};

type AssetWithWorkOrders = {
  id: string;
  purchaseDate: Date | null;
  purchaseCost: number | null;
  workOrders: {
    type: string;
    requestedAt: Date;
    parts: { quantityUsed: number; unitCostSnapshot: number }[];
  }[];
};

// Recorre equipos con sus OTs/repuestos y aplica analyzeObsolescence a cada uno.
// Vive acá (no en el componente de página) para no llamar Date.now() durante el render.
export function flagObsoleteAssets<T extends AssetWithWorkOrders>(assets: T[]) {
  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  return assets
    .map((asset) => {
      const correctiveCountLast12Months = asset.workOrders.filter(
        (wo) => wo.type === "CORRECTIVE" && wo.requestedAt >= twelveMonthsAgo
      ).length;
      const totalMaintenanceCost = asset.workOrders.reduce(
        (sum, wo) => sum + wo.parts.reduce((s, p) => s + p.quantityUsed * p.unitCostSnapshot, 0),
        0
      );
      const result = analyzeObsolescence({
        purchaseDate: asset.purchaseDate,
        purchaseCost: asset.purchaseCost,
        correctiveCountLast12Months,
        totalMaintenanceCost,
      });
      return { asset, ...result };
    })
    .filter((r) => r.flagged);
}

export function analyzeObsolescence(input: ObsolescenceInput): ObsolescenceResult {
  const reasons: string[] = [];

  if (input.purchaseDate) {
    const ageYears = (Date.now() - input.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears >= AGE_THRESHOLD_YEARS) {
      reasons.push(`Antigüedad de ${ageYears.toFixed(1)} años`);
    }
  }

  if (input.correctiveCountLast12Months >= CORRECTIVE_THRESHOLD_12M) {
    reasons.push(`${input.correctiveCountLast12Months} mantenimientos correctivos en los últimos 12 meses`);
  }

  if (input.purchaseCost && input.purchaseCost > 0) {
    const ratio = input.totalMaintenanceCost / input.purchaseCost;
    if (ratio >= COST_RATIO_THRESHOLD) {
      reasons.push(`El mantenimiento acumulado equivale al ${(ratio * 100).toFixed(0)}% del valor de compra`);
    }
  }

  return { flagged: reasons.length > 0, reasons };
}
