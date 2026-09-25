"use client";

import { useActionState } from "react";
import { createWorkOrder, type WoFormState } from "./actions";

type AssetOption = { id: string; code: string; name: string };

const initialState: WoFormState = {};

export function WoForm({ assets }: { assets: AssetOption[] }) {
  const [state, formAction, pending] = useActionState(createWorkOrder, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Equipo</label>
        <select
          name="assetId"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecciona un equipo</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Tipo</label>
          <select name="type" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="CORRECTIVE">Correctiva</option>
            <option value="EMERGENCY">Emergencia</option>
            <option value="PREVENTIVE">Preventiva</option>
            <option value="INSPECTION">Inspección</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Prioridad</label>
          <select name="priority" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Descripción del problema</label>
        <textarea
          name="description"
          required
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Creando..." : "Crear solicitud"}
      </button>
    </form>
  );
}
