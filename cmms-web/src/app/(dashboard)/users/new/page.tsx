import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { UserForm } from "../user-form";
import { createUser } from "../actions";

export default async function NewUserPage() {
  const user = await requireUser();
  if (!can(user.role, "manage", "user")) redirect("/");

  return (
    <div>
      <PageHeader title="Nuevo usuario" description="Crear una cuenta para el personal de mantenimiento." />
      <UserForm action={createUser} submitLabel="Crear usuario" />
    </div>
  );
}
