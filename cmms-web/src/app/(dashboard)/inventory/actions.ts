"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

const itemSchema = z.object({
  code: z.string().trim().min(1, "El código es obligatorio"),
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  unit: z.string().trim().min(1, "La unidad es obligatoria"),
  reorderPoint: z.coerce.number().min(0),
  reorderQuantity: z.coerce.number().min(0),
  unitCost: z.coerce.number().min(0),
  location: z.string().trim().optional(),
});

export type ItemFormState = { error?: string };

export async function createItem(
  _prevState: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "inventory");

  const parsed = itemSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    const item = await db.inventoryItem.create({
      data: { ...parsed.data, location: parsed.data.location || null },
    });
    revalidatePath("/inventory");
    redirect(`/inventory/${item.id}`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe un repuesto con ese código." };
    }
    throw e;
  }
}

export async function updateItem(
  id: string,
  _prevState: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "inventory");

  const parsed = itemSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    await db.inventoryItem.update({
      where: { id },
      data: { ...parsed.data, location: parsed.data.location || null },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe un repuesto con ese código." };
    }
    throw e;
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  redirect(`/inventory/${id}`);
}

const adjustSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number(),
  notes: z.string().trim().optional(),
});

export type AdjustFormState = { error?: string };

export async function adjustStock(
  itemId: string,
  _prevState: AdjustFormState,
  formData: FormData
): Promise<AdjustFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "inventory");

  const parsed = adjustSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { type, quantity, notes } = parsed.data;

  if (quantity <= 0) return { error: "La cantidad debe ser mayor a cero." };

  const item = await db.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Repuesto no encontrado." };

  const delta = type === "OUT" ? -quantity : quantity;
  if (item.quantityOnHand + delta < 0) {
    return { error: "No hay suficiente stock para esta salida." };
  }

  await db.$transaction([
    db.inventoryItem.update({
      where: { id: itemId },
      data: { quantityOnHand: { increment: delta } },
    }),
    db.inventoryTransaction.create({
      data: {
        inventoryItemId: itemId,
        type,
        quantity,
        performedById: user.id,
        notes: notes || null,
      },
    }),
  ]);

  revalidatePath(`/inventory/${itemId}`);
  revalidatePath("/inventory");
  return {};
}
