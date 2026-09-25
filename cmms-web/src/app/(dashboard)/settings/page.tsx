import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getInstitutionSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  if (!can(user.role, "manage", "settings")) redirect("/");

  const settings = await getInstitutionSettings();

  return (
    <div>
      <PageHeader
        title="Configuración institucional"
        description="Logo y colores que aparecerán en los reportes PDF generados por el sistema."
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
