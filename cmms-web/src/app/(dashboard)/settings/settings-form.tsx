"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsFormState } from "./actions";

type Settings = {
  institutionName: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  healthRegistryCode: string | null;
  siteName: string | null;
  logoDataUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
};

const initialState: SettingsFormState = {};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Datos de la institución</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre de la institución" name="institutionName" defaultValue={settings.institutionName} />
          <Field label="NIT / identificación tributaria" name="taxId" defaultValue={settings.taxId ?? ""} />
        </div>
        <Field label="Dirección" name="address" defaultValue={settings.address ?? ""} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono" name="phone" defaultValue={settings.phone ?? ""} />
          <Field label="Email institucional" name="email" type="email" defaultValue={settings.email ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Código de registro sanitario (ej. REPS)" name="healthRegistryCode" defaultValue={settings.healthRegistryCode ?? ""} />
          <Field label="Sede" name="siteName" defaultValue={settings.siteName ?? ""} />
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Plantilla de PDF</h3>
        <div>
          <label className="block text-sm font-medium text-slate-700">Logo (aparece en los PDF)</label>
          {settings.logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoDataUrl} alt="Logo actual" className="mt-2 h-16 rounded border border-slate-200 bg-white p-1" />
          )}
          <input
            name="logo"
            type="file"
            accept="image/png,image/jpeg"
            className="mt-2 w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Color primario</label>
            <input name="primaryColor" type="color" defaultValue={settings.primaryColor} className="mt-1 h-10 w-full rounded-md border border-slate-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Color secundario</label>
            <input name="secondaryColor" type="color" defaultValue={settings.secondaryColor} className="mt-1 h-10 w-full rounded-md border border-slate-300" />
          </div>
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
        {pending ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
