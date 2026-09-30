import { requireUser } from "@/lib/auth";
import { withOrganizationFilter } from "@/lib/tenant";
import { db } from "@/lib/db";
import Link from "next/link";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default async function TicketsPage() {
  const user = await requireUser();
  const filter = await withOrganizationFilter({});

  const tickets = await db.ticket.findMany({
    where: filter.where,
    include: {
      requester: true,
      assignedTo: true,
      asset: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date();
  const overdue = tickets.filter(
    (t) => t.dueDate && new Date(t.dueDate) < today && !["RESOLVED", "CLOSED"].includes(t.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tickets de Soporte</h1>
          <p className="text-sm text-slate-500">
            Solicitudes de mantenimiento del personal
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo Ticket
        </Link>
      </div>

      {overdue.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">
            ⚠️ {overdue.length} ticket(s) vencido(s)
          </p>
        </div>
      )}

      <div className="rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Número</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Asunto</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Solicitante</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Asignado a</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Equipo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Prioridad</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Fecha límite</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No hay tickets registrados
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < today && !["RESOLVED", "CLOSED"].includes(ticket.status);

                return (
                  <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{ticket.ticketNumber}</td>
                    <td className="px-4 py-3">{ticket.subject}</td>
                    <td className="px-4 py-3">{ticket.requester.name}</td>
                    <td className="px-4 py-3">{ticket.assignedTo?.name || "-"}</td>
                    <td className="px-4 py-3">{ticket.asset?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          ticket.priority === "CRITICAL"
                            ? "bg-red-100 text-red-700"
                            : ticket.priority === "HIGH"
                            ? "bg-orange-100 text-orange-700"
                            : ticket.priority === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          ticket.status === "OPEN"
                            ? "bg-blue-100 text-blue-700"
                            : ticket.status === "IN_PROGRESS"
                            ? "bg-purple-100 text-purple-700"
                            : ticket.status === "RESOLVED"
                            ? "bg-green-100 text-green-700"
                            : ticket.status === "CLOSED"
                            ? "bg-slate-100 text-slate-700"
                            : ticket.status === "ESCALATED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ticket.dueDate ? (
                        <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                          {new Date(ticket.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-brand hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
