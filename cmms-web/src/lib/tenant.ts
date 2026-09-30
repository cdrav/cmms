import "server-only";
import { getCurrentUser } from "./auth";

/**
 * Helper para agregar filtro de organización a las queries de Prisma.
 * Esto asegura el aislamiento de datos en la arquitectura multi-tenant.
 */
export async function withOrganizationFilter<T extends Record<string, any>>(
  query: T
): Promise<T> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // Agregar organizationId a la query
  return {
    ...query,
    where: {
      ...query.where,
      organizationId: user.organizationId,
    },
  } as T;
}

/**
 * Helper para obtener el siteId del usuario actual (si tiene)
 */
export async function getCurrentSiteId() {
  const user = await getCurrentUser();
  return user?.siteId;
}

/**
 * Helper para agregar filtro de site a las queries (opcional)
 */
export async function withSiteFilter<T extends Record<string, any>>(
  query: T
): Promise<T> {
  const siteId = await getCurrentSiteId();
  if (!siteId) {
    return query;
  }

  return {
    ...query,
    where: {
      ...query.where,
      siteId,
    },
  } as T;
}
