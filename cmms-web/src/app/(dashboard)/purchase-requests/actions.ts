"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

const requestSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  justification: z.string().trim().optional(),
});

export type PurchaseRequestFormState = { error?: string };

export async function createPurchaseRequest(
  _prevState: PurchaseRequestFormState,
  formData: FormData
): Promise<PurchaseRequestFormState> {
  const user = await requireUser();
  assertCan(user.role, "create", "purchaseRequest");

  const parsed = requestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const descriptions = formData.getAll("itemDescription").map(String);
  const quantities = formData.getAll("itemQuantity").map(String);
  const costs = formData.getAll("itemCost").map(String);
  const inventoryItemIds = formData.getAll("itemInventoryId").map(String);

  const items = descriptions
    .map((description, i) => ({
      description: description.trim(),
      quantity: parseFloat(quantities[i]) || 0,
      estimatedUnitCost: costs[i] ? parseFloat(costs[i]) : null,
      inventoryItemId: inventoryItemIds[i] || null,
    }))
    .filter((item) => item.description.length > 0 && item.quantity > 0);

  if (items.length === 0) {
    return { error: "Agrega al menos un ítem con descripción y cantidad." };
  }

  const request = await db.purchaseRequest.create({
    data: {
      title: parsed.data.title,
      justification: parsed.data.justification || null,
      requestedById: user.id,
      items: { create: items },
    },
  });

  revalidatePath("/purchase-requests");
  redirect(`/purchase-requests/${request.id}`);
}

export async function setPurchaseRequestStatus(requestId: string, formData: FormData) {
  const user = await requireUser();
  assertCan(user.role, "manage", "purchaseRequest");

  const rawStatus = formData.get("status");
  const validStatuses = ["REQUESTED", "APPROVED", "REJECTED", "ORDERED", "RECEIVED"] as const;
  type ValidStatus = (typeof validStatuses)[number];
  if (typeof rawStatus !== "string" || !validStatuses.includes(rawStatus as ValidStatus)) return;
  const status: ValidStatus = rawStatus as ValidStatus;

  const reviewComment = String(formData.get("reviewComment") || "").trim() || null;

  const request = await db.purchaseRequest.findUnique({
    where: { id: requestId },
    include: { items: true },
  });
  if (!request) return;

  if (status === "RECEIVED" && request.status !== "RECEIVED") {
    // Al recibir la compra, sumamos stock a los ítems que ya existían en inventario.
    await db.$transaction(async (tx) => {
      for (const item of request.items) {
        if (!item.inventoryItemId) continue;
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantityOnHand: { increment: item.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            type: "IN",
            quantity: item.quantity,
            performedById: user.id,
            notes: `Recibido de solicitud de compra "${request.title}"`,
          },
        });
      }
      await tx.purchaseRequest.update({
        where: { id: requestId },
        data: { status, reviewedById: user.id, reviewedAt: new Date(), reviewComment },
      });
    });
  } else {
    await db.purchaseRequest.update({
      where: { id: requestId },
      data: { status, reviewedById: user.id, reviewedAt: new Date(), reviewComment },
    });
  }

  revalidatePath(`/purchase-requests/${requestId}`);
  revalidatePath("/purchase-requests");
}
