import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { buildMonthGrid, isSameDay, MONTH_NAMES_ES, WEEKDAY_LABELS_ES } from "@/lib/calendar";

export default async function PmCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  await requireUser();
  const { month: monthParam, year: yearParam } = await searchParams;

  const now = new Date();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) - 1 : now.getMonth(); // 0-indexado internamente

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const [pmDue, calibrationsDue] = await Promise.all([
    db.pmSchedule.findMany({
      where: { active: true, nextDueAt: { gte: monthStart, lt: monthEnd } },
      include: { asset: true },
    }),
    db.asset.findMany({
      where: { nextCalibrationAt: { gte: monthStart, lt: monthEnd } },
    }),
  ]);

  const weeks = buildMonthGrid(year, month);
  const nextDate = new Date(year, month + 1, 1);
  const prevDate = new Date(year, month - 1, 1);

  return (
    <div>
      <PageHeader
        title="Programación mensual"
        description="Mantenimientos preventivos y calibraciones programados por mes, para planificar en vez de solo reaccionar a lo vencido."
        action={
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/pm-schedules/calendar?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
            >
              ← Anterior
            </Link>
            <span className="min-w-[140px] text-center font-medium text-slate-900">
              {MONTH_NAMES_ES[month]} {year}
            </span>
            <Link
              href={`/pm-schedules/calendar?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
            >
              Siguiente →
            </Link>
          </div>
        }
      />

      <p className="mb-3 text-xs text-slate-500">
        Basado en la próxima fecha de vencimiento de cada programa. Una vez generada la orden de trabajo, la fecha avanza al siguiente ciclo — este calendario muestra el ciclo pendiente actual, no todo el historial futuro.
      </p>

      <div className="mb-3 flex gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Mantenimiento preventivo</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500" /> Calibración</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
          {WEEKDAY_LABELS_ES.map((d) => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-7 divide-x divide-slate-100 border-b border-slate-100 last:border-b-0">
            {week.map((date, j) => {
              const dayPm = date ? pmDue.filter((pm) => isSameDay(pm.nextDueAt, date)) : [];
              const dayCal = date ? calibrationsDue.filter((a) => a.nextCalibrationAt && isSameDay(a.nextCalibrationAt, date)) : [];
              const isToday = date && isSameDay(date, now);
              return (
                <div key={j} className="min-h-[100px] p-1.5 align-top">
                  {date && (
                    <>
                      <p className={`mb-1 text-xs ${isToday ? "font-bold text-slate-900" : "text-slate-400"}`}>{date.getDate()}</p>
                      <div className="space-y-1">
                        {dayPm.map((pm) => (
                          <Link
                            key={pm.id}
                            href={`/pm-schedules/${pm.id}`}
                            className="block truncate rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-800 hover:bg-blue-100"
                            title={`${pm.title} — ${pm.asset.name}`}
                          >
                            {pm.asset.code}: {pm.title}
                          </Link>
                        ))}
                        {dayCal.map((a) => (
                          <Link
                            key={a.id}
                            href={`/assets/${a.id}`}
                            className="block truncate rounded bg-cyan-50 px-1.5 py-0.5 text-[11px] text-cyan-800 hover:bg-cyan-100"
                            title={`Calibración — ${a.name}`}
                          >
                            {a.code}: Calibración
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
