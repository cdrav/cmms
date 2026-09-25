"use client";

import { useActionState } from "react";
import { recordCalibration, type CalibrationFormState } from "./calibration-actions";

const initialState: CalibrationFormState = {};

export function CalibrationForm({ assetId }: { assetId: string }) {
  const boundAction = recordCalibration.bind(null, assetId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Fecha de calibración</label>
        <input
          name="performedAt"
          type="date"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Realizada por</label>
        <input
          name="performedBy"
          required
          placeholder="Técnico interno o laboratorio externo"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Certificado (opcional)</label>
        <input
          name="certificate"
          type="file"
          className="mt-1 w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Notas</label>
        <textarea name="notes" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Registrar calibración"}
      </button>
    </form>
  );
}
