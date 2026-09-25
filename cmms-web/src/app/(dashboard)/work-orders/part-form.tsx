"use client";

import { useActionState } from "react";
import { addWorkOrderPart, type PartFormState } from "./actions";

type ItemOption = { id: string; code: string; name: string; unit: string; quantityOnHand: number };

const initialState: PartFormState = {};

export function PartForm({ workOrderId, items }: { workOrderId: string; items: ItemOption[] }) {
  const boundAction = addWorkOrderPart.bind(null, workOrderId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Repuesto</label>
        <select
          name="inventoryItemId"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecciona un repuesto</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.code} — {i.name} ({i.quantityOnHand} {i.unit} disp.)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Cantidad usada</label>
        <input
          name="quantityUsed"
          type="number"
          step="any"
          min="0"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Registrando..." : "Registrar consumo"}
      </button>
    </form>
  );
}
