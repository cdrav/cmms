import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { CaseForm } from "../case-form";
import { createAdverseEventCase } from "../actions";

export default async function NewAdverseEventPage() {
  const user = await requireUser();
  if (!can(user.role, "create", "adverseEvent")) redirect("/adverse-events");

  const assets = await db.asset.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });

  return (
    <div>
      <PageHeader title="Registrar caso de tecnovigilancia" description="Evento o incidente adverso asociado a un dispositivo médico." />
      <CaseForm action={createAdverseEventCase} assets={assets} submitLabel="Crear registro" />
    </div>
  );
}
