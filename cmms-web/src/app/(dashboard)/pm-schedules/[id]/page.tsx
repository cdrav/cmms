import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { formatDate, formatDateTime, isOverdue } from "@/lib/format";
import { generateWorkOrderFromPm } from "../actions";

export default async function PmScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const pm = await db.pmSchedule.findUnique({
    where: { id },
    include: {
      asset: true,
      workOrders: { orderBy: { requestedAt: "desc" } },
    },
  });
  if (!pm) notFound();

  const overdue = pm.active && isOverdue(pm.nextDueAt);
  const canManage = can(user.role, "manage", "pmSchedule");
  const generateAction = generateWorkOrderFromPm.bind(null, pm.id);

  return (
    <div>
      <PageHeader
        title={pm.title}
        description={`${pm.asset.code} — ${pm.asset.name}`}
        action={
          canManage && (
            <Link
              href={`/pm-schedules/${pm.id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar
            </Link>
          )
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Detalle</h2>
            {pm.description && <p className="mt-2 text-slate-700">{pm.description}</p>}
            {pm.instructions && (
              <p className="mt-2 whitespace-pre-wrap text-slate-600">
                <span className="font-medium text-slate-800">Instrucciones: </span>
                {pm.instructions}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Órdenes generadas</h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Código</th>
                  <th className="py-1">Estado</th>
                  <th className="py-1">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pm.workOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td className="py-1.5">
                      <Link href={`/work-orders/${wo.id}`} className="font-medium text-slate-900 hover:underline">
                        {wo.code}
                      </Link>
                    </td>
                    <td className="py-1.5"><Badge value={wo.status} /></td>
                    <td className="py-1.5 text-slate-500">{formatDate(wo.requestedAt)}</td>
                  </tr>
                ))}
                {pm.workOrders.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">
                      Aún no se ha generado ninguna orden desde este programa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

        <div className="space-y-6">
          <section className={`rounded-lg border p-4 text-sm ${overdue ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
            <dl className="space-y-2">
              <Row label="Frecuencia" value={`cada ${pm.frequencyDays} días`} />
              <Row label="Próximo vencimiento" value={formatDate(pm.nextDueAt)} />
              <Row label="Último generado" value={formatDateTime(pm.lastGeneratedAt)} />
              <Row label="Horas estimadas" value={pm.estimatedHours ? `${pm.estimatedHours} h` : "—"} />
              <Row label="Estado" value={pm.active ? "Activo" : "Inactivo"} />
            </dl>
            {overdue && <p className="mt-2 font-medium text-red-700">⚠ Este mantenimiento está vencido.</p>}
          </section>

          {canManage && (
            <form action={generateAction}>
              <button
                type="submit"
                className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Generar orden de trabajo
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value}</dd>
    </div>
  );
}
