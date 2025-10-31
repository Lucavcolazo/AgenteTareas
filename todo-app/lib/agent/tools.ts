import { supabaseServer } from "@/lib/supabaseServer";
import { addEventToGoogleCalendar, generateGoogleCalendarUrl } from "./googleCalendar";

export type CreateTaskArgs = {
  title: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  category?: "work" | "personal" | "shopping" | "health" | "other";
  folderId?: string | null;
  folderName?: string;
  details?: string;
};

export type UpdateTaskArgs = {
  taskId: string;
  title?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  category?: "work" | "personal" | "shopping" | "health" | "other";
  details?: string | null;
  folderId?: string | null;
};

export type DeleteTaskArgs = { taskId: string; confirm?: boolean };
export type DeleteTasksBulkArgs = { taskIds: string[]; confirm: boolean };

export type SearchTasksArgs = {
  query?: string;
  completed?: boolean | null;
  priority?: "low" | "medium" | "high";
  category?: "work" | "personal" | "shopping" | "health" | "other";
  categories?: ("work" | "personal" | "shopping" | "health" | "other")[];
  dueDateFrom?: string;
  dueDateTo?: string;
  sortBy?: "createdAt" | "dueDate" | "priority" | "title";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  logic?: "and" | "or";
};

export type GetTaskStatsArgs = { period?: "today" | "week" | "month" | "year" | "all-time"; groupBy?: "category" | "priority" | "date" };

export async function getUserId(): Promise<string> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("No autenticado");
  return userId;
}

// Validación robusta de argumentos
function validateCreateTaskArgs(args: unknown): asserts args is CreateTaskArgs {
  if (!args || typeof args !== "object") throw new Error("Parámetros inválidos");
  const a = args as Record<string, unknown>;
  if (!a.title || typeof a.title !== "string" || !a.title.trim()) {
    throw new Error("El título es requerido y debe ser un string no vacío");
  }
  if (a.priority && !["low", "medium", "high"].includes(a.priority as string)) {
    throw new Error("Prioridad debe ser: low, medium o high");
  }
  if (a.category && !["work", "personal", "shopping", "health", "other"].includes(a.category as string)) {
    throw new Error("Categoría debe ser: work, personal, shopping, health u other");
  }
  if (a.dueDate && typeof a.dueDate === "string") {
    const date = new Date(a.dueDate);
    if (isNaN(date.getTime())) throw new Error("Formato de fecha inválido (usa ISO 8601)");
  }
}

export async function createTaskTool(args: CreateTaskArgs) {
  validateCreateTaskArgs(args);
  const userId = await getUserId();
  
  // Validación mejorada de fecha con mensaje más descriptivo
  if (args.dueDate) {
    const dueDateObj = new Date(args.dueDate);
    const now = Date.now();
    const dueTime = dueDateObj.getTime();
    
    if (isNaN(dueTime)) {
      throw new Error(`Fecha inválida: ${args.dueDate}. Usa formato ISO 8601 (YYYY-MM-DDTHH:mm:ss)`);
    }
    
    if (dueTime < now) {
      const nowDate = new Date(now);
      const diffMs = now - dueTime;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      throw new Error(`La fecha de vencimiento debe ser futura. La fecha proporcionada (${args.dueDate}) es ${diffDays > 0 ? `${diffDays} día${diffDays > 1 ? "s" : ""} en el pasado` : "en el pasado"}. Fecha actual: ${nowDate.toISOString()}`);
    }
  }
  const supabase = await supabaseServer();
  let resolvedFolderId = args.folderId ?? null;
  if (!resolvedFolderId && typeof args.folderName === "string") {
    const name = args.folderName.trim().toLowerCase();
    if (["sin carpeta", "ninguna", "none", "no folder", "todas", "all"].includes(name)) {
      resolvedFolderId = null;
    } else if (name) {
      const { data: f } = await supabase
        .from("folders")
        .select("id,name")
        .eq("user_id" as never, userId)
        .ilike("name" as never, name);
      type FolderRow = { id: string; name: string };
      const folders = (f ?? []) as unknown as FolderRow[];
      const exact = folders.find((x) => x.name.trim().toLowerCase() === name);
      const pick = exact ?? folders[0];
      if (pick) resolvedFolderId = pick.id as string;
      else throw new Error("No se encontró la carpeta indicada por nombre");
    }
  }
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: args.title.trim(),
      user_id: userId,
      due_date: args.dueDate ?? null,
      priority: args.priority ?? null,
      category: args.category ?? null,
      folder_id: resolvedFolderId,
      details: args.details ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;

  // Si tiene fecha, intentar agregar a Google Calendar automáticamente
  let calendarResult: { success: boolean; eventId?: string; url?: string; error?: string } | null = null;
  if (args.dueDate) {
    const startDate = new Date(args.dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora después
    
    try {
      calendarResult = await addEventToGoogleCalendar(userId, {
        title: args.title.trim(),
        description: args.details ?? "",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } catch (error) {
      // Si falla, generar URL manual como fallback
      calendarResult = {
        success: false,
        url: generateGoogleCalendarUrl({
          title: args.title.trim(),
          description: args.details ?? "",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  const result = data as unknown as Record<string, unknown>;
  return { ...result, calendarResult };
}

function validateUpdateTaskArgs(args: unknown): asserts args is UpdateTaskArgs {
  if (!args || typeof args !== "object") throw new Error("Parámetros inválidos");
  const a = args as Record<string, unknown>;
  if (!a.taskId || typeof a.taskId !== "string") {
    throw new Error("taskId es requerido y debe ser un string");
  }
  if (a.priority && !["low", "medium", "high"].includes(a.priority as string)) {
    throw new Error("Prioridad debe ser: low, medium o high");
  }
  if (a.category && !["work", "personal", "shopping", "health", "other"].includes(a.category as string)) {
    throw new Error("Categoría debe ser: work, personal, shopping, health u other");
  }
  if (a.dueDate && typeof a.dueDate === "string") {
    const date = new Date(a.dueDate);
    if (isNaN(date.getTime())) throw new Error("Formato de fecha inválido (usa ISO 8601)");
  }
}

export async function updateTaskTool(args: UpdateTaskArgs) {
  validateUpdateTaskArgs(args);
  const userId = await getUserId();
  const supabase = await supabaseServer();
  const update: Record<string, unknown> = {};
  if (typeof args.title === "string" && args.title.trim()) update.title = args.title.trim();
  if (typeof args.completed === "boolean") update.completada = args.completed;
  if (typeof args.priority === "string") update.priority = args.priority;
  if (typeof args.category === "string") update.category = args.category;
  if (typeof args.dueDate === "string") update.due_date = args.dueDate;
  if (typeof args.details !== "undefined") update.details = args.details;
  if (typeof args.folderId !== "undefined") update.folder_id = args.folderId;
  const argsWithFolder = args as UpdateTaskArgs & { folderName?: string };
  if (typeof argsWithFolder.folderName !== "undefined" && argsWithFolder.folderName !== null) {
    const name = String(argsWithFolder.folderName).trim().toLowerCase();
    if (["sin carpeta", "ninguna", "none", "no folder", "todas", "all"].includes(name)) {
      update.folder_id = null;
    } else if (name) {
      const { data: f } = await supabase
        .from("folders")
        .select("id,name")
        .eq("user_id" as never, userId)
        .ilike("name" as never, name);
      type FolderRow = { id: string; name: string };
      const folders = (f ?? []) as unknown as FolderRow[];
      const exact = folders.find((x) => x.name.trim().toLowerCase() === name);
      const pick = exact ?? folders[0];
      if (pick) update.folder_id = pick.id as string;
      else throw new Error("No se encontró la carpeta indicada por nombre");
    }
  }
  if (Object.keys(update).length === 0) throw new Error("Sin cambios");
  const { data, error } = await supabase
    .from("tasks")
    .update(update as never)
    .eq("id" as never, args.taskId)
    .eq("user_id" as never, userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTaskTool(args: DeleteTaskArgs) {
  const userId = await getUserId();
  const supabase = await supabaseServer();
  const { data: found } = await supabase.from("tasks").select("id,title").eq("id" as never, args.taskId).eq("user_id" as never, userId).single();
  if (!found) throw new Error("No encontrada");
  const foundTask = found as { id: string; title: string };
    const { error } = await supabase.from("tasks").update({ deleted_at: new Date().toISOString() } as never).eq("id" as never, args.taskId).eq("user_id" as never, userId);
  if (error) throw error;
  return { deletedId: args.taskId, title: foundTask.title };
}

export async function deleteTasksBulkTool(args: DeleteTasksBulkArgs) {
  const userId = await getUserId();
  if (!args.confirm) throw new Error("Se requiere confirmación para borrar en masa");
  const ids = Array.from(new Set(args.taskIds ?? [])).filter(Boolean);
  if (ids.length === 0) return { deleted: 0 };
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() } as never)
    .in("id" as never, ids as never)
    .eq("user_id" as never, userId);
  if (error) throw error;
  return { deleted: ids.length };
}

export async function searchTasksTool(args: SearchTasksArgs) {
  const userId = await getUserId();
  const supabase = await supabaseServer();
  let q = supabase.from("tasks").select("*").eq("user_id" as never, userId).is("deleted_at", null);
  if (typeof args.completed === "boolean") q = q.eq("completada" as never, args.completed);
  if (args.priority) q = q.eq("priority" as never, args.priority);
  if (args.category) q = q.eq("category" as never, args.category);
  if (args.categories && args.categories.length > 0) {
    const orParts = args.categories.map((c) => `category.eq.${c}`);
    q = q.or(orParts.join(","));
  }
  if (args.query && args.query.trim()) {
    const qtext = args.query.trim();
    q = q.or(`title.ilike.%${qtext}%,details.ilike.%${qtext}%`);
  }
  if (args.dueDateFrom) q = q.gte("due_date" as never, args.dueDateFrom);
  if (args.dueDateTo) q = q.lte("due_date" as never, args.dueDateTo);
  const sortMap: Record<string, string> = { createdAt: "created_at", dueDate: "due_date", priority: "priority", title: "title" };
  // Por defecto, ordenar por created_at descendente (más recientes primero)
  if (args.sortBy) {
    q = q.order(sortMap[args.sortBy], { ascending: args.sortOrder !== "desc" });
  } else {
    q = q.order("created_at", { ascending: false });
  }
  // Solo aplicar límite si se especifica explícitamente. Si no, devolver todas las tareas (hasta 1000 como máximo de seguridad)
  if (typeof args.limit === "number" && args.limit > 0) {
    const offset = args.offset ?? 0;
    const to = Math.max(0, offset + Math.max(1, args.limit) - 1);
    q = q.range(offset, to);
  } else {
    // Sin límite explícito: devolver hasta 1000 tareas (límite razonable)
    q = q.range(0, 999);
  }
  const { data, error } = await q;
  if (error) throw error;
  const items = data ?? [];
  return { items, total: items.length };
}

// Funciones auxiliares para cálculos de estadísticas
type TaskWithDates = {
  completada: boolean | null;
  created_at: string | null;
  updated_at?: string | null;
  due_date?: string | null;
  priority?: string | null;
  category?: string | null;
  title?: string;
  id?: string;
};

function isToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate.getTime() === today.getTime();
}

function isThisWeek(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Domingo de esta semana
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const checkDate = new Date(date);
  return checkDate.getTime() >= weekStart.getTime() && checkDate.getTime() <= weekEnd.getTime();
}

function isThisMonth(date: Date): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.getMonth() === today.getMonth() && checkDate.getFullYear() === today.getFullYear();
}

function isThisYear(date: Date): boolean {
  const today = new Date();
  return new Date(date).getFullYear() === today.getFullYear();
}

function calculateStreak(tasks: TaskWithDates[]): { currentStreak: number; longestStreak: number } {
  // Obtener tareas completadas con su fecha de actualización (cuando se completaron)
  const completedTasks: Array<{ date: Date }> = tasks
    .filter((t) => t.completada && t.updated_at)
    .map((t) => ({
      date: new Date(t.updated_at || t.created_at || ""),
    }))
    .filter((t) => !isNaN(t.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Más recientes primero

  if (completedTasks.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calcular racha actual (días consecutivos desde hoy hacia atrás)
  let currentStreak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const task of completedTasks) {
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === currentStreak) {
      currentStreak++;
    } else if (diffDays > currentStreak) {
      // Hay un gap, rompe la racha
      break;
    }
  }

  // Calcular racha más larga (máximo de días consecutivos en toda la historia)
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < completedTasks.length; i++) {
    const prevDate = new Date(completedTasks[i - 1].date);
    prevDate.setHours(0, 0, 0, 0);
    const currDate = new Date(completedTasks[i].date);
    currDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { currentStreak, longestStreak };
}

function calculateAverageCompletionTime(tasks: TaskWithDates[]): string {
  const completed = tasks.filter(
    (t) => t.completada && t.created_at && t.updated_at && t.created_at !== t.updated_at
  );

  if (completed.length === 0) return "N/A";

  let totalMs = 0;
  for (const t of completed) {
    const created = new Date(t.created_at || "").getTime();
    const updated = new Date(t.updated_at || "").getTime();
    if (!isNaN(created) && !isNaN(updated) && updated > created) {
      totalMs += updated - created;
    }
  }

  if (totalMs === 0) return "N/A";

  const avgMs = totalMs / completed.length;
  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} día${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hora${hours > 1 ? "s" : ""}`;
  const minutes = Math.floor(avgMs / (1000 * 60));
  return `${minutes} minuto${minutes > 1 ? "s" : ""}`;
}

function findMostProductiveDay(tasks: TaskWithDates[]): string {
  const dayCounts: Record<string, number> = {};
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  for (const t of tasks.filter((t) => t.completada && t.updated_at)) {
    const date = new Date(t.updated_at || t.created_at || "");
    if (isNaN(date.getTime())) continue;
    const dayName = dayNames[date.getDay()];
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
  }

  if (Object.keys(dayCounts).length === 0) return "N/A";

  let maxDay = "";
  let maxCount = 0;
  for (const [day, count] of Object.entries(dayCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxDay = day;
    }
  }

  return maxDay || "N/A";
}

function filterTasksByPeriod(tasks: TaskWithDates[], period: "today" | "week" | "month" | "year" | "all-time"): TaskWithDates[] {
  if (period === "all-time") return tasks;

  return tasks.filter((t) => {
    if (!t.created_at) return false;
    const date = new Date(t.created_at);
    if (period === "today") return isToday(date);
    if (period === "week") return isThisWeek(date);
    if (period === "month") return isThisMonth(date);
    if (period === "year") return isThisYear(date);
    return true;
  });
}

export async function getTaskStatsTool(args: GetTaskStatsArgs) {
  const userId = await getUserId();
  const supabase = await supabaseServer();
  
  // Filtrar por período si se especifica
  const period = args.period ?? "all-time";
  const { data } = await supabase.from("tasks").select("*").eq("user_id" as never, userId).is("deleted_at", null);
  let allTasks = ((data ?? []) as unknown) as TaskWithDates[];
  
  // Aplicar filtro de período si no es "all-time"
  if (period !== "all-time") {
    allTasks = filterTasksByPeriod(allTasks, period);
  }

  const tasks = allTasks;
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completada).length;
  const pending = total - completed;
  const overdue = tasks.filter(
    (t) => !t.completada && t.due_date && new Date(t.due_date).getTime() < Date.now()
  ).length;

  // Timeline metrics
  const tasksCreatedToday = tasks.filter((t) => t.created_at && isToday(new Date(t.created_at))).length;
  const tasksCompletedToday = tasks.filter(
    (t) => t.completada && t.updated_at && isToday(new Date(t.updated_at || t.created_at || ""))
  ).length;
  const tasksCreatedThisWeek = tasks.filter((t) => t.created_at && isThisWeek(new Date(t.created_at))).length;
  const tasksCompletedThisWeek = tasks.filter(
    (t) => t.completada && t.updated_at && isThisWeek(new Date(t.updated_at || t.created_at || ""))
  ).length;
  const tasksCreatedThisMonth = tasks.filter((t) => t.created_at && isThisMonth(new Date(t.created_at))).length;
  const tasksCompletedThisMonth = tasks.filter(
    (t) => t.completada && t.updated_at && isThisMonth(new Date(t.updated_at || t.created_at || ""))
  ).length;

  // Productivity metrics
  const { currentStreak, longestStreak } = calculateStreak(allTasks); // Usar todas las tareas para streaks
  const averageCompletionTime = calculateAverageCompletionTime(allTasks); // Usar todas las tareas
  const mostProductiveDay = findMostProductiveDay(allTasks); // Usar todas las tareas

  // Upcoming metrics
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  const dueTodayCount = tasks.filter(
    (t) => !t.completada && t.due_date && new Date(t.due_date).getTime() >= now.getTime() && new Date(t.due_date).getTime() <= endOfToday.getTime()
  ).length;
  const dueThisWeekCount = tasks.filter(
    (t) => !t.completada && t.due_date && new Date(t.due_date).getTime() >= now.getTime() && new Date(t.due_date).getTime() <= endOfWeek.getTime()
  ).length;

  // Próxima tarea con fecha límite
  const upcomingTasks = tasks
    .filter((t) => !t.completada && t.due_date && new Date(t.due_date).getTime() >= now.getTime())
    .sort((a, b) => {
      const dateA = new Date(a.due_date || "").getTime();
      const dateB = new Date(b.due_date || "").getTime();
      return dateA - dateB;
    });
  const nextDueTask = upcomingTasks.length > 0 ? upcomingTasks[0] : null;

  // Estadísticas por prioridad y categoría
  const byPriority: Record<string, { total: number; completed: number; pending: number }> = {
    high: { total: 0, completed: 0, pending: 0 },
    medium: { total: 0, completed: 0, pending: 0 },
    low: { total: 0, completed: 0, pending: 0 },
  };
  const byCategory: Record<string, { total: number; completed: number; pending: number }> = {};

  for (const t of tasks) {
    if (t.priority && byPriority[t.priority]) {
      byPriority[t.priority].total++;
      if (t.completada) byPriority[t.priority].completed++;
      else byPriority[t.priority].pending++;
    }
    const cat = t.category ?? "other";
    byCategory[cat] = byCategory[cat] ?? { total: 0, completed: 0, pending: 0 };
    byCategory[cat].total++;
    if (t.completada) byCategory[cat].completed++;
    else byCategory[cat].pending++;
  }

  // Agrupación si se especifica
  let grouped: Record<string, unknown> | null = null;
  if (args.groupBy === "category") {
    grouped = {};
    for (const [cat, stats] of Object.entries(byCategory)) {
      grouped[cat] = stats;
    }
  } else if (args.groupBy === "priority") {
    grouped = {};
    for (const [prio, stats] of Object.entries(byPriority)) {
      grouped[prio] = stats;
    }
  } else if (args.groupBy === "date") {
    // Agrupar por fecha (día)
    grouped = {};
    const tasksByDate: Record<string, { total: number; completed: number; pending: number }> = {};
    for (const t of tasks) {
      if (!t.created_at) continue;
      const dateStr = new Date(t.created_at).toISOString().split("T")[0];
      tasksByDate[dateStr] = tasksByDate[dateStr] ?? { total: 0, completed: 0, pending: 0 };
      tasksByDate[dateStr].total++;
      if (t.completada) tasksByDate[dateStr].completed++;
      else tasksByDate[dateStr].pending++;
    }
    grouped = tasksByDate;
  }

  return {
    summary: {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      overdueTasks: overdue,
    },
    byPriority,
    byCategory,
    timeline: {
      tasksCreatedToday,
      tasksCompletedToday,
      tasksCreatedThisWeek,
      tasksCompletedThisWeek,
      tasksCreatedThisMonth,
      tasksCompletedThisMonth,
    },
    productivity: {
      averageCompletionTime,
      mostProductiveDay,
      currentStreak,
      longestStreak,
    },
    upcoming: {
      dueTodayCount,
      dueThisWeekCount,
      nextDueTask: nextDueTask
        ? {
            id: nextDueTask.id || "",
            title: nextDueTask.title || "",
            due_date: nextDueTask.due_date || null,
            priority: nextDueTask.priority || null,
          }
        : null,
    },
    ...(grouped ? { grouped } : {}),
  };
}


