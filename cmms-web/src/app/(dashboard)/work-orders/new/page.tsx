import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { WoForm } from "../wo-form";

export default async function NewWorkOrderPage() {
  await requireUser();
  const assets = await db.asset.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });

  return (
    <div>
      <PageHeader title="Nueva solicitud de trabajo" description="Reportar una falla o solicitar mantenimiento." />
      <WoForm assets={assets} />
    </div>
  );
}
