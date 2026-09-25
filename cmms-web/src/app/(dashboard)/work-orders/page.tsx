import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { formatDate } from "@/lib/format";
import { computeRif } from "@/lib/rif";

const TERMINAL_STATUSES = ["CLOSED", "REJECTED"];

export default async function WorkOrdersPage() {
  const user = await requireUser();

  const workOrders = await db.workOrder.findMany({
    where:
      user.role === "TECHNICIAN"
        ? { OR: [{ assignedToId: user.id }, { requestedById: user.id }, { status: "REQUESTED" }] }
        : undefined,
    include: { asset: true, assignedTo: true },
    orderBy: { requestedAt: "desc" },
  });

  // Backlog activo ordenado por RIF (Prioridad x Criticidad del equipo) — lo más
  // importante primero, en vez de solo por fecha. Las cerradas/rechazadas van al final por fecha.
  const active = workOrders
    .filter((wo) => !TERMINAL_STATUSES.includes(wo.status))
    .map((wo) => ({ wo, rif: computeRif(wo.priority, wo.asset.criticality) }))
    .sort((a, b) => b.rif - a.rif || a.wo.requestedAt.getTime() - b.wo.requestedAt.getTime());

  const terminal = workOrders
    .filter((wo) => TERMINAL_STATUSES.includes(wo.status))
    .map((wo) => ({ wo, rif: computeRif(wo.priority, wo.asset.criticality) }));

  const rows = [...active, ...terminal];

  return (
    <div>
      <PageHeader
        title="Órdenes de trabajo"
        description="Solicitudes correctivas, preventivas y de emergencia, ordenadas por RIF (prioridad x criticidad del equipo)."
        action={
          <Link
            href="/work-orders/new"
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Nueva solicitud
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Equipo</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Prioridad</th>
              <th className="px-4 py-2">RIF</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Asignada a</th>
              <th className="px-4 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ wo, rif }) => (
              <tr key={wo.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/work-orders/${wo.id}`} className="font-medium text-slate-900 hover:underline">
                    {wo.code}
                  </Link>
                </td>
                <td className="px-4 py-2">{wo.asset.code} — {wo.asset.name}</td>
                <td className="px-4 py-2"><Badge value={wo.type} /></td>
                <td className="px-4 py-2"><Badge value={wo.priority} /></td>
                <td className="px-4 py-2 font-medium text-slate-700">{rif}</td>
                <td className="px-4 py-2"><Badge value={wo.status} /></td>
                <td className="px-4 py-2 text-slate-600">{wo.assignedTo?.name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">{formatDate(wo.requestedAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  No hay órdenes de trabajo todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
