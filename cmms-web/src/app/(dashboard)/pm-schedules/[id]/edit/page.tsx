import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { PmForm } from "../../pm-form";
import { updatePmSchedule } from "../../actions";

export default async function EditPmSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!can(user.role, "manage", "pmSchedule")) redirect(`/pm-schedules/${id}`);

  const [pm, assets] = await Promise.all([
    db.pmSchedule.findUnique({ where: { id } }),
    db.asset.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
  ]);
  if (!pm) notFound();

  const boundAction = updatePmSchedule.bind(null, id);

  return (
    <div>
      <PageHeader title={`Editar ${pm.title}`} />
      <PmForm action={boundAction} pm={pm} assets={assets} submitLabel="Guardar cambios" />
    </div>
  );
}
