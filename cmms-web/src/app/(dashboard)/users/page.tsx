import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Jefe de mantenimiento",
  TECHNICIAN: "Técnico",
};

export default async function UsersPage() {
  const user = await requireUser();
  if (!can(user.role, "manage", "user")) redirect("/");

  const users = await db.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Cuentas del personal de mantenimiento."
        action={
          <Link
            href="/users/new"
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Nuevo usuario
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2 text-slate-600">{ROLE_LABEL[u.role] ?? u.role}</td>
                <td className="px-4 py-2 text-slate-600">{u.active ? "Activo" : "Inactivo"}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/users/${u.id}/edit`} className="text-sm text-slate-700 hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
