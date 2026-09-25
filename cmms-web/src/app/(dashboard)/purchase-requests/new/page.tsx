import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { PurchaseRequestForm } from "../request-form";

export default async function NewPurchaseRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ inventoryItemId?: string; description?: string; quantity?: string }>;
}) {
  await requireUser();
  const { inventoryItemId, description, quantity } = await searchParams;

  const items = await db.inventoryItem.findMany({
    select: { id: true, code: true, name: true, unit: true },
    orderBy: { code: "asc" },
  });

  const prefill = inventoryItemId
    ? { inventoryItemId, description: description ?? "", quantity: quantity ? parseFloat(quantity) : 0 }
    : undefined;

  return (
    <div>
      <PageHeader title="Nueva solicitud de compra" description="Repuestos o equipos a comprar, con justificación." />
      <PurchaseRequestForm items={items} prefill={prefill} />
    </div>
  );
}
