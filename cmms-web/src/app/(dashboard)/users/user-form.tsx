"use client";

import { useActionState } from "react";
import type { UserFormState } from "./actions";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

const initialState: UserFormState = {};

export function UserForm({
  action,
  user,
  submitLabel,
}: {
  action: (prevState: UserFormState, formData: FormData) => Promise<UserFormState>;
  user?: User;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = Boolean(user);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Nombre</label>
        <input
          name="name"
          defaultValue={user?.name}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Correo</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700">Rol</label>
        <select
          name="role"
          defaultValue={user?.role ?? "TECHNICIAN"}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ADMIN">Administrador</option>
          <option value="MANAGER">Jefe de mantenimiento</option>
          <option value="TECHNICIAN">Técnico</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          {isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
        </label>
        <input
          name="password"
          type="password"
          required={!isEdit}
          minLength={8}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="active" defaultChecked={user?.active ?? true} />
          Usuario activo
        </label>
      )}

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
