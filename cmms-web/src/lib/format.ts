export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDurationHms(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h:${String(minutes).padStart(2, "0")}m:${String(seconds).padStart(2, "0")}s`;
}

export function isOverdue(date: Date | string) {
  return new Date(date).getTime() <= Date.now();
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return amount.toLocaleString("es-ES", { style: "currency", currency: "USD" });
}
