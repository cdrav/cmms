const COLOR_MAP: Record<string, string> = {
  // criticidad / prioridad
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-800",
  CRITICAL: "bg-red-100 text-red-700",
  // estado de activo
  OPERATIONAL: "bg-emerald-100 text-emerald-700",
  DOWN: "bg-red-100 text-red-700",
  IN_MAINTENANCE: "bg-amber-100 text-amber-800",
  // estado de OT
  REQUESTED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_PARTS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-600",
  REJECTED: "bg-red-100 text-red-700",
};

const LABEL_MAP: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
  OPERATIONAL: "Operativo",
  DOWN: "Fuera de servicio",
  IN_MAINTENANCE: "En mantenimiento",
  REQUESTED: "Solicitada",
  IN_PROGRESS: "En proceso",
  WAITING_PARTS: "Esperando repuestos",
  COMPLETED: "Completada",
  CLOSED: "Cerrada",
  REJECTED: "Rechazada",
  CORRECTIVE: "Correctiva",
  PREVENTIVE: "Preventiva",
  EMERGENCY: "Emergencia",
  INSPECTION: "Inspección",
};

export function Badge({ value }: { value: string }) {
  const color = COLOR_MAP[value] ?? "bg-slate-100 text-slate-700";
  const label = LABEL_MAP[value] ?? value;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
