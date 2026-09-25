import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";

export default async function AssetsPage() {
  const user = await requireUser();
  const assets = await db.asset.findMany({ orderBy: { code: "asc" } });

  return (
    <div>
      <PageHeader
        title="Equipos"
        description="Inventario de activos e infraestructura del hospital."
        action={
          can(user.role, "manage", "asset") && (
            <Link
              href="/assets/new"
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Nuevo equipo
            </Link>
          )
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Ubicación</th>
              <th className="px-4 py-2">Criticidad</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/assets/${asset.id}`} className="font-medium text-slate-900 hover:underline">
                    {asset.code}
                  </Link>
                </td>
                <td className="px-4 py-2">{asset.name}</td>
                <td className="px-4 py-2 text-slate-600">{asset.location ?? "—"}</td>
                <td className="px-4 py-2">
                  <Badge value={asset.criticality} />
                </td>
                <td className="px-4 py-2">
                  <Badge value={asset.status} />
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay equipos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
