"use client";

import { useActionState } from "react";
import type { PmFormState } from "./actions";

type AssetOption = { id: string; code: string; name: string };

type Pm = {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  frequencyDays: number;
  nextDueAt: Date | string;
  estimatedHours: number | null;
  instructions: string | null;
  active: boolean;
};

const initialState: PmFormState = {};

function toDateInputValue(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

export function PmForm({
  action,
  pm,
  assets,
  submitLabel,
}: {
  action: (prevState: PmFormState, formData: FormData) => Promise<PmFormState>;
  pm?: Pm;
  assets: AssetOption[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Equipo</label>
        <select
          name="assetId"
          defaultValue={pm?.assetId ?? ""}
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
      <div>
        <label className="block text-sm font-medium text-slate-700">Título</label>
        <input
          name="title"
          defaultValue={pm?.title}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Descripción</label>
        <textarea
          name="description"
          defaultValue={pm?.description ?? ""}
          rows={2}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Frecuencia (días)</label>
          <input
            name="frequencyDays"
            type="number"
            min="1"
            defaultValue={pm?.frequencyDays ?? 30}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Próximo vencimiento</label>
          <input
            name="nextDueAt"
            type="date"
            defaultValue={pm ? toDateInputValue(pm.nextDueAt) : ""}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Horas estimadas</label>
        <input
          name="estimatedHours"
          type="number"
          step="any"
          min="0"
          defaultValue={pm?.estimatedHours ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Instrucciones</label>
        <textarea
          name="instructions"
          defaultValue={pm?.instructions ?? ""}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="active" defaultChecked={pm?.active ?? true} />
        Programa activo
      </label>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
