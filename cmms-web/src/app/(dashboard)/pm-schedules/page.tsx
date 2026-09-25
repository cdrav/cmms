import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { formatDate, isOverdue } from "@/lib/format";

export default async function PmSchedulesPage() {
  const user = await requireUser();
  const schedules = await db.pmSchedule.findMany({
    include: { asset: true },
    orderBy: { nextDueAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Mantenimiento preventivo"
        description="Programas de mantenimiento por calendario."
        action={
          <div className="flex gap-2">
            <Link
              href="/pm-schedules/calendar"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Ver calendario
            </Link>
            {can(user.role, "manage", "pmSchedule") && (
              <Link
                href="/pm-schedules/new"
                className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Nuevo programa
              </Link>
            )}
          </div>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Equipo</th>
              <th className="px-4 py-2">Frecuencia</th>
              <th className="px-4 py-2">Próximo vencimiento</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedules.map((pm) => {
              const overdue = pm.active && isOverdue(pm.nextDueAt);
              return (
                <tr key={pm.id} className={overdue ? "bg-red-50" : "hover:bg-slate-50"}>
                  <td className="px-4 py-2">
                    <Link href={`/pm-schedules/${pm.id}`} className="font-medium text-slate-900 hover:underline">
                      {pm.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{pm.asset.code} — {pm.asset.name}</td>
                  <td className="px-4 py-2 text-slate-600">cada {pm.frequencyDays} días</td>
                  <td className={`px-4 py-2 ${overdue ? "font-semibold text-red-700" : "text-slate-600"}`}>
                    {formatDate(pm.nextDueAt)} {overdue && "⚠ vencido"}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{pm.active ? "Activo" : "Inactivo"}</td>
                </tr>
              );
            })}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay programas de mantenimiento preventivo todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
