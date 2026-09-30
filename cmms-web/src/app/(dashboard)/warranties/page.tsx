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

export default async function WarrantiesPage() {
  const user = await requireUser();
  const filter = await withOrganizationFilter({});

  const warranties = await db.warranty.findMany({
    where: filter.where,
    include: {
      asset: true,
      vendor: true,
      _count: {
        select: { claims: true },
      },
    },
    orderBy: { endDate: "asc" },
  });

  const today = new Date();
  const expiringSoon = warranties.filter(
    (w) => w.endDate && new Date(w.endDate) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Garantías</h1>
          <p className="text-sm text-slate-500">
            Gestión de garantías de equipos
          </p>
        </div>
        <Link
          href="/warranties/new"
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva Garantía
        </Link>
      </div>

      {expiringSoon.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-800">
            ⚠️ {expiringSoon.length} garantía(s) por vencer en los próximos 30 días
          </p>
        </div>
      )}

      <div className="rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Equipo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Proveedor</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Vigencia</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Reclamaciones</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {warranties.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay garantías registradas
                </td>
              </tr>
            ) : (
              warranties.map((warranty) => {
                const isExpired = warranty.endDate && new Date(warranty.endDate) < today;
                const isExpiringSoon = warranty.endDate && new Date(warranty.endDate) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

                return (
                  <tr key={warranty.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{warranty.asset.name}</td>
                    <td className="px-4 py-3">{warranty.warrantyType}</td>
                    <td className="px-4 py-3">{warranty.vendor?.name || "-"}</td>
                    <td className="px-4 py-3">
                      {new Date(warranty.startDate).toLocaleDateString()} -{" "}
                      {new Date(warranty.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{warranty._count.claims}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          isExpired
                            ? "bg-red-100 text-red-700"
                            : isExpiringSoon
                            ? "bg-amber-100 text-amber-700"
                            : warranty.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isExpired
                          ? "Vencida"
                          : isExpiringSoon
                          ? "Por vencer"
                          : warranty.active
                          ? "Activa"
                          : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/warranties/${warranty.id}`}
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
