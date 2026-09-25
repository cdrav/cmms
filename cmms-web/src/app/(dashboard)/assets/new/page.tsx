import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { AssetForm } from "../asset-form";
import { createAsset } from "../actions";

export default async function NewAssetPage() {
  const user = await requireUser();
  if (!can(user.role, "manage", "asset")) redirect("/assets");

  const parentOptions = await db.asset.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });

  return (
    <div>
      <PageHeader title="Nuevo equipo" description="Registrar un nuevo activo en el inventario." />
      <AssetForm action={createAsset} parentOptions={parentOptions} submitLabel="Crear equipo" />
    </div>
  );
}
