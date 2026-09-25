"use client";

import { useActionState } from "react";
import { createPurchaseRequest, type PurchaseRequestFormState } from "./actions";

type ItemOption = { id: string; code: string; name: string; unit: string };

const initialState: PurchaseRequestFormState = {};

export function PurchaseRequestForm({
  items,
  prefill,
}: {
  items: ItemOption[];
  prefill?: { inventoryItemId: string; description: string; quantity: number };
}) {
  const [state, formAction, pending] = useActionState(createPurchaseRequest, initialState);
  const rows = [0, 1, 2, 3, 4];

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">Título</label>
        <input name="title" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Justificación</label>
        <textarea name="justification" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Ítems a comprar</h3>
        <p className="mt-1 text-xs text-slate-500">Deja vacías las filas que no uses.</p>
        <div className="mt-2 space-y-2">
          {rows.map((i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input
                name="itemDescription"
                placeholder="Descripción"
                defaultValue={i === 0 ? prefill?.description : undefined}
                className="col-span-5 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                name="itemQuantity"
                type="number"
                step="any"
                min="0"
                placeholder="Cantidad"
                defaultValue={i === 0 ? prefill?.quantity : undefined}
                className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                name="itemCost"
                type="number"
                step="any"
                min="0"
                placeholder="Costo unit. est."
                className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <select
                name="itemInventoryId"
                defaultValue={i === 0 ? prefill?.inventoryItemId ?? "" : ""}
                className="col-span-3 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              >
                <option value="">(nuevo, no está en inventario)</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.code} — {it.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Crear solicitud"}
      </button>
    </form>
  );
}
