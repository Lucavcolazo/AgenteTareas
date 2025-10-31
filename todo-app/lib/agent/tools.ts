import { supabaseServer } from "@/lib/supabaseServer";

export type CreateTaskArgs = {
  title: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  category?: "work" | "personal" | "shopping" | "health" | "other";
  folderId?: string | null;
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

export async function createTaskTool(args: CreateTaskArgs) {
  const userId = await getUserId();
  if (!args.title || !args.title.trim()) throw new Error("El título es requerido");
  if (args.dueDate && new Date(args.dueDate).getTime() < Date.now()) throw new Error("La fecha debe ser futura");
  const supabase = (await supabaseServer()) as any;
  let resolvedFolderId = args.folderId ?? null;
  if (!resolvedFolderId && typeof (args as any).folderName === "string") {
    const name = ((args as any).folderName as string).trim().toLowerCase();
    if (["sin carpeta", "ninguna", "none", "no folder", "todas", "all"].includes(name)) {
      resolvedFolderId = null;
    } else if (name) {
      const { data: f } = await supabase
        .from("folders")
        .select("id,name")
        .eq("user_id", userId)
        .ilike("name", name);
      const exact = (f ?? []).find((x: any) => x.name.trim().toLowerCase() === name);
      const pick = exact ?? (f ?? [])[0];
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
      details: (args as any).details ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTaskTool(args: UpdateTaskArgs) {
  const userId = await getUserId();
  const supabase = (await supabaseServer()) as any;
  const update: any = {};
  if (typeof args.title === "string") update.title = args.title;
  if (typeof args.completed === "boolean") update.completed = args.completed;
  if (typeof args.priority === "string") update.priority = args.priority;
  if (typeof args.category === "string") update.category = args.category;
  if (typeof args.dueDate === "string") update.due_date = args.dueDate;
  if (typeof args.details !== "undefined") update.details = args.details;
  if (typeof args.folderId !== "undefined") update.folder_id = args.folderId;
  if (typeof (args as any).folderName !== "undefined" && (args as any).folderName !== null) {
    const name = String((args as any).folderName).trim().toLowerCase();
    if (["sin carpeta", "ninguna", "none", "no folder", "todas", "all"].includes(name)) {
      update.folder_id = null;
    } else if (name) {
      const { data: f } = await supabase
        .from("folders")
        .select("id,name")
        .eq("user_id", userId)
        .ilike("name", name);
      const exact = (f ?? []).find((x: any) => x.name.trim().toLowerCase() === name);
      const pick = exact ?? (f ?? [])[0];
      if (pick) update.folder_id = pick.id as string;
      else throw new Error("No se encontró la carpeta indicada por nombre");
    }
  }
  if (Object.keys(update).length === 0) throw new Error("Sin cambios");
  const { data, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", args.taskId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTaskTool(args: DeleteTaskArgs) {
  const userId = await getUserId();
  const supabase = (await supabaseServer()) as any;
  const { data: found } = await supabase.from("tasks").select("id,title").eq("id", args.taskId).eq("user_id", userId).single();
  if (!found) throw new Error("No encontrada");
  const { error } = await supabase.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", args.taskId).eq("user_id", userId);
  if (error) throw error;
  return { deletedId: args.taskId, title: (found as any).title };
}

export async function deleteTasksBulkTool(args: DeleteTasksBulkArgs) {
  const userId = await getUserId();
  if (!args.confirm) throw new Error("Se requiere confirmación para borrar en masa");
  const ids = Array.from(new Set(args.taskIds ?? [])).filter(Boolean);
  if (ids.length === 0) return { deleted: 0 };
  const supabase = (await supabaseServer()) as any;
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", userId);
  if (error) throw error;
  return { deleted: ids.length };
}

export async function searchTasksTool(args: SearchTasksArgs) {
  const userId = await getUserId();
  const supabase = (await supabaseServer()) as any;
  let q = supabase.from("tasks").select("*").eq("user_id", userId).is("deleted_at", null);
  if (typeof args.completed === "boolean") q = q.eq("completed", args.completed);
  if (args.priority) q = q.eq("priority", args.priority);
  if (args.category) q = q.eq("category", args.category);
  if (args.categories && args.categories.length > 0) {
    const orParts = args.categories.map((c) => `category.eq.${c}`);
    q = q.or(orParts.join(","));
  }
  if (args.query && args.query.trim()) {
    const qtext = args.query.trim();
    q = q.or(`title.ilike.%${qtext}%,details.ilike.%${qtext}%`);
  }
  if (args.dueDateFrom) q = q.gte("due_date", args.dueDateFrom);
  if (args.dueDateTo) q = q.lte("due_date", args.dueDateTo);
  const sortMap: Record<string, string> = { createdAt: "created_at", dueDate: "due_date", priority: "priority", title: "title" };
  if (args.sortBy) q = q.order(sortMap[args.sortBy], { ascending: args.sortOrder !== "desc" });
  if (typeof args.limit === "number") {
    const offset = args.offset ?? 0;
    const to = Math.max(0, offset + Math.max(1, args.limit) - 1);
    q = q.range(offset, to);
  }
  const { data, error } = await q;
  if (error) throw error;
  return { items: data ?? [], total: data?.length ?? 0 };
}

export async function getTaskStatsTool(_args: GetTaskStatsArgs) {
  const userId = await getUserId();
  const supabase = (await supabaseServer()) as any;
  const { data } = await supabase.from("tasks").select("*").eq("user_id", userId);
  const tasks = data ?? [];
  const total = tasks.length;
  const completed = tasks.filter((t: any) => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter((t: any) => !t.completed && t.due_date && new Date(t.due_date).getTime() < Date.now()).length;
  const byPriority: any = { high: { total: 0, completed: 0, pending: 0 }, medium: { total: 0, completed: 0, pending: 0 }, low: { total: 0, completed: 0, pending: 0 } };
  const byCategory: any = {};
  for (const t of tasks as any[]) {
    if (t.priority && byPriority[t.priority]) {
      byPriority[t.priority].total++;
      if (t.completed) byPriority[t.priority].completed++; else byPriority[t.priority].pending++;
    }
    const cat = t.category ?? "other";
    byCategory[cat] = byCategory[cat] ?? { total: 0, completed: 0, pending: 0 };
    byCategory[cat].total++;
    if (t.completed) byCategory[cat].completed++; else byCategory[cat].pending++;
  }
  return {
    summary: { totalTasks: total, completedTasks: completed, pendingTasks: pending, completionRate: total ? Math.round((completed / total) * 100) : 0, overdueTasks: overdue },
    byPriority,
    byCategory,
  };
}


