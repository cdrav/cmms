import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { formatCurrency } from "@/lib/format";
import { flagObsoleteAssets } from "@/lib/obsolescence";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitada",
  IN_PROGRESS: "En proceso",
  WAITING_PARTS: "Esperando repuestos",
  COMPLETED: "Completada",
  CLOSED: "Cerrada",
  REJECTED: "Rechazada",
};

const TYPE_LABEL: Record<string, string> = {
  CORRECTIVE: "Correctiva",
  PREVENTIVE: "Preventiva",
  EMERGENCY: "Emergencia",
  INSPECTION: "Inspección",
};

export default async function ReportsPage() {
  await requireUser();

  const [byStatus, byType, workOrders, assetsForObsolescence] = await Promise.all([
    db.workOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    db.workOrder.groupBy({ by: ["type"], _count: { _all: true } }),
    db.workOrder.findMany({
      include: { asset: true, parts: true },
    }),
    db.asset.findMany({ include: { workOrders: { include: { parts: true } } } }),
  ]);

  const obsoleteAssets = flagObsoleteAssets(assetsForObsolescence);

  const perAsset = new Map<
    string,
    { assetName: string; assetCode: string; woCount: number; materialCost: number; downtimeMinutes: number }
  >();

  for (const wo of workOrders) {
    const key = wo.assetId;
    const entry = perAsset.get(key) ?? {
      assetName: wo.asset.name,
      assetCode: wo.asset.code,
      woCount: 0,
      materialCost: 0,
      downtimeMinutes: 0,
    };
    entry.woCount += 1;
    entry.materialCost += wo.parts.reduce((sum, p) => sum + p.quantityUsed * p.unitCostSnapshot, 0);
    entry.downtimeMinutes += wo.downtimeMinutes ?? 0;
    perAsset.set(key, entry);
  }

  const assetRows = Array.from(perAsset.values()).sort((a, b) => b.woCount - a.woCount);

  return (
    <div>
      <PageHeader title="Reportes" description="Indicadores generales de mantenimiento." />

      <div className="grid grid-cols-2 gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Órdenes por estado</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {byStatus.map((s) => (
              <li key={s.status} className="flex justify-between">
                <span className="text-slate-600">{STATUS_LABEL[s.status] ?? s.status}</span>
                <span className="font-medium text-slate-900">{s._count._all}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Órdenes por tipo</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {byType.map((t) => (
              <li key={t.type} className="flex justify-between">
                <span className="text-slate-600">{TYPE_LABEL[t.type] ?? t.type}</span>
                <span className="font-medium text-slate-900">{t._count._all}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Historial y costo por equipo</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-1">Equipo</th>
              <th className="py-1">N° de órdenes</th>
              <th className="py-1">Downtime acumulado</th>
              <th className="py-1">Costo de materiales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assetRows.map((row) => (
              <tr key={row.assetCode}>
                <td className="py-1.5">{row.assetCode} — {row.assetName}</td>
                <td className="py-1.5">{row.woCount}</td>
                <td className="py-1.5">{row.downtimeMinutes} min</td>
                <td className="py-1.5">{formatCurrency(row.materialCost)}</td>
              </tr>
            ))}
            {assetRows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-500">
                  Aún no hay datos suficientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Equipos candidatos a reemplazo</h2>
        <p className="mt-1 text-xs text-slate-500">
          Heurística automática por antigüedad, frecuencia de correctivos y costo de mantenimiento acumulado frente al valor de compra. No es una decisión, es una señal para evaluar.
        </p>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-1">Equipo</th>
              <th className="py-1">Motivos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {obsoleteAssets.map(({ asset, reasons }) => (
              <tr key={asset.id}>
                <td className="py-1.5 align-top">
                  <Link href={`/assets/${asset.id}`} className="font-medium text-slate-900 hover:underline">
                    {asset.code} — {asset.name}
                  </Link>
                </td>
                <td className="py-1.5 text-slate-600">
                  <ul className="list-inside list-disc">
                    {reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
            {obsoleteAssets.length === 0 && (
              <tr>
                <td colSpan={2} className="py-4 text-center text-slate-500">
                  Ningún equipo cumple los criterios de obsolescencia por ahora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
