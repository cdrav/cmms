import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { formatCurrency } from "@/lib/format";

export default async function InventoryPage() {
  const user = await requireUser();
  const items = await db.inventoryItem.findMany({ orderBy: { code: "asc" } });

  return (
    <div>
      <PageHeader
        title="Inventario de repuestos"
        description="Stock de repuestos e insumos usados en mantenimiento."
        action={
          can(user.role, "manage", "inventory") && (
            <Link
              href="/inventory/new"
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Nuevo repuesto
            </Link>
          )
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Punto de reorden</th>
              <th className="px-4 py-2">Costo unitario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const low = item.quantityOnHand <= item.reorderPoint;
              return (
                <tr key={item.id} className={low ? "bg-amber-50" : "hover:bg-slate-50"}>
                  <td className="px-4 py-2">
                    <Link href={`/inventory/${item.id}`} className="font-medium text-slate-900 hover:underline">
                      {item.code}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{item.name}</td>
                  <td className={`px-4 py-2 ${low ? "font-semibold text-amber-800" : ""}`}>
                    {item.quantityOnHand} {item.unit}
                    {low && " ⚠ bajo stock"}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{item.reorderPoint} {item.unit}</td>
                  <td className="px-4 py-2 text-slate-600">{formatCurrency(item.unitCost)}</td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay repuestos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
