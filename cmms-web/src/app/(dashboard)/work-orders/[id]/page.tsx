import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { availableTransitions } from "@/lib/work-order-transitions";
import { computeRif } from "@/lib/rif";
import { AttachmentList } from "@/components/attachment-list";
import { AttachmentUploadForm } from "@/components/attachment-upload-form";
import { uploadWorkOrderAttachment } from "../../attachments/actions";
import { TransitionForm } from "../transition-form";
import { PartForm } from "../part-form";
import { ChecklistForm } from "../checklist-form";
import { MeasurementForm } from "../measurement-form";
import { SignatureForm } from "../signature-form";
import { toggleChecklistItem } from "../actions";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const wo = await db.workOrder.findUnique({
    where: { id },
    include: {
      asset: true,
      requestedBy: true,
      assignedTo: true,
      statusLogs: { orderBy: { changedAt: "asc" }, include: { changedBy: true } },
      parts: { include: { inventoryItem: true }, orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" }, include: { uploadedBy: true } },
      checklistItems: { orderBy: { createdAt: "asc" } },
      measurements: { orderBy: { createdAt: "asc" } },
      signatures: { orderBy: { signedAt: "asc" } },
    },
  });
  if (!wo) notFound();

  const [technicians, items] = await Promise.all([
    db.user.findMany({ where: { role: "TECHNICIAN", active: true }, select: { id: true, name: true } }),
    db.inventoryItem.findMany({
      select: { id: true, code: true, name: true, unit: true, quantityOnHand: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const transitions = availableTransitions(wo.status, user.role as "ADMIN" | "MANAGER" | "TECHNICIAN");
  const canAct =
    can(user.role, "update", "workOrder") &&
    (user.role !== "TECHNICIAN" || !wo.assignedToId || wo.assignedToId === user.id);

  const partsTotal = wo.parts.reduce((sum, p) => sum + p.quantityUsed * p.unitCostSnapshot, 0);
  const rif = computeRif(wo.priority, wo.asset.criticality);
  const uploadAction = uploadWorkOrderAttachment.bind(null, wo.id);

  return (
    <div>
      <PageHeader
        title={wo.code}
        description={`${wo.asset.code} — ${wo.asset.name}`}
        action={
          <div className="flex items-center gap-2">
            <Badge value={wo.type} />
            <Badge value={wo.priority} />
            <Badge value={wo.status} />
            <span title="RIF = Prioridad x Criticidad del equipo" className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-white">
              RIF {rif}
            </span>
            <Link
              href={`/api/work-orders/${wo.id}/pdf`}
              target="_blank"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Descargar PDF
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Descripción</h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-700">{wo.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Row label="Equipo" value={<Link href={`/assets/${wo.asset.id}`} className="hover:underline">{wo.asset.code}</Link>} />
              <Row label="Solicitada por" value={wo.requestedBy.name} />
              <Row label="Asignada a" value={wo.assignedTo?.name ?? "Sin asignar"} />
              <Row label="Solicitada" value={formatDateTime(wo.requestedAt)} />
              <Row label="Iniciada" value={formatDateTime(wo.startedAt)} />
              <Row label="Completada" value={formatDateTime(wo.completedAt)} />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Repuestos utilizados</h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Repuesto</th>
                  <th className="py-1">Cantidad</th>
                  <th className="py-1">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wo.parts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1.5">{p.inventoryItem.code} — {p.inventoryItem.name}</td>
                    <td className="py-1.5">{p.quantityUsed} {p.inventoryItem.unit}</td>
                    <td className="py-1.5">{formatCurrency(p.quantityUsed * p.unitCostSnapshot)}</td>
                  </tr>
                ))}
                {wo.parts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">
                      Sin repuestos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
              {wo.parts.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-200 font-medium">
                    <td className="py-1.5" colSpan={2}>Total materiales</td>
                    <td className="py-1.5">{formatCurrency(partsTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>

            {canAct && wo.status !== "CLOSED" && wo.status !== "REJECTED" && (
              <div className="mt-4 max-w-sm border-t border-slate-100 pt-4">
                <PartForm workOrderId={wo.id} items={items} />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Checklist de actividades</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {wo.checklistItems.map((item) => (
                <li key={item.id} className="flex items-center gap-2 py-1.5">
                  <form action={toggleChecklistItem.bind(null, item.id, wo.id)}>
                    <button
                      type="submit"
                      disabled={!canAct}
                      className={`h-4 w-4 rounded border ${item.completed ? "border-emerald-600 bg-emerald-600" : "border-slate-300 bg-white"}`}
                      aria-label={item.completed ? "Marcar como pendiente" : "Marcar como realizada"}
                    />
                  </form>
                  <span className={item.completed ? "text-slate-700" : "text-slate-500"}>{item.label}</span>
                </li>
              ))}
              {wo.checklistItems.length === 0 && <p className="py-2 text-slate-500">Sin actividades registradas.</p>}
            </ul>
            {canAct && wo.status !== "CLOSED" && wo.status !== "REJECTED" && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <ChecklistForm workOrderId={wo.id} />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Mediciones</h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Variable</th>
                  <th className="py-1">Referencia</th>
                  <th className="py-1">Medido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wo.measurements.map((m) => (
                  <tr key={m.id}>
                    <td className="py-1.5">{m.variable}</td>
                    <td className="py-1.5">{m.referenceValue ?? "—"} {m.unit}</td>
                    <td className="py-1.5">{m.measuredValue ?? "—"} {m.unit}</td>
                  </tr>
                ))}
                {wo.measurements.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">
                      Sin mediciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {canAct && wo.status !== "CLOSED" && wo.status !== "REJECTED" && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <MeasurementForm workOrderId={wo.id} />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Firmas</h2>
            <div className="mt-3 grid grid-cols-2 gap-6">
              {(["DELIVERED_BY", "RECEIVED_BY"] as const).map((role) => {
                const existing = wo.signatures.find((s) => s.role === role);
                const title = role === "DELIVERED_BY" ? "Entregado por" : "Recibido conforme por";
                return (
                  <div key={role}>
                    <p className="text-xs font-medium text-slate-600">{title}</p>
                    {existing ? (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={existing.imageDataUrl} alt={title} className="h-24 rounded border border-slate-200 bg-white" />
                        <p className="mt-1 text-sm text-slate-700">{existing.signerName}</p>
                        <p className="text-xs text-slate-500">{existing.signerRole}</p>
                      </div>
                    ) : canAct && wo.status !== "REJECTED" ? (
                      <div className="mt-2">
                        <SignatureForm workOrderId={wo.id} role={role} title="" />
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">Sin firma.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Fotos y documentos</h2>
            <div className="mt-3">
              <AttachmentList attachments={wo.attachments} canDelete={can(user.role, "manage", "workOrder")} />
            </div>
            {canAct && wo.status !== "CLOSED" && wo.status !== "REJECTED" && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <AttachmentUploadForm action={uploadAction} />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Historial de estados</h2>
            <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">
              {wo.statusLogs.map((log) => (
                <li key={log.id}>
                  <p className="font-medium text-slate-900">
                    {log.fromStatus ? `${log.fromStatus} → ${log.toStatus}` : `Creada como ${log.toStatus}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {log.changedBy.name} · {formatDateTime(log.changedAt)}
                  </p>
                  {log.comment && <p className="mt-1 text-slate-600">{log.comment}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div>
          {canAct && (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">Acciones</h2>
              <div className="mt-3">
                <TransitionForm workOrderId={wo.id} transitions={transitions} technicians={technicians} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}
