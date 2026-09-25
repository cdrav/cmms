import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getInstitutionSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { InstitutionProfileCard } from "@/components/institution-profile-card";
import { formatDate, formatDurationHms } from "@/lib/format";
import { computeRif } from "@/lib/rif";
import { flagObsoleteAssets } from "@/lib/obsolescence";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";

export default async function DashboardPage() {
  const [user, institutionSettings] = await Promise.all([requireUser(), getInstitutionSettings()]);

  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const [
    openByStatus,
    openWorkOrders,
    duePm,
    lowStockItems,
    downAssets,
    overdueCalibrations,
    assetsByStatus,
    pmWorkOrdersThisYear,
    calibrationsScheduledCount,
    calibrationsDoneThisYear,
    respondedWorkOrders,
    assetsForObsolescence,
  ] = await Promise.all([
    db.workOrder.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { status: { notIn: ["CLOSED", "REJECTED"] } },
    }),
    db.workOrder.findMany({
      where: { status: { notIn: ["CLOSED", "REJECTED"] } },
      include: { asset: true },
    }),
    db.pmSchedule.findMany({
      where: { active: true, nextDueAt: { lte: new Date() } },
      include: { asset: true },
      orderBy: { nextDueAt: "asc" },
      take: 8,
    }),
    db.inventoryItem.findMany({
      orderBy: { code: "asc" },
    }).then((items) => items.filter((i) => i.quantityOnHand <= i.reorderPoint)),
    db.asset.findMany({ where: { status: "DOWN" } }),
    db.asset.findMany({
      where: { calibrationFrequencyDays: { not: null }, nextCalibrationAt: { lte: new Date() } },
      orderBy: { nextCalibrationAt: "asc" },
      take: 8,
    }),
    db.asset.groupBy({ by: ["status"], _count: { _all: true } }),
    db.workOrder.findMany({
      where: { type: "PREVENTIVE", requestedAt: { gte: yearStart } },
      select: { status: true },
    }),
    db.asset.count({ where: { calibrationFrequencyDays: { not: null } } }),
    db.calibrationRecord.count({ where: { performedAt: { gte: yearStart } } }),
    db.workOrder.findMany({
      where: { type: { in: ["CORRECTIVE", "EMERGENCY"] }, completedAt: { not: null } },
      select: { requestedAt: true, completedAt: true },
    }),
    db.asset.findMany({
      include: { workOrders: { include: { parts: true } } },
    }),
  ]);

  const totalOpen = openByStatus.reduce((sum, s) => sum + s._count._all, 0);

  // Top del backlog por RIF (Prioridad x Criticidad del equipo) — combina ambas
  // dimensiones en vez de mirar solo la prioridad que puso quien solicitó la OT.
  const topByRif = openWorkOrders
    .map((wo) => ({ wo, rif: computeRif(wo.priority, wo.asset.criticality) }))
    .sort((a, b) => b.rif - a.rif)
    .slice(0, 8);

  const statusCount = (status: string) => assetsByStatus.find((s) => s.status === status)?._count._all ?? 0;
  const pmDoneThisYear = pmWorkOrdersThisYear.filter((wo) => wo.status === "COMPLETED" || wo.status === "CLOSED").length;

  const avgResponseMs =
    respondedWorkOrders.length > 0
      ? respondedWorkOrders.reduce((sum, wo) => sum + (wo.completedAt!.getTime() - wo.requestedAt.getTime()), 0) /
        respondedWorkOrders.length
      : null;

  // Análisis de obsolescencia: heurística explícita (antigüedad, frecuencia de
  // correctivos, costo de mantenimiento acumulado vs. valor de compra), no IA real.
  const obsoleteAssets = flagObsoleteAssets(assetsForObsolescence);

  return (
    <div>
      <PageHeader title={`Hola, ${user.name.split(" ")[0]}`} description="Resumen del estado de mantenimiento." />

      <InstitutionProfileCard settings={institutionSettings} canManage={can(user.role, "manage", "settings")} />

      <div className="mb-6 grid grid-cols-5 gap-4">
        <StatCard label="OTs abiertas" value={totalOpen} href="/work-orders" />
        <StatCard label="PM vencidos" value={duePm.length} href="/pm-schedules" tone={duePm.length > 0 ? "danger" : "ok"} />
        <StatCard label="Calibraciones vencidas" value={overdueCalibrations.length} href="/assets" tone={overdueCalibrations.length > 0 ? "danger" : "ok"} />
        <StatCard label="Repuestos bajo stock" value={lowStockItems.length} href="/inventory" tone={lowStockItems.length > 0 ? "warn" : "ok"} />
        <StatCard label="Equipos candidatos a reemplazo" value={obsoleteAssets.length} href="/reports" tone={obsoleteAssets.length > 0 ? "warn" : "ok"} />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Estado de equipos</h2>
          <div className="mt-3">
            <BarChart
              bars={[
                { label: "Operativo", value: statusCount("OPERATIONAL"), color: "#10b981" },
                { label: "En mtto.", value: statusCount("IN_MAINTENANCE"), color: "#f59e0b" },
                { label: "Fuera serv.", value: statusCount("DOWN"), color: "#ef4444" },
              ]}
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Mantenimientos preventivos ({new Date().getFullYear()})</h2>
          <div className="mt-3 flex items-center gap-4">
            <DonutChart total={pmWorkOrdersThisYear.length} done={pmDoneThisYear} color="#2563eb" />
            <p className="text-sm text-slate-500">
              {pmDoneThisYear} completados de {pmWorkOrdersThisYear.length} generados este año.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Calibraciones ({new Date().getFullYear()})</h2>
          <div className="mt-3 flex items-center gap-4">
            <DonutChart total={calibrationsScheduledCount} done={calibrationsDoneThisYear} color="#0ea5e9" />
            <p className="text-sm text-slate-500">
              {calibrationsDoneThisYear} realizadas este año, de {calibrationsScheduledCount} equipos bajo programa de calibración.
            </p>
          </div>
        </section>
      </div>

      {avgResponseMs !== null && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Tiempo de respuesta promedio (correctivos y emergencias)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatDurationHms(avgResponseMs)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Backlog por RIF (prioridad x criticidad)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {topByRif.map(({ wo, rif }) => (
              <li key={wo.id} className="flex items-center justify-between">
                <Link href={`/work-orders/${wo.id}`} className="hover:underline">
                  {wo.code} — {wo.asset.name}
                </Link>
                <span className="flex items-center gap-2">
                  <Badge value={wo.priority} />
                  <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">RIF {rif}</span>
                </span>
              </li>
            ))}
            {topByRif.length === 0 && <p className="text-slate-500">Sin órdenes abiertas.</p>}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Mantenimiento preventivo vencido</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {duePm.map((pm) => (
              <li key={pm.id} className="flex items-center justify-between">
                <Link href={`/pm-schedules/${pm.id}`} className="hover:underline">
                  {pm.title} — {pm.asset.name}
                </Link>
                <span className="text-red-700">{formatDate(pm.nextDueAt)}</span>
              </li>
            ))}
            {duePm.length === 0 && <p className="text-slate-500">Todo el mantenimiento preventivo está al día.</p>}
          </ul>
        </section>

        {overdueCalibrations.length > 0 && (
          <section className="rounded-lg border border-red-300 bg-red-50 p-4">
            <h2 className="text-sm font-semibold text-red-900">Calibraciones vencidas</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {overdueCalibrations.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <Link href={`/assets/${a.id}`} className="text-red-900 hover:underline">
                    {a.code} — {a.name}
                  </Link>
                  <span className="text-red-700">{formatDate(a.nextCalibrationAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {downAssets.length > 0 && (
          <section className="rounded-lg border border-red-300 bg-red-50 p-4">
            <h2 className="text-sm font-semibold text-red-900">Equipos fuera de servicio</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {downAssets.map((a) => (
                <li key={a.id}>
                  <Link href={`/assets/${a.id}`} className="text-red-900 hover:underline">
                    {a.code} — {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  tone = "neutral",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const toneClass = {
    neutral: "text-slate-900",
    ok: "text-emerald-700",
    warn: "text-amber-700",
    danger: "text-red-700",
  }[tone];

  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </Link>
  );
}
