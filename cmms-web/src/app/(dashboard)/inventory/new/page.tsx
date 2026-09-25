import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { ItemForm } from "../item-form";
import { createItem } from "../actions";

export default async function NewItemPage() {
  const user = await requireUser();
  if (!can(user.role, "manage", "inventory")) redirect("/inventory");

  return (
    <div>
      <PageHeader title="Nuevo repuesto" description="Registrar un nuevo repuesto o insumo en el almacén." />
      <ItemForm action={createItem} submitLabel="Crear repuesto" />
    </div>
  );
}
