import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { UserForm } from "../../user-form";
import { updateUser } from "../../actions";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await requireUser();
  if (!can(currentUser.role, "manage", "user")) redirect("/");

  const targetUser = await db.user.findUnique({ where: { id } });
  if (!targetUser) notFound();

  const boundAction = updateUser.bind(null, id);

  return (
    <div>
      <PageHeader title={`Editar ${targetUser.name}`} description={targetUser.email} />
      <UserForm action={boundAction} user={targetUser} submitLabel="Guardar cambios" />
    </div>
  );
}
