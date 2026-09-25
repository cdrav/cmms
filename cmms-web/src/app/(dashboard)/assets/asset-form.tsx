"use client";

import { useActionState } from "react";
import type { AssetFormState } from "./actions";

type AssetOption = { id: string; code: string; name: string };

type Asset = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  location: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  parentId: string | null;
  criticality: string;
  status: string;
  notes: string | null;
  calibrationFrequencyDays: number | null;
  purchaseDate: Date | string | null;
  purchaseCost: number | null;
};

function toDateInputValue(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

const initialState: AssetFormState = {};

export function AssetForm({
  action,
  asset,
  parentOptions,
  submitLabel,
}: {
  action: (prevState: AssetFormState, formData: FormData) => Promise<AssetFormState>;
  asset?: Asset;
  parentOptions: AssetOption[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Código" name="code" defaultValue={asset?.code} required />
        <Field label="Nombre" name="name" defaultValue={asset?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Categoría" name="category" defaultValue={asset?.category ?? ""} />
        <Field label="Ubicación" name="location" defaultValue={asset?.location ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fabricante" name="manufacturer" defaultValue={asset?.manufacturer ?? ""} />
        <Field label="Modelo" name="model" defaultValue={asset?.model ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Número de serie" name="serialNumber" defaultValue={asset?.serialNumber ?? ""} />
        <div>
          <label className="block text-sm font-medium text-slate-700">Equipo padre</label>
          <select
            name="parentId"
            defaultValue={asset?.parentId ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Ninguno</option>
            {parentOptions
              .filter((p) => p.id !== asset?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Criticidad</label>
          <select
            name="criticality"
            defaultValue={asset?.criticality ?? "MEDIUM"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Estado</label>
          <select
            name="status"
            defaultValue={asset?.status ?? "OPERATIONAL"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="OPERATIONAL">Operativo</option>
            <option value="DOWN">Fuera de servicio</option>
            <option value="IN_MAINTENANCE">En mantenimiento</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Fecha de compra</label>
          <input
            name="purchaseDate"
            type="date"
            defaultValue={asset?.purchaseDate ? toDateInputValue(asset.purchaseDate) : ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Costo de compra</label>
          <input
            name="purchaseCost"
            type="number"
            step="any"
            min="0"
            defaultValue={asset?.purchaseCost ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">Se usa para el análisis de obsolescencia en Reportes.</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Frecuencia de calibración (días, opcional)
        </label>
        <input
          name="calibrationFrequencyDays"
          type="number"
          min="1"
          defaultValue={asset?.calibrationFrequencyDays ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          Solo para equipos sujetos a calibración metrológica periódica. Déjalo vacío si no aplica.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Notas</label>
        <textarea
          name="notes"
          defaultValue={asset?.notes ?? ""}
          rows={3}
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
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
