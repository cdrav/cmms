import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { PmForm } from "../pm-form";
import { createPmSchedule } from "../actions";

export default async function NewPmSchedulePage() {
  const user = await requireUser();
  if (!can(user.role, "manage", "pmSchedule")) redirect("/pm-schedules");

  const assets = await db.asset.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });

  return (
    <div>
      <PageHeader title="Nuevo programa de mantenimiento" description="Definir una tarea preventiva recurrente." />
      <PmForm action={createPmSchedule} assets={assets} submitLabel="Crear programa" />
    </div>
  );
}
