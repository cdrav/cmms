import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { ItemForm } from "../../item-form";
import { updateItem } from "../../actions";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!can(user.role, "manage", "inventory")) redirect(`/inventory/${id}`);

  const item = await db.inventoryItem.findUnique({ where: { id } });
  if (!item) notFound();

  const boundAction = updateItem.bind(null, id);

  return (
    <div>
      <PageHeader title={`Editar ${item.code}`} />
      <ItemForm action={boundAction} item={item} submitLabel="Guardar cambios" />
    </div>
  );
}
