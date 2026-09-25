"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

const caseSchema = z.object({
  assetId: z.string().min(1, "Selecciona el equipo involucrado"),
  patientDocumentType: z.enum(["CEDULA", "TARJETA_IDENTIDAD", "REGISTRO_CIVIL", "PASAPORTE", "HISTORIA_CLINICA"]),
  patientSex: z.enum(["FEMENINO", "MASCULINO", "SIN_DATO"]),
  patientAgeValue: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  patientAgeUnit: z.enum(["SEMANAS", "MESES", "ANIOS"]).optional().or(z.literal("").transform(() => undefined)),
  eventDate: z.string().min(1, "Indica la fecha del evento"),
  timing: z.enum(["ANTES_DEL_USO", "DURANTE_EL_USO", "DESPUES_DEL_USO"]),
  eventType: z.enum(["EVENTO_ADVERSO_SERIO", "EVENTO_ADVERSO_NO_SERIO", "INCIDENTE_ADVERSO_SERIO", "INCIDENTE_ADVERSO_NO_SERIO"]),
  outcome: z.enum(["MURIO", "OTRO"]).optional().or(z.literal("").transform(() => undefined)),
  outcomeOther: z.string().trim().optional(),
  causeOther: z.string().trim().optional(),
  correctiveActionsInitiated: z.coerce.boolean().optional(),
  reportedToDistributor: z.coerce.boolean().optional(),
  distributorReportDate: z.string().optional(),
  distributorSentDate: z.string().optional(),
  institutionalEmail: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
  description: z.string().trim().optional(),
  status: z.enum(["ABIERTO", "EN_SEGUIMIENTO", "CERRADO"]).optional(),
});

export type CaseFormState = { error?: string };

function toDate(value?: string) {
  return value ? new Date(value) : null;
}

export async function createAdverseEventCase(
  _prevState: CaseFormState,
  formData: FormData
): Promise<CaseFormState> {
  const user = await requireUser();
  assertCan(user.role, "create", "adverseEvent");

  const raw = Object.fromEntries(formData.entries());
  const parsed = caseSchema.safeParse({
    ...raw,
    correctiveActionsInitiated: formData.get("correctiveActionsInitiated") === "on",
    reportedToDistributor: formData.get("reportedToDistributor") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const probableCauses = formData.getAll("probableCauses").map(String);
  if (probableCauses.length === 0) return { error: "Selecciona al menos una causa probable." };

  const d = parsed.data;
  const created = await db.adverseEventCase.create({
    data: {
      assetId: d.assetId,
      patientDocumentType: d.patientDocumentType,
      patientSex: d.patientSex,
      patientAgeValue: d.patientAgeValue ?? null,
      patientAgeUnit: d.patientAgeUnit ?? null,
      eventDate: new Date(d.eventDate),
      timing: d.timing,
      eventType: d.eventType,
      outcome: d.outcome ?? null,
      outcomeOther: d.outcomeOther || null,
      probableCauses: probableCauses.join(","),
      causeOther: d.causeOther || null,
      correctiveActionsInitiated: d.correctiveActionsInitiated ?? false,
      reportedToDistributor: d.reportedToDistributor ?? false,
      distributorReportDate: toDate(d.distributorReportDate),
      distributorSentDate: toDate(d.distributorSentDate),
      institutionalEmail: d.institutionalEmail || null,
      description: d.description || null,
      createdById: user.id,
    },
  });

  revalidatePath("/adverse-events");
  redirect(`/adverse-events/${created.id}`);
}

export async function updateAdverseEventCase(
  id: string,
  _prevState: CaseFormState,
  formData: FormData
): Promise<CaseFormState> {
  const user = await requireUser();
  assertCan(user.role, "manage", "adverseEvent");

  const raw = Object.fromEntries(formData.entries());
  const parsed = caseSchema.safeParse({
    ...raw,
    correctiveActionsInitiated: formData.get("correctiveActionsInitiated") === "on",
    reportedToDistributor: formData.get("reportedToDistributor") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const probableCauses = formData.getAll("probableCauses").map(String);
  if (probableCauses.length === 0) return { error: "Selecciona al menos una causa probable." };

  const d = parsed.data;
  await db.adverseEventCase.update({
    where: { id },
    data: {
      assetId: d.assetId,
      patientDocumentType: d.patientDocumentType,
      patientSex: d.patientSex,
      patientAgeValue: d.patientAgeValue ?? null,
      patientAgeUnit: d.patientAgeUnit ?? null,
      eventDate: new Date(d.eventDate),
      timing: d.timing,
      eventType: d.eventType,
      outcome: d.outcome ?? null,
      outcomeOther: d.outcomeOther || null,
      probableCauses: probableCauses.join(","),
      causeOther: d.causeOther || null,
      correctiveActionsInitiated: d.correctiveActionsInitiated ?? false,
      reportedToDistributor: d.reportedToDistributor ?? false,
      distributorReportDate: toDate(d.distributorReportDate),
      distributorSentDate: toDate(d.distributorSentDate),
      institutionalEmail: d.institutionalEmail || null,
      description: d.description || null,
      status: d.status ?? undefined,
    },
  });

  revalidatePath("/adverse-events");
  revalidatePath(`/adverse-events/${id}`);
  redirect(`/adverse-events/${id}`);
}

export async function setAdverseEventStatus(id: string, formData: FormData) {
  const user = await requireUser();
  assertCan(user.role, "manage", "adverseEvent");

  const status = formData.get("status");
  if (status !== "ABIERTO" && status !== "EN_SEGUIMIENTO" && status !== "CERRADO") return;

  await db.adverseEventCase.update({ where: { id }, data: { status } });
  revalidatePath(`/adverse-events/${id}`);
  revalidatePath("/adverse-events");
}

export async function deleteAdverseEventCase(id: string) {
  const user = await requireUser();
  assertCan(user.role, "manage", "adverseEvent");

  await db.adverseEventCase.delete({ where: { id } });
  revalidatePath("/adverse-events");
  redirect("/adverse-events");
}
