import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { CaseForm } from "../../case-form";
import { updateAdverseEventCase } from "../../actions";

export default async function EditAdverseEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!can(user.role, "manage", "adverseEvent")) redirect(`/adverse-events/${id}`);

  const [caseData, assets] = await Promise.all([
    db.adverseEventCase.findUnique({ where: { id } }),
    db.asset.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
  ]);
  if (!caseData) notFound();

  const boundAction = updateAdverseEventCase.bind(null, id);

  return (
    <div>
      <PageHeader title="Editar caso de tecnovigilancia" />
      <CaseForm action={boundAction} assets={assets} data={caseData} submitLabel="Guardar cambios" />
    </div>
  );
}
