"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, hashPassword } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

const createSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN"]),
});

export type UserFormState = { error?: string };

export async function createUser(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "user");

  const parsed = createSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
      },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe un usuario con ese correo." };
    }
    throw e;
  }

  revalidatePath("/users");
  redirect("/users");
}

const updateSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN"]),
  active: z.coerce.boolean().optional(),
  password: z.string().optional(),
});

export async function updateUser(
  id: string,
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const currentUser = await requireUser();
  assertCan(currentUser.role, "manage", "user");

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateSchema.safeParse({ ...raw, active: formData.get("active") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  if (id === currentUser.id && parsed.data.active === false) {
    return { error: "No puedes desactivar tu propia cuenta." };
  }

  const data: Record<string, unknown> = {
    name: parsed.data.name,
    role: parsed.data.role,
    active: parsed.data.active ?? true,
  };

  if (parsed.data.password) {
    if (parsed.data.password.length < 8) {
      return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
    }
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  await db.user.update({ where: { id }, data });

  revalidatePath("/users");
  redirect("/users");
}
