import { getCurrentUser } from "@/lib/auth";
import { getInstitutionSettings } from "@/lib/settings";
import { darkenHex } from "@/lib/color";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const [user, settings] = await Promise.all([getCurrentUser(), getInstitutionSettings()]);
  if (user) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

  const brandVars = {
    "--brand-primary": settings.primaryColor,
    "--brand-primary-dark": darkenHex(settings.primaryColor, 0.15),
    "--brand-secondary": settings.secondaryColor,
  } as React.CSSProperties;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4" style={brandVars}>
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-brand to-brand-secondary" />
        <div className="p-8">
          <div className="flex items-center gap-3">
            {settings.logoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoDataUrl} alt="" className="h-10 w-10 shrink-0 rounded object-contain" />
            )}
            <h1 className="text-xl font-semibold text-slate-900">
              {settings.institutionName || "CMMS Hospitalario"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de mantenimiento de equipos e infraestructura.
          </p>
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
