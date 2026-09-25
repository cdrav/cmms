import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { formatDate, formatDateTime, isOverdue } from "@/lib/format";
import { AttachmentList } from "@/components/attachment-list";
import { AttachmentUploadForm } from "@/components/attachment-upload-form";
import { uploadAssetAttachment } from "../../attachments/actions";
import { CalibrationForm } from "../calibration-form";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const asset = await db.asset.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
      pmSchedules: { orderBy: { nextDueAt: "asc" } },
      workOrders: { orderBy: { requestedAt: "desc" }, take: 20 },
      attachments: { orderBy: { uploadedAt: "desc" }, include: { uploadedBy: true } },
      calibrationRecords: { orderBy: { performedAt: "desc" }, include: { createdBy: true, attachments: true } },
    },
  });
  if (!asset) notFound();

  const canManage = can(user.role, "manage", "asset");
  const calibrationOverdue = Boolean(asset.calibrationFrequencyDays && asset.nextCalibrationAt && isOverdue(asset.nextCalibrationAt));
  const uploadAction = uploadAssetAttachment.bind(null, asset.id);

  return (
    <div>
      <PageHeader
        title={`${asset.code} — ${asset.name}`}
        description={asset.location ?? undefined}
        action={
          <div className="flex gap-2">
            <Link
              href={`/print/assets/${asset.id}`}
              target="_blank"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Etiqueta QR
            </Link>
            {canManage && (
              <Link
                href={`/assets/${asset.id}/edit`}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Editar
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Órdenes de trabajo</h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Código</th>
                  <th className="py-1">Tipo</th>
                  <th className="py-1">Prioridad</th>
                  <th className="py-1">Estado</th>
                  <th className="py-1">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {asset.workOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td className="py-1.5">
                      <Link href={`/work-orders/${wo.id}`} className="font-medium text-slate-900 hover:underline">
                        {wo.code}
                      </Link>
                    </td>
                    <td className="py-1.5"><Badge value={wo.type} /></td>
                    <td className="py-1.5"><Badge value={wo.priority} /></td>
                    <td className="py-1.5"><Badge value={wo.status} /></td>
                    <td className="py-1.5 text-slate-500">{formatDate(wo.requestedAt)}</td>
                  </tr>
                ))}
                {asset.workOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      Sin órdenes de trabajo registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Mantenimiento preventivo</h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Título</th>
                  <th className="py-1">Frecuencia</th>
                  <th className="py-1">Próximo vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {asset.pmSchedules.map((pm) => (
                  <tr key={pm.id}>
                    <td className="py-1.5">
                      <Link href={`/pm-schedules/${pm.id}`} className="font-medium text-slate-900 hover:underline">
                        {pm.title}
                      </Link>
                    </td>
                    <td className="py-1.5 text-slate-600">cada {pm.frequencyDays} días</td>
                    <td className="py-1.5 text-slate-600">{formatDate(pm.nextDueAt)}</td>
                  </tr>
                ))}
                {asset.pmSchedules.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">
                      Sin programas de mantenimiento preventivo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {asset.calibrationFrequencyDays && (
            <section className={`rounded-lg border p-4 ${calibrationOverdue ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Calibración</h2>
                {calibrationOverdue && <span className="text-xs font-medium text-red-700">⚠ vencida</span>}
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <Row label="Frecuencia" value={`cada ${asset.calibrationFrequencyDays} días`} />
                <Row label="Última calibración" value={formatDate(asset.lastCalibratedAt)} />
                <Row label="Próxima calibración" value={formatDate(asset.nextCalibrationAt)} />
              </dl>

              <table className="mt-4 w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-1">Fecha</th>
                    <th className="py-1">Realizada por</th>
                    <th className="py-1">Registrada por</th>
                    <th className="py-1">Certificado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asset.calibrationRecords.map((c) => (
                    <tr key={c.id}>
                      <td className="py-1.5">{formatDate(c.performedAt)}</td>
                      <td className="py-1.5">{c.performedBy}</td>
                      <td className="py-1.5 text-slate-600">{c.createdBy.name}</td>
                      <td className="py-1.5">
                        {c.attachments[0] ? (
                          <a href={`/api/attachments/${c.attachments[0].id}`} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:underline">
                            Ver
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                  {asset.calibrationRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">
                        Sin calibraciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {canManage && (
                <div className="mt-4 max-w-sm border-t border-slate-100 pt-4">
                  <CalibrationForm assetId={asset.id} />
                </div>
              )}
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Documentos adjuntos</h2>
            <p className="mt-1 text-xs text-slate-500">Manuales, fotos, garantías, planos.</p>
            <div className="mt-3">
              <AttachmentList attachments={asset.attachments} canDelete={canManage} />
            </div>
            {canManage && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <AttachmentUploadForm action={uploadAction} />
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-900">Ficha técnica</h2>
            <dl className="mt-3 space-y-2">
              <Row label="Categoría" value={asset.category} />
              <Row label="Fabricante" value={asset.manufacturer} />
              <Row label="Modelo" value={asset.model} />
              <Row label="N° de serie" value={asset.serialNumber} />
              <Row label="Equipo padre" value={asset.parent ? `${asset.parent.code} — ${asset.parent.name}` : null} />
              <Row label="Garantía hasta" value={formatDate(asset.warrantyExpiresAt)} />
              <Row label="Actualizado" value={formatDateTime(asset.updatedAt)} />
            </dl>
            {asset.notes && <p className="mt-3 text-slate-600">{asset.notes}</p>}
          </section>

          {asset.children.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
              <h2 className="text-sm font-semibold text-slate-900">Equipos auxiliares</h2>
              <ul className="mt-3 space-y-1">
                {asset.children.map((c) => (
                  <li key={c.id}>
                    <Link href={`/assets/${c.id}`} className="text-slate-700 hover:underline">
                      {c.code} — {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value || "—"}</dd>
    </div>
  );
}
