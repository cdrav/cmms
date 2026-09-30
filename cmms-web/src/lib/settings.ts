import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "./auth";

export async function getInstitutionSettings() {
  const user = await getCurrentUser();
  if (!user) {
    // Fallback para login page cuando no hay usuario
    const existing = await db.institutionSettings.findUnique({ where: { id: "default" } });
    if (existing) return existing;

    return db.institutionSettings.create({
      data: { id: "default" },
    });
  }

  // Multi-tenant: usar configuración de la organización del usuario
  const organization = await db.organization.findUnique({
    where: { id: user.organizationId },
  });

  if (!organization) {
    // Fallback si no existe la organización
    const existing = await db.institutionSettings.findUnique({ where: { id: "default" } });
    if (existing) return existing;

    return db.institutionSettings.create({
      data: { id: "default" },
    });
  }

  // Convertir Organization al formato esperado por la UI
  return {
    id: "default",
    institutionName: organization.name,
    taxId: organization.taxId,
    address: organization.address,
    phone: organization.phone,
    email: organization.email,
    healthRegistryCode: organization.healthRegistryCode,
    siteName: user.site?.name,
    logoDataUrl: organization.logoDataUrl,
    primaryColor: organization.primaryColor,
    secondaryColor: organization.secondaryColor,
    updatedAt: organization.updatedAt,
  };
}
