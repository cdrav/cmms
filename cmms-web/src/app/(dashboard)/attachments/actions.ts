"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { saveAttachmentFile, deleteAttachmentFile } from "@/lib/attachments";

export type AttachmentFormState = { error?: string };

export async function uploadAssetAttachment(
  assetId: string,
  _prevState: AttachmentFormState,
  formData: FormData
): Promise<AttachmentFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "asset");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const documentType = String(formData.get("documentType") || "").trim() || null;

  try {
    const saved = await saveAttachmentFile(file);
    await db.attachment.create({
      data: { ...saved, assetId, documentType, uploadedById: user.id },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo subir el archivo." };
  }

  revalidatePath(`/assets/${assetId}`);
  return {};
}

export async function uploadWorkOrderAttachment(
  workOrderId: string,
  _prevState: AttachmentFormState,
  formData: FormData
): Promise<AttachmentFormState> {
  const user = await requireUser();
  assertCan(user.role, "update", "workOrder");

  const wo = await db.workOrder.findUnique({ where: { id: workOrderId } });
  if (!wo) return { error: "Orden de trabajo no encontrada." };
  if (user.role === "TECHNICIAN" && wo.assignedToId && wo.assignedToId !== user.id) {
    return { error: "Esta orden está asignada a otro técnico." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const documentType = String(formData.get("documentType") || "").trim() || null;

  try {
    const saved = await saveAttachmentFile(file);
    await db.attachment.create({
      data: { ...saved, workOrderId, documentType, uploadedById: user.id },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo subir el archivo." };
  }

  revalidatePath(`/work-orders/${workOrderId}`);
  return {};
}

export async function deleteAttachment(attachmentId: string) {
  const user = await requireUser();

  const attachment = await db.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment) return;

  if (attachment.assetId) {
    assertCan(user.role, "manage", "asset");
  } else if (attachment.workOrderId) {
    assertCan(user.role, "manage", "workOrder");
  } else if (attachment.calibrationRecordId) {
    assertCan(user.role, "manage", "asset");
  }

  await db.attachment.delete({ where: { id: attachmentId } });
  await deleteAttachmentFile(attachment.filename);

  if (attachment.assetId) revalidatePath(`/assets/${attachment.assetId}`);
  if (attachment.workOrderId) revalidatePath(`/work-orders/${attachment.workOrderId}`);
}
