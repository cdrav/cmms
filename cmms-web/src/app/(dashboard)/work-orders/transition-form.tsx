"use client";

import { useActionState, useState } from "react";
import { transitionWorkOrder, type TransitionFormState } from "./actions";

type Transition = { to: string; label: string };
type TechOption = { id: string; name: string };

const initialState: TransitionFormState = {};

export function TransitionForm({
  workOrderId,
  transitions,
  technicians,
}: {
  workOrderId: string;
  transitions: Transition[];
  technicians: TechOption[];
}) {
  const boundAction = transitionWorkOrder.bind(null, workOrderId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [toStatus, setToStatus] = useState(transitions[0]?.to ?? "");

  if (transitions.length === 0) {
    return <p className="text-sm text-slate-500">No hay acciones disponibles para tu rol en este estado.</p>;
  }

  const needsAssignee = toStatus === "IN_PROGRESS";

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Acción</label>
        <select
          name="toStatus"
          value={toStatus}
          onChange={(e) => setToStatus(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {transitions.map((t) => (
            <option key={t.to} value={t.to}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {needsAssignee && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Asignar a</label>
          <select
            name="assignedToId"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">(mantener asignación actual)</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Comentario</label>
        <textarea name="comment" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Aplicar"}
      </button>
    </form>
  );
}
