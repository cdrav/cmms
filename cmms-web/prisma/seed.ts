import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Cambiar123!", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@hospital.local" },
    update: {},
    create: {
      name: "Administrador CMMS",
      email: "admin@hospital.local",
      passwordHash,
      role: "ADMIN",
    },
  });

  const manager = await db.user.upsert({
    where: { email: "jefe.mantenimiento@hospital.local" },
    update: {},
    create: {
      name: "Jefe de Mantenimiento",
      email: "jefe.mantenimiento@hospital.local",
      passwordHash,
      role: "MANAGER",
    },
  });

  const tech = await db.user.upsert({
    where: { email: "tecnico@hospital.local" },
    update: {},
    create: {
      name: "Técnico de Mantenimiento",
      email: "tecnico@hospital.local",
      passwordHash,
      role: "TECHNICIAN",
    },
  });

  const plantaElectrica = await db.asset.upsert({
    where: { code: "EQ-001" },
    update: {},
    create: {
      code: "EQ-001",
      name: "Planta eléctrica de emergencia",
      category: "Infraestructura",
      location: "Cuarto de máquinas - Sótano",
      manufacturer: "Cummins",
      model: "C150D5",
      serialNumber: "CU-88213",
      criticality: "CRITICAL",
      status: "OPERATIONAL",
    },
  });

  const autoclave = await db.asset.upsert({
    where: { code: "EQ-002" },
    update: {},
    create: {
      code: "EQ-002",
      name: "Autoclave central de esterilización",
      category: "Equipo médico",
      location: "Central de Esterilización",
      manufacturer: "Getinge",
      model: "GSS67H",
      serialNumber: "GT-55201",
      criticality: "CRITICAL",
      status: "OPERATIONAL",
    },
  });

  const bombaInfusion = await db.asset.upsert({
    where: { code: "EQ-003" },
    update: {},
    create: {
      code: "EQ-003",
      name: "Bomba de infusión volumétrica",
      category: "Equipo médico",
      location: "UCI - Cama 4",
      manufacturer: "B. Braun",
      model: "Infusomat Space",
      serialNumber: "BB-30442",
      criticality: "HIGH",
      status: "OPERATIONAL",
    },
  });

  const aireQuirofano = await db.asset.upsert({
    where: { code: "EQ-004" },
    update: {},
    create: {
      code: "EQ-004",
      name: "Aire acondicionado de precisión - Quirófano 2",
      category: "Infraestructura",
      location: "Quirófano 2",
      manufacturer: "Carrier",
      model: "AquaSnap 30RA",
      serialNumber: "CA-77120",
      criticality: "HIGH",
      status: "OPERATIONAL",
    },
  });

  const filtroAutoclave = await db.inventoryItem.upsert({
    where: { code: "REP-001" },
    update: {},
    create: {
      code: "REP-001",
      name: "Filtro bacteriológico para autoclave",
      unit: "unidad",
      quantityOnHand: 8,
      reorderPoint: 3,
      reorderQuantity: 10,
      unitCost: 45.5,
      location: "Almacén de mantenimiento",
    },
  });

  const filtroAireAcond = await db.inventoryItem.upsert({
    where: { code: "REP-002" },
    update: {},
    create: {
      code: "REP-002",
      name: "Filtro de aire HEPA",
      unit: "unidad",
      quantityOnHand: 2,
      reorderPoint: 4,
      reorderQuantity: 12,
      unitCost: 32.0,
      location: "Almacén de mantenimiento",
    },
  });

  await db.inventoryItem.upsert({
    where: { code: "REP-003" },
    update: {},
    create: {
      code: "REP-003",
      name: "Aceite lubricante para planta eléctrica",
      unit: "litro",
      quantityOnHand: 40,
      reorderPoint: 15,
      reorderQuantity: 50,
      unitCost: 8.75,
      location: "Almacén de mantenimiento",
    },
  });

  const pmAutoclave = await db.pmSchedule.upsert({
    where: { id: "seed-pm-autoclave" },
    update: {},
    create: {
      id: "seed-pm-autoclave",
      assetId: autoclave.id,
      title: "Mantenimiento preventivo trimestral - Autoclave",
      description: "Revisión de sellos, calibración de presión y cambio de filtros.",
      frequencyDays: 90,
      nextDueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // vencido hace 2 días (demo)
      estimatedHours: 3,
      instructions: "Ver manual del fabricante Getinge GSS67H, sección 4.",
    },
  });

  await db.pmSchedule.upsert({
    where: { id: "seed-pm-planta" },
    update: {},
    create: {
      id: "seed-pm-planta",
      assetId: plantaElectrica.id,
      title: "Mantenimiento preventivo mensual - Planta eléctrica",
      description: "Prueba de arranque en vacío, cambio de aceite si aplica, revisión de batería.",
      frequencyDays: 30,
      nextDueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      estimatedHours: 2,
    },
  });

  await db.pmSchedule.upsert({
    where: { id: "seed-pm-aire" },
    update: {},
    create: {
      id: "seed-pm-aire",
      assetId: aireQuirofano.id,
      title: "Mantenimiento preventivo bimestral - A/A Quirófano 2",
      description: "Limpieza de serpentines y cambio de filtros HEPA.",
      frequencyDays: 60,
      nextDueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      estimatedHours: 1.5,
    },
  });

  const existingWo = await db.workOrder.findUnique({ where: { code: "OT-2026-0001" } });
  const wo =
    existingWo ??
    (await db.workOrder.create({
      data: {
        code: "OT-2026-0001",
        assetId: bombaInfusion.id,
        type: "CORRECTIVE",
        priority: "HIGH",
        status: "IN_PROGRESS",
        description: "Bomba de infusión marca error E-12 y se detiene sola.",
        requestedById: tech.id,
        assignedToId: tech.id,
        startedAt: new Date(),
      },
    }));

  await db.workOrderStatusLog.upsert({
    where: { id: "seed-wo-log-1" },
    update: {},
    create: {
      id: "seed-wo-log-1",
      workOrderId: wo.id,
      fromStatus: "REQUESTED",
      toStatus: "IN_PROGRESS",
      changedById: manager.id,
      comment: "Asignada al técnico de turno por prioridad alta (equipo en UCI).",
    },
  });

  console.log("Seed completado:");
  console.log("  admin@hospital.local / Cambiar123!");
  console.log("  jefe.mantenimiento@hospital.local / Cambiar123!");
  console.log("  tecnico@hospital.local / Cambiar123!");
  console.log({ admin: admin.email, manager: manager.email, tech: tech.email });
  console.log({ filtroAutoclave: filtroAutoclave.code, filtroAireAcond: filtroAireAcond.code });
  console.log({ pmAutoclave: pmAutoclave.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
