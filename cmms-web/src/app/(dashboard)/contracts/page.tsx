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

export default async function ContractsPage() {
  const user = await requireUser();
  const filter = await withOrganizationFilter({});

  const contracts = await db.maintenanceContract.findMany({
    where: filter.where,
    include: {
      vendor: true,
      assets: true,
      _count: {
        select: { workOrders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contratos de Mantenimiento</h1>
          <p className="text-sm text-slate-500">
            Gestión de contratos con proveedores externos
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo Contrato
        </Link>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Número</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Proveedor</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Vigencia</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Equipos</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">OTs</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No hay contratos registrados
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{contract.contractNumber}</td>
                  <td className="px-4 py-3">{contract.name}</td>
                  <td className="px-4 py-3">{contract.vendor.name}</td>
                  <td className="px-4 py-3">
                    {new Date(contract.startDate).toLocaleDateString()} -{" "}
                    {new Date(contract.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{contract.assets.length}</td>
                  <td className="px-4 py-3">{contract._count.workOrders}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        contract.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {contract.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/contracts/${contract.id}`}
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
