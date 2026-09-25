"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { saveAttachmentFile } from "@/lib/attachments";

const calibrationSchema = z.object({
  performedAt: z.string().min(1, "Selecciona la fecha en que se realizó la calibración"),
  performedBy: z.string().trim().min(1, "Indica quién realizó la calibración"),
  notes: z.string().trim().optional(),
});

export type CalibrationFormState = { error?: string };

export async function recordCalibration(
  assetId: string,
  _prevState: CalibrationFormState,
  formData: FormData
): Promise<CalibrationFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "asset");

  const parsed = calibrationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const asset = await db.asset.findUnique({ where: { id: assetId } });
  if (!asset) return { error: "Equipo no encontrado." };

  const performedAt = new Date(parsed.data.performedAt);
  const nextCalibrationAt = asset.calibrationFrequencyDays
    ? new Date(performedAt.getTime() + asset.calibrationFrequencyDays * 24 * 60 * 60 * 1000)
    : null;

  const file = formData.get("certificate");
  let attachmentData: Awaited<ReturnType<typeof saveAttachmentFile>> | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      attachmentData = await saveAttachmentFile(file);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "No se pudo subir el certificado." };
    }
  }

  await db.$transaction(async (tx) => {
    const record = await tx.calibrationRecord.create({
      data: {
        assetId,
        performedAt,
        performedBy: parsed.data.performedBy,
        notes: parsed.data.notes || null,
        createdById: user.id,
      },
    });

    if (attachmentData) {
      await tx.attachment.create({
        data: {
          ...attachmentData,
          calibrationRecordId: record.id,
          documentType: "Certificado de Calibración",
          uploadedById: user.id,
        },
      });
    }

    await tx.asset.update({
      where: { id: assetId },
      data: { lastCalibratedAt: performedAt, nextCalibrationAt },
    });
  });

  revalidatePath(`/assets/${assetId}`);
  return {};
}
