"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { generateWorkOrderCode } from "@/lib/codes";

const pmSchema = z.object({
  assetId: z.string().min(1, "Selecciona un equipo"),
  title: z.string().trim().min(1, "El título es obligatorio"),
  description: z.string().trim().optional(),
  frequencyDays: z.coerce.number().int().positive("La frecuencia debe ser un número de días mayor a cero"),
  nextDueAt: z.string().min(1, "Selecciona la próxima fecha de vencimiento"),
  estimatedHours: z.coerce.number().min(0).optional(),
  instructions: z.string().trim().optional(),
  active: z.coerce.boolean().optional(),
});

export type PmFormState = { error?: string };

function parsePmForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = pmSchema.safeParse({ ...raw, active: formData.get("active") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" } as const;
  return { data: parsed.data } as const;
}

export async function createPmSchedule(
  _prevState: PmFormState,
  formData: FormData
): Promise<PmFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "pmSchedule");

  const result = parsePmForm(formData);
  if ("error" in result) return { error: result.error };
  const d = result.data;

  const pm = await db.pmSchedule.create({
    data: {
      assetId: d.assetId,
      title: d.title,
      description: d.description || null,
      frequencyDays: d.frequencyDays,
      nextDueAt: new Date(d.nextDueAt),
      estimatedHours: d.estimatedHours ?? null,
      instructions: d.instructions || null,
      active: d.active ?? true,
    },
  });

  revalidatePath("/pm-schedules");
  redirect(`/pm-schedules/${pm.id}`);
}

export async function updatePmSchedule(
  id: string,
  _prevState: PmFormState,
  formData: FormData
): Promise<PmFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "pmSchedule");

  const result = parsePmForm(formData);
  if ("error" in result) return { error: result.error };
  const d = result.data;

  await db.pmSchedule.update({
    where: { id },
    data: {
      assetId: d.assetId,
      title: d.title,
      description: d.description || null,
      frequencyDays: d.frequencyDays,
      nextDueAt: new Date(d.nextDueAt),
      estimatedHours: d.estimatedHours ?? null,
      instructions: d.instructions || null,
      active: d.active ?? true,
    },
  });

  revalidatePath("/pm-schedules");
  revalidatePath(`/pm-schedules/${id}`);
  redirect(`/pm-schedules/${id}`);
}

export async function generateWorkOrderFromPm(pmScheduleId: string) {
  const user = await requireUser();
  assertCan(user.role, "manage", "pmSchedule");

  const pm = await db.pmSchedule.findUnique({ where: { id: pmScheduleId } });
  if (!pm) throw new Error("Programa de mantenimiento no encontrado.");

  const code = await generateWorkOrderCode();
  const now = new Date();

  await db.$transaction(async (tx) => {
    const wo = await tx.workOrder.create({
      data: {
        code,
        assetId: pm.assetId,
        pmScheduleId: pm.id,
        type: "PREVENTIVE",
        priority: "MEDIUM",
        status: "REQUESTED",
        description: pm.description || pm.title,
        requestedById: user.id,
      },
    });
    await tx.workOrderStatusLog.create({
      data: {
        workOrderId: wo.id,
        fromStatus: null,
        toStatus: "REQUESTED",
        changedById: user.id,
        comment: `Generada automáticamente desde el programa de mantenimiento preventivo "${pm.title}".`,
      },
    });
    await tx.pmSchedule.update({
      where: { id: pm.id },
      data: {
        lastGeneratedAt: now,
        nextDueAt: new Date(now.getTime() + pm.frequencyDays * 24 * 60 * 60 * 1000),
      },
    });
  });

  revalidatePath("/pm-schedules");
  revalidatePath(`/pm-schedules/${pmScheduleId}`);
  revalidatePath("/work-orders");
}
