import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { EVENT_TYPE_LABEL, CASE_STATUS_LABEL } from "@/lib/adverse-event-labels";

export default async function AdverseEventsPage() {
  const user = await requireUser();
  const cases = await db.adverseEventCase.findMany({
    include: { asset: true },
    orderBy: { eventDate: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Tecnovigilancia"
        description="Reporte de eventos e incidentes adversos de dispositivos médicos."
        action={
          can(user.role, "create", "adverseEvent") && (
            <Link
              href="/adverse-events/new"
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Registrar caso
            </Link>
          )
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Equipo</th>
              <th className="px-4 py-2">Tipo de evento</th>
              <th className="px-4 py-2">Fecha del evento</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/adverse-events/${c.id}`} className="font-medium text-slate-900 hover:underline">
                    {c.asset.code} — {c.asset.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{EVENT_TYPE_LABEL[c.eventType]}</td>
                <td className="px-4 py-2 text-slate-500">{formatDate(c.eventDate)}</td>
                <td className="px-4 py-2">{CASE_STATUS_LABEL[c.status]}</td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No hay casos de tecnovigilancia registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
