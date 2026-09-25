"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { generateWorkOrderCode } from "@/lib/codes";
import { availableTransitions } from "@/lib/work-order-transitions";

const createSchema = z.object({
  assetId: z.string().min(1, "Selecciona un equipo"),
  type: z.enum(["CORRECTIVE", "PREVENTIVE", "EMERGENCY", "INSPECTION"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string().trim().min(1, "Describe el problema o trabajo a realizar"),
});

export type WoFormState = { error?: string };

export async function createWorkOrder(
  _prevState: WoFormState,
  formData: FormData
): Promise<WoFormState> {
  const user = await requireUser();
  assertCan(user.role, "create", "workOrder");

  const parsed = createSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const code = await generateWorkOrderCode();
  const wo = await db.workOrder.create({
    data: {
      code,
      assetId: parsed.data.assetId,
      type: parsed.data.type,
      priority: parsed.data.priority,
      description: parsed.data.description,
      requestedById: user.id,
      status: "REQUESTED",
    },
  });

  await db.workOrderStatusLog.create({
    data: {
      workOrderId: wo.id,
      fromStatus: null,
      toStatus: "REQUESTED",
      changedById: user.id,
      comment: "Solicitud creada.",
    },
  });

  revalidatePath("/work-orders");
  redirect(`/work-orders/${wo.id}`);
}

const transitionSchema = z.object({
  toStatus: z.enum(["IN_PROGRESS", "WAITING_PARTS", "COMPLETED", "CLOSED", "REJECTED"]),
  comment: z.string().trim().optional(),
  assignedToId: z.string().trim().optional(),
});

export type TransitionFormState = { error?: string };

export async function transitionWorkOrder(
  workOrderId: string,
  _prevState: TransitionFormState,
  formData: FormData
): Promise<TransitionFormState> {
  const user = await requireUser();
  assertCan(user.role, "update", "workOrder");

  const parsed = transitionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { toStatus, comment, assignedToId } = parsed.data;

  const wo = await db.workOrder.findUnique({ where: { id: workOrderId } });
  if (!wo) return { error: "Orden de trabajo no encontrada." };

  const allowed = availableTransitions(wo.status, user.role as "ADMIN" | "MANAGER" | "TECHNICIAN");
  if (!allowed.some((t) => t.to === toStatus)) {
    return { error: "Esa transición no está permitida desde el estado actual." };
  }

  if (
    user.role === "TECHNICIAN" &&
    wo.assignedToId &&
    wo.assignedToId !== user.id
  ) {
    return { error: "Esta orden está asignada a otro técnico." };
  }

  const now = new Date();
  const data: Record<string, unknown> = { status: toStatus };
  if (toStatus === "IN_PROGRESS" && !wo.startedAt) data.startedAt = now;
  if (toStatus === "IN_PROGRESS" && assignedToId) data.assignedToId = assignedToId;
  if (toStatus === "COMPLETED") data.completedAt = now;
  if (toStatus === "CLOSED") data.closedAt = now;

  await db.$transaction([
    db.workOrder.update({ where: { id: workOrderId }, data }),
    db.workOrderStatusLog.create({
      data: {
        workOrderId,
        fromStatus: wo.status,
        toStatus,
        changedById: user.id,
        comment: comment || null,
      },
    }),
  ]);

  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath("/work-orders");
  return {};
}

const partSchema = z.object({
  inventoryItemId: z.string().min(1, "Selecciona un repuesto"),
  quantityUsed: z.coerce.number().positive("La cantidad debe ser mayor a cero"),
});

export type PartFormState = { error?: string };

export async function addWorkOrderPart(
  workOrderId: string,
  _prevState: PartFormState,
  formData: FormData
): Promise<PartFormState> {
  const user = await requireUser();
  assertCan(user.role, "update", "workOrder");

  const parsed = partSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { inventoryItemId, quantityUsed } = parsed.data;

  const wo = await db.workOrder.findUnique({ where: { id: workOrderId } });
  if (!wo) return { error: "Orden de trabajo no encontrada." };
  if (wo.status === "CLOSED" || wo.status === "REJECTED") {
    return { error: "No se pueden registrar repuestos en una orden cerrada o rechazada." };
  }

  const item = await db.inventoryItem.findUnique({ where: { id: inventoryItemId } });
  if (!item) return { error: "Repuesto no encontrado." };
  if (item.quantityOnHand < quantityUsed) {
    return { error: `Stock insuficiente: quedan ${item.quantityOnHand} ${item.unit}.` };
  }

  await db.$transaction([
    db.workOrderPart.create({
      data: {
        workOrderId,
        inventoryItemId,
        quantityUsed,
        unitCostSnapshot: item.unitCost,
      },
    }),
    db.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { quantityOnHand: { decrement: quantityUsed } },
    }),
    db.inventoryTransaction.create({
      data: {
        inventoryItemId,
        type: "OUT",
        quantity: quantityUsed,
        workOrderId,
        performedById: user.id,
        notes: `Consumo en orden de trabajo ${wo.code}`,
      },
    }),
  ]);

  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath(`/inventory/${inventoryItemId}`);
  revalidatePath("/inventory");
  return {};
}

const checklistSchema = z.object({
  label: z.string().trim().min(1, "Describe la actividad"),
  completed: z.coerce.boolean().optional(),
});

export type ChecklistFormState = { error?: string };

export async function addChecklistItem(
  workOrderId: string,
  _prevState: ChecklistFormState,
  formData: FormData
): Promise<ChecklistFormState> {
  const user = await requireUser();
  assertCan(user.role, "update", "workOrder");

  const parsed = checklistSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    completed: formData.get("completed") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await db.workOrderChecklistItem.create({
    data: { workOrderId, label: parsed.data.label, completed: parsed.data.completed ?? false },
  });

  revalidatePath(`/work-orders/${workOrderId}`);
  return {};
}

export async function toggleChecklistItem(itemId: string, workOrderId: string) {
  const user = await requireUser();
  assertCan(user.role, "update", "workOrder");

  const item = await db.workOrderChecklistItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  await db.workOrderChecklistItem.update({
    where: { id: itemId },
    data: { completed: !item.completed },
  });

  revalidatePath(`/work-orders/${workOrderId}`);
}

const measurementSchema = z.object({
  variable: z.string().trim().min(1, "Indica qué variable se midió"),
  unit: z.string().trim().optional(),
  referenceValue: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  measuredValue: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
});

export type MeasurementFormState = { error?: string };

export async function addMeasurement(
  workOrderId: string,
  _prevState: MeasurementFormState,
  formData: FormData
): Promise<MeasurementFormState> {
  const user = await requireUser();
  assertCan(user.role, "update", "workOrder");

  const parsed = measurementSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await db.workOrderMeasurement.create({
    data: {
      workOrderId,
      variable: parsed.data.variable,
      unit: parsed.data.unit || null,
      referenceValue: parsed.data.referenceValue ?? null,
      measuredValue: parsed.data.measuredValue ?? null,
    },
  });

  revalidatePath(`/work-orders/${workOrderId}`);
  return {};
}

const signatureSchema = z.object({
  role: z.enum(["DELIVERED_BY", "RECEIVED_BY"]),
  signerName: z.string().trim().min(1, "Indica el nombre de quien firma"),
  signerRole: z.string().trim().min(1, "Indica el cargo de quien firma"),
  imageDataUrl: z.string().min(1, "Falta la firma dibujada"),
});

export type SignatureFormState = { error?: string };

export async function addWorkOrderSignature(
  workOrderId: string,
  _prevState: SignatureFormState,
  formData: FormData
): Promise<SignatureFormState> {
  const user = await requireUser();
  assertCan(user.role, "update", "workOrder");

  const parsed = signatureSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Falta dibujar la firma." };

  await db.workOrderSignature.create({
    data: {
      workOrderId,
      role: parsed.data.role,
      signerName: parsed.data.signerName,
      signerRole: parsed.data.signerRole,
      imageDataUrl: parsed.data.imageDataUrl,
    },
  });

  revalidatePath(`/work-orders/${workOrderId}`);
  return {};
}
