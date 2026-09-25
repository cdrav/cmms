"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

const assetSchema = z.object({
  code: z.string().trim().min(1, "El código es obligatorio"),
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  category: z.string().trim().optional(),
  location: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  model: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["OPERATIONAL", "DOWN", "IN_MAINTENANCE"]),
  notes: z.string().trim().optional(),
  calibrationFrequencyDays: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  purchaseDate: z.string().optional(),
  purchaseCost: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
});

export type AssetFormState = { error?: string };

function parseAssetForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = assetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" } as const;
  }
  return { data: parsed.data } as const;
}

export async function createAsset(
  _prevState: AssetFormState,
  formData: FormData
): Promise<AssetFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "asset");

  const result = parseAssetForm(formData);
  if ("error" in result) return { error: result.error };
  const data = result.data;

  try {
    const asset = await db.asset.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category || null,
        location: data.location || null,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        parentId: data.parentId || null,
        criticality: data.criticality,
        status: data.status,
        notes: data.notes || null,
        calibrationFrequencyDays: data.calibrationFrequencyDays ?? null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ?? null,
      },
    });
    revalidatePath("/assets");
    redirect(`/assets/${asset.id}`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe un equipo con ese código." };
    }
    throw e;
  }
}

export async function updateAsset(
  id: string,
  _prevState: AssetFormState,
  formData: FormData
): Promise<AssetFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "asset");

  const result = parseAssetForm(formData);
  if ("error" in result) return { error: result.error };
  const data = result.data;

  if (data.parentId === id) {
    return { error: "Un equipo no puede ser padre de sí mismo." };
  }

  try {
    await db.asset.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        category: data.category || null,
        location: data.location || null,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        parentId: data.parentId || null,
        criticality: data.criticality,
        status: data.status,
        notes: data.notes || null,
        calibrationFrequencyDays: data.calibrationFrequencyDays ?? null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ?? null,
      },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe un equipo con ese código." };
    }
    throw e;
  }

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirect(`/assets/${id}`);
}
