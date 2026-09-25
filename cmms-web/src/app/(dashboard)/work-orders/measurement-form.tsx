"use client";

import { useActionState } from "react";
import { addMeasurement, type MeasurementFormState } from "./actions";

const PRESETS = ["Temperatura", "Flujo", "Velocidad", "Peso", "Volumen", "Frecuencia", "Tiempo de Respuesta", "Linealidad", "Exactitud"];

const initialState: MeasurementFormState = {};

export function MeasurementForm({ workOrderId }: { workOrderId: string }) {
  const boundAction = addMeasurement.bind(null, workOrderId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs text-slate-500">Variable</label>
        <input
          name="variable"
          list="measurement-presets"
          required
          className="w-40 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <datalist id="measurement-presets">
          {PRESETS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="block text-xs text-slate-500">Unidad</label>
        <input name="unit" className="w-20 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Valor referencia</label>
        <input name="referenceValue" type="number" step="any" className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Valor medido</label>
        <input name="measuredValue" type="number" step="any" className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
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
