import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  ORDERED: "Ordenada",
  RECEIVED: "Recibida",
};

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "bg-slate-100 text-slate-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  ORDERED: "bg-amber-100 text-amber-800",
  RECEIVED: "bg-emerald-100 text-emerald-700",
};

export default async function PurchaseRequestsPage() {
  await requireUser();
  const requests = await db.purchaseRequest.findMany({
    include: { requestedBy: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Solicitudes de compra"
        description="Compra interna de repuestos y equipos — sin marketplace externo."
        action={
          <Link
            href="/purchase-requests/new"
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
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Solicitado por</th>
              <th className="px-4 py-2">Ítems</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/purchase-requests/${r.id}`} className="font-medium text-slate-900 hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{r.requestedBy.name}</td>
                <td className="px-4 py-2 text-slate-600">{r.items.length}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay solicitudes de compra todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
