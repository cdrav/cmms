"use client";

import { useActionState } from "react";
import { addChecklistItem, type ChecklistFormState } from "./actions";

const PRESETS = ["Verificar Accesorios", "Verificar Controles", "Prueba Cuantitativa", "Pruebas Eléctricas", "Limpieza"];

const initialState: ChecklistFormState = {};

export function ChecklistForm({ workOrderId }: { workOrderId: string }) {
  const boundAction = addChecklistItem.bind(null, workOrderId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        name="label"
        list="checklist-presets"
        placeholder="Actividad (ej. Verificar Accesorios)"
        required
        className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      />
      <datalist id="checklist-presets">
        {PRESETS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <label className="flex items-center gap-1 text-sm text-slate-600">
        <input type="checkbox" name="completed" defaultChecked /> Realizada
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Agregando..." : "Agregar"}
      </button>
      {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
