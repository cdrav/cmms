import Link from "next/link";

type Settings = {
  institutionName: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  healthRegistryCode: string | null;
  siteName: string | null;
  logoDataUrl: string | null;
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

export function InstitutionProfileCard({ settings, canManage }: { settings: Settings; canManage: boolean }) {
  const initials = getInitials(settings.institutionName || "Institución");

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-brand to-brand-secondary" />
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-slate-200">
          {settings.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoDataUrl} alt="" className="h-full w-full bg-white object-contain p-1" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand text-2xl font-bold text-white">
              {initials}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 className="text-xl font-bold text-slate-900">
              {settings.institutionName || "Institución sin configurar"}
            </h2>
            {settings.siteName && <span className="text-sm font-medium text-brand">{settings.siteName}</span>}
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm text-slate-600 sm:grid-cols-2">
            {settings.taxId && (
              <div><dt className="inline font-medium text-slate-500">CC/NIT: </dt><dd className="inline">{settings.taxId}</dd></div>
            )}
            {settings.address && (
              <div><dt className="inline font-medium text-slate-500">Dirección: </dt><dd className="inline">{settings.address}</dd></div>
            )}
            {settings.email && (
              <div><dt className="inline font-medium text-slate-500">Email: </dt><dd className="inline">{settings.email}</dd></div>
            )}
            {settings.phone && (
              <div><dt className="inline font-medium text-slate-500">Teléfono: </dt><dd className="inline">{settings.phone}</dd></div>
            )}
            {settings.healthRegistryCode && (
              <div><dt className="inline font-medium text-slate-500">Código REPS: </dt><dd className="inline">{settings.healthRegistryCode}</dd></div>
            )}
          </dl>
        </div>

        {canManage && (
          <Link
            href="/settings"
            className="shrink-0 self-start rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Editar
          </Link>
        )}
      </div>
    </section>
  );
}
