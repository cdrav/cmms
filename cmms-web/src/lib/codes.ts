import { db } from "@/lib/db";

// Genera códigos tipo OT-2026-0001, reiniciando el consecutivo cada año calendario.
export async function generateWorkOrderCode(): Promise<string> {
  const year = new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const count = await db.workOrder.count({
    where: { requestedAt: { gte: start, lt: end } },
  });

  return `OT-${year}-${String(count + 1).padStart(4, "0")}`;
}
