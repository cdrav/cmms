"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";

const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  description: z.string().trim().optional(),
  assignedToId: z.string().trim().optional(),
  dueDate: z.string().optional(),
});

export type TaskFormState = { error?: string };

export async function createTask(
  _prevState: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const user = await requireUser();
  assertCan(user.role, "create", "task");

  const parsed = taskSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await db.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      assignedToId: parsed.data.assignedToId || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      createdById: user.id,
    },
  });

  revalidatePath("/tasks");
  return {};
}

export async function setTaskStatus(taskId: string, formData: FormData) {
  const user = await requireUser();

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  const canManage = can(user.role, "manage", "task");
  const isOwner = task.assignedToId === user.id || task.createdById === user.id;
  if (!canManage && !(can(user.role, "update", "task") && isOwner)) {
    throw new Error("No autorizado para actualizar esta tarea.");
  }

  const status = formData.get("status");
  if (status !== "PENDING" && status !== "IN_PROGRESS" && status !== "DONE") return;

  await db.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });

  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  assertCan(user.role, "manage", "task");

  await db.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
}
