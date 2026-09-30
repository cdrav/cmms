"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "Ingresa correo y contraseña." };
  }

  const user = await authenticate(email, password);
  if (!user) {
    return { error: "Credenciales inválidas." };
  }

  // Solo se permite redirigir a una ruta relativa propia (nunca "//host" ni URLs absolutas),
  // para evitar que un enlace de login manipulado mande al usuario a un sitio externo.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    organizationId: user.organizationId,
    siteId: user.siteId || undefined,
  });
  redirect(safeNext);
}
