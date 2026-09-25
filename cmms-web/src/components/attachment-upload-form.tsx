"use client";

import { useActionState } from "react";
import type { AttachmentFormState } from "@/app/(dashboard)/attachments/actions";

const initialState: AttachmentFormState = {};

const DOCUMENT_TYPE_PRESETS = [
  "Manual de Usuario",
  "Manual de Servicio",
  "Factura",
  "Registro Sanitario",
  "Acta de Entrega",
  "Contrato de Alquiler",
  "Contrato Comodato",
  "Foto",
  "Otro",
];

export function AttachmentUploadForm({
  action,
}: {
  action: (prevState: AttachmentFormState, formData: FormData) => Promise<AttachmentFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        name="file"
        required
        className="flex-1 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
      />
      <input
        name="documentType"
        list="document-type-presets"
        placeholder="Tipo de documento"
        className="w-44 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      />
      <datalist id="document-type-presets">
        {DOCUMENT_TYPE_PRESETS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Subiendo..." : "Adjuntar"}
      </button>
      {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
