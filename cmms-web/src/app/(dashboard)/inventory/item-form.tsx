"use client";

import { useActionState } from "react";
import type { ItemFormState } from "./actions";

type Item = {
  id: string;
  code: string;
  name: string;
  unit: string;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  location: string | null;
};

const initialState: ItemFormState = {};

export function ItemForm({
  action,
  item,
  submitLabel,
}: {
  action: (prevState: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  item?: Item;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Código" name="code" defaultValue={item?.code} required />
        <Field label="Nombre" name="name" defaultValue={item?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Unidad de medida" name="unit" defaultValue={item?.unit ?? "unidad"} required />
        <Field label="Ubicación en almacén" name="location" defaultValue={item?.location ?? ""} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field
          label="Punto de reorden"
          name="reorderPoint"
          type="number"
          step="any"
          defaultValue={item?.reorderPoint?.toString() ?? "0"}
        />
        <Field
          label="Cantidad a reordenar"
          name="reorderQuantity"
          type="number"
          step="any"
          defaultValue={item?.reorderQuantity?.toString() ?? "0"}
        />
        <Field
          label="Costo unitario"
          name="unitCost"
          type="number"
          step="any"
          defaultValue={item?.unitCost?.toString() ?? "0"}
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
  type = "text",
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
