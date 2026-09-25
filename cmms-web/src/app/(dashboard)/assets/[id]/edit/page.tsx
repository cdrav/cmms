import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { AssetForm } from "../../asset-form";
import { updateAsset } from "../../actions";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!can(user.role, "manage", "asset")) redirect(`/assets/${id}`);

  const [asset, parentOptions] = await Promise.all([
    db.asset.findUnique({ where: { id } }),
    db.asset.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
  ]);
  if (!asset) notFound();

  const boundAction = updateAsset.bind(null, id);

  return (
    <div>
      <PageHeader title={`Editar ${asset.code}`} />
      <AssetForm action={boundAction} asset={asset} parentOptions={parentOptions} submitLabel="Guardar cambios" />
    </div>
  );
}
