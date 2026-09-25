import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { setPurchaseRequestStatus } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  ORDERED: "Ordenada",
  RECEIVED: "Recibida",
};

export default async function PurchaseRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const request = await db.purchaseRequest.findUnique({
    where: { id },
    include: {
      requestedBy: true,
      reviewedBy: true,
      items: { include: { inventoryItem: true } },
    },
  });
  if (!request) notFound();

  const canManage = can(user.role, "manage", "purchaseRequest");
  const total = request.items.reduce((sum, i) => sum + i.quantity * (i.estimatedUnitCost ?? 0), 0);
  const statusAction = setPurchaseRequestStatus.bind(null, request.id);

  return (
    <div>
      <PageHeader title={request.title} description={`Solicitada por ${request.requestedBy.name} el ${formatDateTime(request.createdAt)}`} />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {request.justification && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
              <h2 className="text-sm font-semibold text-slate-900">Justificación</h2>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{request.justification}</p>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Ítems</h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Descripción</th>
                  <th className="py-1">Cantidad</th>
                  <th className="py-1">Costo unit. est.</th>
                  <th className="py-1">Subtotal</th>
                  <th className="py-1">Vinculado a</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {request.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1.5">{item.description}</td>
                    <td className="py-1.5">{item.quantity}</td>
                    <td className="py-1.5">{item.estimatedUnitCost ? formatCurrency(item.estimatedUnitCost) : "—"}</td>
                    <td className="py-1.5">{item.estimatedUnitCost ? formatCurrency(item.quantity * item.estimatedUnitCost) : "—"}</td>
                    <td className="py-1.5 text-slate-500">{item.inventoryItem ? `${item.inventoryItem.code} — ${item.inventoryItem.name}` : "Nuevo"}</td>
                  </tr>
                ))}
              </tbody>
              {total > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-200 font-medium">
                    <td className="py-1.5" colSpan={3}>Total estimado</td>
                    <td className="py-1.5" colSpan={2}>{formatCurrency(total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Estado</h2>
            <p className="mt-2 font-medium text-slate-900">{STATUS_LABEL[request.status]}</p>
            {request.reviewedBy && (
              <p className="mt-1 text-xs text-slate-500">
                Revisada por {request.reviewedBy.name} el {formatDateTime(request.reviewedAt)}
              </p>
            )}
            {request.reviewComment && <p className="mt-2 text-slate-600">{request.reviewComment}</p>}

            {canManage && (
              <form action={statusAction} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <select name="status" defaultValue={request.status} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <textarea name="reviewComment" placeholder="Comentario (opcional)" rows={2} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                <button type="submit" className="w-full rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
                  Actualizar estado
                </button>
                <p className="text-xs text-slate-400">Al marcar &quot;Recibida&quot;, los ítems vinculados a inventario suman stock automáticamente.</p>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
