import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  DOCUMENT_TYPE_LABEL,
  SEX_LABEL,
  AGE_UNIT_LABEL,
  TIMING_LABEL,
  EVENT_TYPE_LABEL,
  OUTCOME_LABEL,
  CAUSE_LABEL,
  CASE_STATUS_LABEL,
} from "@/lib/adverse-event-labels";
import { setAdverseEventStatus, deleteAdverseEventCase } from "../actions";

export default async function AdverseEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const c = await db.adverseEventCase.findUnique({
    where: { id },
    include: { asset: true, createdBy: true },
  });
  if (!c) notFound();

  const canManage = can(user.role, "manage", "adverseEvent");
  const causes = c.probableCauses.split(",").filter(Boolean);
  const statusAction = setAdverseEventStatus.bind(null, c.id);
  const deleteAction = deleteAdverseEventCase.bind(null, c.id);

  return (
    <div>
      <PageHeader
        title={`Caso — ${c.asset.code} — ${c.asset.name}`}
        description={`Reportado por ${c.createdBy.name} el ${formatDateTime(c.createdAt)}`}
        action={
          canManage && (
            <div className="flex gap-2">
              <Link
                href={`/adverse-events/${c.id}/edit`}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Editar
              </Link>
              <form action={deleteAction}>
                <button type="submit" className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                  Eliminar
                </button>
              </form>
            </div>
          )
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">El evento</h2>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <Row label="Tipo de evento" value={EVENT_TYPE_LABEL[c.eventType]} />
              <Row label="Momento" value={TIMING_LABEL[c.timing]} />
              <Row label="Fecha del evento" value={formatDate(c.eventDate)} />
              <Row label="Fecha del reporte" value={formatDate(c.reportDate)} />
              <Row label="Desenlace" value={c.outcome ? OUTCOME_LABEL[c.outcome] : "—"} />
              {c.outcomeOther && <Row label="Desenlace (detalle)" value={c.outcomeOther} />}
            </dl>
            {c.description && <p className="mt-3 whitespace-pre-wrap text-slate-700">{c.description}</p>}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Causa probable</h2>
            <ul className="mt-2 list-inside list-disc text-slate-700">
              {causes.map((cause) => (
                <li key={cause}>{CAUSE_LABEL[cause] ?? cause}</li>
              ))}
            </ul>
            {c.causeOther && <p className="mt-2 text-slate-600">Otra causa: {c.causeOther}</p>}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Seguimiento</h2>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <Row label="Acciones correctivas iniciadas" value={c.correctiveActionsInitiated ? "Sí" : "No"} />
              <Row label="Reportado al distribuidor" value={c.reportedToDistributor ? "Sí" : "No"} />
              <Row label="Fecha reporte al distribuidor" value={formatDate(c.distributorReportDate)} />
              <Row label="Fecha envío al distribuidor" value={formatDate(c.distributorSentDate)} />
              <Row label="Correo institucional" value={c.institutionalEmail ?? "—"} />
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Datos del paciente</h2>
            <dl className="mt-3 space-y-2">
              <Row label="Tipo de documento" value={DOCUMENT_TYPE_LABEL[c.patientDocumentType]} />
              <Row label="Sexo" value={SEX_LABEL[c.patientSex]} />
              <Row
                label="Edad"
                value={c.patientAgeValue ? `${c.patientAgeValue} ${c.patientAgeUnit ? AGE_UNIT_LABEL[c.patientAgeUnit] : ""}` : "—"}
              />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Estado del caso</h2>
            <p className="mt-2 font-medium text-slate-900">{CASE_STATUS_LABEL[c.status]}</p>
            {canManage && (
              <form action={statusAction} className="mt-3 flex gap-2">
                <select name="status" defaultValue={c.status} className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                  {Object.entries(CASE_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Actualizar
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value}</dd>
    </div>
  );
}
