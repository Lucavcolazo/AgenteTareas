"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { TaskItem } from "@/components/TaskItem";
import { Sidebar } from "@/components/Sidebar";
import { TaskComposer } from "@/components/TaskComposer";
import { Navbar } from "@/components/Navbar";
import { FolderCreateModal } from "@/components/FolderCreateModal";
import { useToast } from "@/components/Toast";
import { TaskDetailsModal } from "@/components/TaskDetailsModal";
import type { Tables } from "@/types/database";

type Task = Tables["tasks"]["Row"];
type Folder = Tables["folders"]["Row"];

export default function Home() {
  const supabase = supabaseClient();
  const router = useRouter();
  const { show } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);

  // Cargar sesión y tareas del usuario
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!isMounted) return;
      setUserEmail(user.email ?? null);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from("tasks")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);
      if (activeFolderId) query = query.eq("folder_id", activeFolderId);
      query = query.order("created_at", { ascending: false }).range(from, to);
      const { data: rows, count } = await query;
      setTasks((rows ?? []) as Task[]);
      setTotalCount(count ?? 0);
      const { data: fRows } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      const safeFolders = (fRows ?? []) as Folder[];
      setFolders(safeFolders);
      if (activeFolderId == null) {
        setActiveFolderId(safeFolders[0]?.id ?? null);
      }
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [router, supabase, page, pageSize, activeFolderId]);

  const counts = useMemo(() => {
    const done = tasks.filter((t) => t.completed).length;
    return { done, total: tasks.length, pending: tasks.length - done };
  }, [tasks]);

  const folderCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      const fid = t.folder_id as unknown as string | undefined;
      if (!fid) continue;
      map[fid] = (map[fid] ?? 0) + (t.completed ? 0 : 1);
    }
    return map;
  }, [tasks]);

  async function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return router.replace("/login");
    const optimistic: Task = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      completed: false,
      created_at: new Date().toISOString(),
      folder_id: activeFolderId ?? null,
      due_date: newDue ?? null,
    } as Task;
    setTasks((prev) => [optimistic, ...prev]);
    setNewTitle("");
    setNewDue(null);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title, user_id: userId, folder_id: activeFolderId ?? undefined, due_date: newDue ?? undefined })
      .select()
      .single();
    if (error) {
      // Revertir si falla
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      show({ title: "Error al crear tarea", variant: "error" });
      return;
    }
    // Conservar props del optimista (p.ej. folder_id) si la respuesta no las trae
    setTasks((prev) =>
      prev.map((t) => (t.id === optimistic.id ? { ...t, ...(data as Partial<Task>) } : t))
    );
    show({ title: "Tarea creada", variant: "success" });
  }

  async function toggleTask(id: string, nextCompleted: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)));
    const { error } = await supabase
      .from("tasks")
      .update({ completed: nextCompleted })
      .eq("id", id);
    if (error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !nextCompleted } : t)));
      show({ title: "No se pudo actualizar la tarea", variant: "error" });
    }
    else show({ title: nextCompleted ? "Tarea completada" : "Tarea marcada como pendiente", variant: "success" });
  }

  async function deleteTask(id: string) {
    const prev = tasks;
    setTasks((cur) => cur.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setTasks(prev);
      show({ title: "No se pudo eliminar la tarea", variant: "error" });
    } else {
      show({ title: "Tarea eliminada", variant: "success" });
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const prev = tasks;
    setTasks((cur) => cur.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    const { error } = await supabase.from("tasks").delete().in("id", ids);
    if (error) {
      setTasks(prev);
      show({ title: "No se pudo eliminar la selección", variant: "error" });
    } else {
      show({ title: "Tareas eliminadas", variant: "success" });
    }
  }

  async function saveNotes(taskId: string, notes: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, details: notes } : t)));
    const { error } = await supabase.from("tasks").update({ details: notes, category: notes }).eq("id", taskId);
    if (error) {
      show({ title: "No se pudieron guardar los detalles", variant: "error" });
    } else {
      show({ title: "Detalles guardados", variant: "success" });
    }
  }

  async function addTaskToCalendar(task: Task) {
    if (!task.due_date) {
      show({ title: "Agrega una fecha/hora primero", variant: "error" });
      return;
    }
    const res = await fetch("/api/calendar/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        startISO: task.due_date,
        details: (task.details as string) ?? (task.category as string) ?? "",
      }),
    });
    const json = await res.json();
    if (json.url) window.open(json.url, "_blank");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const visible = tasks.filter((t) => (activeFolderId ? t.folder_id === activeFolderId : true));
  const [open, done] = [visible.filter((t) => !t.completed), visible.filter((t) => t.completed)];
  const allVisibleIds = useMemo(() => visible.map((t) => t.id), [visible]);
  const allSelected = allVisibleIds.every((id) => selectedIds.has(id)) && allVisibleIds.length > 0;
  function toggleSelectAll(next: boolean) {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) {
        for (const id of allVisibleIds) copy.add(id);
      } else {
        for (const id of allVisibleIds) copy.delete(id);
      }
      return copy;
    });
  }

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center bg-white text-black dark:bg-black dark:text-white">
        <span className="opacity-70">Cargando…</span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-black dark:bg-black dark:text-white">
      {/* Navbar superior, separado del contenido */}
      <div className="sticky top-0 z-20 w-full border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-black/80">
        <div className="mx-auto w-full max-w-5xl px-6 py-4 md:px-8">
          <Navbar
            email={userEmail}
            onSignOut={signOut}
            pageSize={pageSize}
            onChangePageSize={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl gap-6 px-6 py-6 md:px-8 md:py-8">
        <Sidebar
          folders={folders}
          counts={folderCounts}
          activeId={activeFolderId}
          onSelect={(id) => {
            setActiveFolderId(id);
            setPage(1);
          }}
          onCreate={async () => {
            const { data: auth } = await supabase.auth.getUser();
            const userId = auth.user?.id;
            if (!userId) return;
            setFolderModalOpen(true);
          }}
        />

        <FolderCreateModal
          open={folderModalOpen}
          onClose={() => setFolderModalOpen(false)}
          onConfirm={async (name) => {
            setFolderModalOpen(false);
            const { data: auth } = await supabase.auth.getUser();
            const userId = auth.user?.id!;
            const optimistic: Folder = {
              id: crypto.randomUUID(),
              user_id: userId,
              name,
              created_at: new Date().toISOString(),
            } as Folder;
            setFolders((f) => [...f, optimistic]);
            const { data, error } = await supabase
              .from("folders")
              .insert({ name, user_id: userId })
              .select()
              .single();
            if (error) {
              setFolders((f) => f.filter((x) => x.id !== optimistic.id));
              show({ title: "No se pudo crear la carpeta", variant: "error" });
              return;
            }
            setFolders((f) => f.map((x) => (x.id === optimistic.id ? (data as Folder) : x)));
            setActiveFolderId((data as Folder).id);
            show({ title: "Carpeta creada", variant: "success" });
          }}
        />

        <main className="flex-1">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold">
              {folders.find((f) => f.id === activeFolderId)?.name || "Todas"}
            </h1>
          </header>

          <TaskComposer value={newTitle} onChange={setNewTitle} onSubmit={addTask} due={newDue ?? ""} onDueChange={(v) => setNewDue(v || null)} />

          <div className="mt-3 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 opacity-80">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              Seleccionar todo
            </label>
            <button
              onClick={deleteSelected}
              disabled={selectedIds.size === 0}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 opacity-80 transition-opacity hover:opacity-100 disabled:opacity-40 dark:border-neutral-700"
            >
              Eliminar seleccionadas ({selectedIds.size})
            </button>
          </div>

          <section className="mt-6 space-y-2">
            {open.length === 0 ? (
              <p className="opacity-60">No hay tareas pendientes.</p>
            ) : (
              open.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  selectable
                  selected={selectedIds.has(t.id)}
                  onSelectChange={(id, sel) =>
                    setSelectedIds((prev) => {
                      const copy = new Set(prev);
                      if (sel) copy.add(id);
                      else copy.delete(id);
                      return copy;
                    })
                  }
                  onOpenDetails={(task) => { setDetailsTask(task); setDetailsOpen(true); }}
                />
              ))
            )}
          </section>

          <h2 className="mt-8 mb-2 text-sm font-semibold opacity-70">Completed</h2>
          <section className="space-y-2">
            {done.length === 0 ? (
              <p className="opacity-40">Nada completado aún.</p>
            ) : (
              done.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  selectable
                  selected={selectedIds.has(t.id)}
                  onSelectChange={(id, sel) =>
                    setSelectedIds((prev) => {
                      const copy = new Set(prev);
                      if (sel) copy.add(id);
                      else copy.delete(id);
                      return copy;
                    })
                  }
                  onOpenDetails={(task) => { setDetailsTask(task); setDetailsOpen(true); }}
                />
              ))
            )}
          </section>

          <div className="mt-6 flex items-center justify-between text-sm opacity-70">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
            >
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              disabled={page * pageSize >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
            >
              Siguiente
            </button>
          </div>
        </main>
      </div>
      {/* Modal de Detalles */}
      <TaskDetailsModal
        open={detailsOpen}
        task={detailsTask}
        onClose={() => setDetailsOpen(false)}
        onSaveNotes={saveNotes}
        onAddToCalendar={addTaskToCalendar}
      />
    </div>
  );
}
