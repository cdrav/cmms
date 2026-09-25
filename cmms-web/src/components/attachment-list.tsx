import { formatDateTime } from "@/lib/format";
import { deleteAttachment } from "@/app/(dashboard)/attachments/actions";

type AttachmentRow = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  documentType: string | null;
  uploadedAt: Date;
  uploadedBy: { name: string };
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  attachments,
  canDelete,
}: {
  attachments: AttachmentRow[];
  canDelete: boolean;
}) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-500">Sin archivos adjuntos.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0 flex-1">
            <a
              href={`/api/attachments/${a.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-slate-800 hover:underline"
            >
              {a.originalName}
            </a>
            {a.documentType && (
              <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{a.documentType}</span>
            )}
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            {formatSize(a.sizeBytes)} · {a.uploadedBy.name} · {formatDateTime(a.uploadedAt)}
          </span>
          {canDelete && (
            <form action={deleteAttachment.bind(null, a.id)}>
              <button type="submit" className="shrink-0 text-xs text-red-600 hover:underline">
                Eliminar
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
