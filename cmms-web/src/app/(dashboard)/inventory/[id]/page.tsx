import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { AdjustStockForm } from "../adjust-stock-form";

export default async function InventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const item = await db.inventoryItem.findUnique({
    where: { id },
    include: {
      transactions: { orderBy: { occurredAt: "desc" }, take: 30, include: { performedBy: true } },
    },
  });
  if (!item) notFound();

  const low = item.quantityOnHand <= item.reorderPoint;

  return (
    <div>
      <PageHeader
        title={`${item.code} — ${item.name}`}
        description={item.location ?? undefined}
        action={
          can(user.role, "manage", "inventory") && (
            <Link
              href={`/inventory/${item.id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar
            </Link>
          )
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className={`rounded-lg border p-4 ${low ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <p className="text-sm text-slate-500">Stock actual</p>
            <p className="text-2xl font-semibold text-slate-900">
              {item.quantityOnHand} {item.unit}
            </p>
            {low && (
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-amber-800">
                  ⚠ Por debajo del punto de reorden ({item.reorderPoint} {item.unit}). Reordenar {item.reorderQuantity} {item.unit}.
                </p>
                <Link
                  href={`/purchase-requests/new?inventoryItemId=${item.id}&description=${encodeURIComponent(item.name)}&quantity=${item.reorderQuantity}`}
                  className="shrink-0 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
                >
                  Solicitar reposición
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Movimientos recientes</h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Tipo</th>
                  <th className="py-1">Cantidad</th>
                  <th className="py-1">Por</th>
                  <th className="py-1">Fecha</th>
                  <th className="py-1">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {item.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-1.5">{TX_LABEL[tx.type]}</td>
                    <td className="py-1.5">{tx.quantity} {item.unit}</td>
                    <td className="py-1.5 text-slate-600">{tx.performedBy.name}</td>
                    <td className="py-1.5 text-slate-500">{formatDateTime(tx.occurredAt)}</td>
                    <td className="py-1.5 text-slate-500">{tx.notes ?? "—"}</td>
                  </tr>
                ))}
                {item.transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      Sin movimientos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Ficha</h2>
            <dl className="mt-3 space-y-2">
              <Row label="Costo unitario" value={formatCurrency(item.unitCost)} />
              <Row label="Punto de reorden" value={`${item.reorderPoint} ${item.unit}`} />
              <Row label="Cantidad a reordenar" value={`${item.reorderQuantity} ${item.unit}`} />
              <Row label="Ubicación" value={item.location ?? "—"} />
            </dl>
          </section>

          {can(user.role, "manage", "inventory") && (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">Registrar movimiento</h2>
              <div className="mt-3">
                <AdjustStockForm itemId={item.id} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

const TX_LABEL: Record<string, string> = {
  IN: "Entrada",
  OUT: "Salida",
  ADJUSTMENT: "Ajuste",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value}</dd>
    </div>
  );
}
