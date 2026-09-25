"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

const settingsSchema = z.object({
  institutionName: z.string().trim().max(200).optional(),
  taxId: z.string().trim().max(50).optional(),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
  healthRegistryCode: z.string().trim().max(50).optional(),
  siteName: z.string().trim().max(200).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (usa formato #RRGGBB)"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (usa formato #RRGGBB)"),
});

export type SettingsFormState = { error?: string };

const MAX_LOGO_BYTES = 500 * 1024; // 500 KB — el logo va embebido directo en cada PDF

export async function updateSettings(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "settings");

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const d = parsed.data;

  let logoDataUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) {
      return { error: "El logo debe pesar menos de 500 KB." };
    }
    const buffer = Buffer.from(await logo.arrayBuffer());
    logoDataUrl = `data:${logo.type || "image/png"};base64,${buffer.toString("base64")}`;
  }

  const shared = {
    institutionName: d.institutionName || "",
    taxId: d.taxId || null,
    address: d.address || null,
    phone: d.phone || null,
    email: d.email || null,
    healthRegistryCode: d.healthRegistryCode || null,
    siteName: d.siteName || null,
    primaryColor: d.primaryColor,
    secondaryColor: d.secondaryColor,
  };

  await db.institutionSettings.upsert({
    where: { id: "default" },
    update: { ...shared, ...(logoDataUrl ? { logoDataUrl } : {}) },
    create: { id: "default", ...shared, logoDataUrl },
  });

  revalidatePath("/settings");
  return {};
}
