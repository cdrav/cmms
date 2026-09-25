"use client";

import { useActionState } from "react";
import { createTask, type TaskFormState } from "./actions";

type UserOption = { id: string; name: string };

const initialState: TaskFormState = {};

export function TaskForm({ users }: { users: UserOption[] }) {
  const [state, formAction, pending] = useActionState(createTask, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[200px] flex-1">
        <label className="block text-xs text-slate-500">Título</label>
        <input name="title" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <div className="min-w-[200px] flex-1">
        <label className="block text-xs text-slate-500">Descripción (opcional)</label>
        <input name="description" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <div className="min-w-[160px]">
        <label className="block text-xs text-slate-500">Asignar a</label>
        <select name="assignedToId" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">Sin asignar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500">Fecha límite</label>
        <input name="dueDate" type="date" className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Agregando..." : "Agregar tarea"}
      </button>
      {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
