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

export default async function VendorsPage() {
  const user = await requireUser();
  const filter = await withOrganizationFilter({});

  const vendors = await db.vendor.findMany({
    where: filter.where,
    include: {
      _count: {
        select: { contracts: true, warranties: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500">
            Gestión de proveedores y contratistas
          </p>
        </div>
        <Link
          href="/vendors/new"
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo Proveedor
        </Link>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">NIT/RUT</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Contacto</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Teléfono</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Contratos</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Garantías</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Calificación</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  No hay proveedores registrados
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{vendor.name}</td>
                  <td className="px-4 py-3">{vendor.taxId || "-"}</td>
                  <td className="px-4 py-3">{vendor.contactPerson || "-"}</td>
                  <td className="px-4 py-3">{vendor.email || "-"}</td>
                  <td className="px-4 py-3">{vendor.phone || "-"}</td>
                  <td className="px-4 py-3">{vendor._count.contracts}</td>
                  <td className="px-4 py-3">{vendor._count.warranties}</td>
                  <td className="px-4 py-3">
                    {vendor.rating ? (
                      <span className="text-yellow-600">★ {vendor.rating.toFixed(1)}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        vendor.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {vendor.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/vendors/${vendor.id}`}
                      className="text-brand hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
