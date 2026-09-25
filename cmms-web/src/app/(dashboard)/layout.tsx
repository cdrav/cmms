import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { can, type Resource } from "@/lib/permissions";
import { getInstitutionSettings } from "@/lib/settings";
import { darkenHex } from "@/lib/color";
import { logoutAction } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Jefe de mantenimiento",
  TECHNICIAN: "Técnico",
};

const NAV_ITEMS: { href: string; label: string; resource: Resource }[] = [
  { href: "/", label: "Panel", resource: "report" },
  { href: "/assets", label: "Equipos", resource: "asset" },
  { href: "/work-orders", label: "Órdenes de trabajo", resource: "workOrder" },
  { href: "/pm-schedules", label: "Mant. preventivo", resource: "pmSchedule" },
  { href: "/inventory", label: "Inventario", resource: "inventory" },
  { href: "/purchase-requests", label: "Compras", resource: "purchaseRequest" },
  { href: "/tasks", label: "Tareas", resource: "task" },
  { href: "/reports", label: "Reportes", resource: "report" },
  { href: "/adverse-events", label: "Tecnovigilancia", resource: "adverseEvent" },
  { href: "/users", label: "Usuarios", resource: "user" },
  { href: "/settings", label: "Configuración", resource: "settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([requireUser(), getInstitutionSettings()]);
  const visibleItems = NAV_ITEMS.filter((item) => can(user.role, "view", item.resource));
  const brandVars = {
    "--brand-primary": settings.primaryColor,
    "--brand-primary-dark": darkenHex(settings.primaryColor, 0.15),
    "--brand-secondary": settings.secondaryColor,
  } as React.CSSProperties;

  return (
    <div className="flex min-h-screen bg-slate-50" style={brandVars}>
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b-2 border-brand px-4 py-4">
          {settings.logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoDataUrl} alt="" className="h-8 w-8 shrink-0 rounded object-contain" />
          )}
          <p className="truncate text-sm font-semibold text-slate-900">
            {settings.institutionName || "CMMS Hospitalario"}
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">{ROLE_LABEL[user.role] ?? user.role}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
