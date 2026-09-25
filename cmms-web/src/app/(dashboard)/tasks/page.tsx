import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { TaskForm } from "./task-form";
import { setTaskStatus, deleteTask } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  DONE: "Hecha",
};

const STATUS_ORDER: Record<string, number> = { PENDING: 0, IN_PROGRESS: 1, DONE: 2 };

export default async function TasksPage() {
  const user = await requireUser();

  const [tasks, users] = await Promise.all([
    db.task.findMany({ include: { assignedTo: true, createdBy: true } }),
    db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const sorted = [...tasks].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const canManage = can(user.role, "manage", "task");

  return (
    <div>
      <PageHeader
        title="Tareas"
        description="Pendientes del equipo de mantenimiento, no necesariamente atadas a un equipo específico."
      />

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <TaskForm users={users} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Tarea</th>
              <th className="px-4 py-2">Asignada a</th>
              <th className="px-4 py-2">Fecha límite</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((task) => {
              const canUpdate = canManage || task.assignedToId === user.id || task.createdById === user.id;
              return (
                <tr key={task.id} className={task.status === "DONE" ? "bg-slate-50 text-slate-400" : ""}>
                  <td className="px-4 py-2">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{task.assignedTo?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{formatDate(task.dueDate)}</td>
                  <td className="px-4 py-2">
                    {canUpdate ? (
                      <form action={setTaskStatus.bind(null, task.id)} className="flex items-center gap-1">
                        <select
                          name="status"
                          defaultValue={task.status}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        >
                          {Object.entries(STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <button type="submit" className="text-xs text-slate-600 hover:underline">Actualizar</button>
                      </form>
                    ) : (
                      STATUS_LABEL[task.status]
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {canManage && (
                      <form action={deleteTask.bind(null, task.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">Eliminar</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay tareas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
