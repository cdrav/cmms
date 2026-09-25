"use client";

import { useActionState } from "react";
import { SignaturePad } from "@/components/signature-pad";
import { addWorkOrderSignature, type SignatureFormState } from "./actions";

const initialState: SignatureFormState = {};

export function SignatureForm({
  workOrderId,
  role,
  title,
}: {
  workOrderId: string;
  role: "DELIVERED_BY" | "RECEIVED_BY";
  title: string;
}) {
  const boundAction = addWorkOrderSignature.bind(null, workOrderId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="role" value={role} />
      <p className="text-xs font-medium text-slate-600">{title}</p>
      <div className="flex gap-2">
        <input name="signerName" placeholder="Nombre" required className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
        <input name="signerRole" placeholder="Cargo" required className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <SignaturePad name="imageDataUrl" />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar firma"}
      </button>
    </form>
  );
}
