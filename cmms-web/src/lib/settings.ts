import "server-only";
import { db } from "@/lib/db";

export async function getInstitutionSettings() {
  const existing = await db.institutionSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;

  return db.institutionSettings.create({
    data: { id: "default" },
  });
}
