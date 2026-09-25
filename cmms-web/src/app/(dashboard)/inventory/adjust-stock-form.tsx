"use client";

import { useActionState } from "react";
import { adjustStock, type AdjustFormState } from "./actions";

const initialState: AdjustFormState = {};

export function AdjustStockForm({ itemId }: { itemId: string }) {
  const boundAction = adjustStock.bind(null, itemId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Movimiento</label>
        <select name="type" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="IN">Entrada (compra/reposición)</option>
          <option value="OUT">Salida (consumo)</option>
          <option value="ADJUSTMENT">Ajuste de inventario</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Cantidad</label>
        <input
          name="quantity"
          type="number"
          step="any"
          min="0"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Notas</label>
        <input name="notes" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Registrando..." : "Registrar movimiento"}
      </button>
    </form>
  );
}
