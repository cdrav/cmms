"use client";

import { useActionState } from "react";
import type { CaseFormState } from "./actions";
import {
  DOCUMENT_TYPE_LABEL,
  SEX_LABEL,
  AGE_UNIT_LABEL,
  TIMING_LABEL,
  EVENT_TYPE_LABEL,
  OUTCOME_LABEL,
  CAUSE_LABEL,
} from "@/lib/adverse-event-labels";

type AssetOption = { id: string; code: string; name: string };

type CaseData = {
  assetId: string;
  patientDocumentType: string;
  patientSex: string;
  patientAgeValue: number | null;
  patientAgeUnit: string | null;
  eventDate: Date | string;
  timing: string;
  eventType: string;
  outcome: string | null;
  outcomeOther: string | null;
  probableCauses: string;
  causeOther: string | null;
  correctiveActionsInitiated: boolean;
  reportedToDistributor: boolean;
  institutionalEmail: string | null;
  description: string | null;
};

const initialState: CaseFormState = {};

function toDateInputValue(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

export function CaseForm({
  action,
  assets,
  data,
  submitLabel,
}: {
  action: (prevState: CaseFormState, formData: FormData) => Promise<CaseFormState>;
  assets: AssetOption[];
  data?: CaseData;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const selectedCauses = new Set((data?.probableCauses ?? "").split(",").filter(Boolean));

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Equipo involucrado</h3>
        <select
          name="assetId"
          defaultValue={data?.assetId ?? ""}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecciona un equipo</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Datos del paciente <span className="font-normal text-slate-400">(mínimos, sin nombre)</span>
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <Select label="Tipo de documento" name="patientDocumentType" options={DOCUMENT_TYPE_LABEL} defaultValue={data?.patientDocumentType} required />
          <Select label="Sexo" name="patientSex" options={SEX_LABEL} defaultValue={data?.patientSex} required />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700">Edad</label>
              <input name="patientAgeValue" type="number" min="0" defaultValue={data?.patientAgeValue ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex-1">
              <Select label="Unidad" name="patientAgeUnit" options={AGE_UNIT_LABEL} defaultValue={data?.patientAgeUnit ?? ""} allowEmpty />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">El evento</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Fecha del evento</label>
            <input name="eventDate" type="date" required defaultValue={data ? toDateInputValue(data.eventDate) : ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <Select label="Momento" name="timing" options={TIMING_LABEL} defaultValue={data?.timing} required />
        </div>
        <Select label="Tipo de evento" name="eventType" options={EVENT_TYPE_LABEL} defaultValue={data?.eventType} required />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Desenlace del caso" name="outcome" options={OUTCOME_LABEL} defaultValue={data?.outcome ?? ""} allowEmpty />
          <div>
            <label className="block text-sm font-medium text-slate-700">Desenlace (otro, si aplica)</label>
            <input name="outcomeOther" defaultValue={data?.outcomeOther ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Causa probable (selecciona todas las que apliquen)</h3>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
          {Object.entries(CAUSE_LABEL).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input type="checkbox" name="probableCauses" value={value} defaultChecked={selectedCauses.has(value)} />
              {label}
            </label>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Otra causa (si aplica)</label>
          <input name="causeOther" defaultValue={data?.causeOther ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Seguimiento</h3>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="correctiveActionsInitiated" defaultChecked={data?.correctiveActionsInitiated} /> Acciones correctivas iniciadas
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="reportedToDistributor" defaultChecked={data?.reportedToDistributor} /> Reportado al distribuidor/fabricante
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Correo institucional del reportante</label>
          <input name="institutionalEmail" type="email" defaultValue={data?.institutionalEmail ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Descripción del caso</label>
          <textarea name="description" rows={4} defaultValue={data?.description ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </section>

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

function Select({
  label,
  name,
  options,
  defaultValue,
  required,
  allowEmpty,
}: {
  label: string;
  name: string;
  options: Record<string, string>;
  defaultValue?: string | null;
  required?: boolean;
  allowEmpty?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        {(allowEmpty || !defaultValue) && <option value="">Selecciona</option>}
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
