// Script standalone para programar (Task Scheduler de Windows o cron) y generar
// automáticamente órdenes de trabajo a partir de los programas de mantenimiento
// preventivo vencidos. Ejecutar con: npm run pm:generate
//
// Usa la misma lógica que el botón "Generar orden de trabajo" del módulo de PM
// (ver src/app/(dashboard)/pm-schedules/actions.ts), pero corre fuera de una
// sesión autenticada, así que las órdenes quedan atribuidas a un usuario
// "sistema" que se debe indicar con la variable de entorno PM_SYSTEM_USER_EMAIL,
// o al primer administrador activo si no se define.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const systemUser = process.env.PM_SYSTEM_USER_EMAIL
    ? await db.user.findUnique({ where: { email: process.env.PM_SYSTEM_USER_EMAIL } })
    : await db.user.findFirst({ where: { role: "ADMIN", active: true }, orderBy: { createdAt: "asc" } });

  if (!systemUser) {
    throw new Error(
      "No se encontró un usuario para atribuir las órdenes generadas. Define PM_SYSTEM_USER_EMAIL o crea un usuario ADMIN."
    );
  }

  const now = new Date();
  const dueSchedules = await db.pmSchedule.findMany({
    where: { active: true, nextDueAt: { lte: now } },
  });

  if (dueSchedules.length === 0) {
    console.log("No hay programas de mantenimiento preventivo vencidos.");
    return;
  }

  for (const pm of dueSchedules) {
    const year = now.getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
    const count = await db.workOrder.count({ where: { requestedAt: { gte: start, lt: end } } });
    const code = `OT-${year}-${String(count + 1).padStart(4, "0")}`;

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
          requestedById: systemUser.id,
        },
      });
      await tx.workOrderStatusLog.create({
        data: {
          workOrderId: wo.id,
          fromStatus: null,
          toStatus: "REQUESTED",
          changedById: systemUser.id,
          comment: `Generada automáticamente (tarea programada) desde "${pm.title}".`,
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

    console.log(`Generada ${code} desde el programa "${pm.title}".`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
