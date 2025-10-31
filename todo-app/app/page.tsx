"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { TaskItem } from "@/components/TaskItem";
import { Sidebar } from "@/components/Sidebar";
import { TaskComposer } from "@/components/TaskComposer";
import { Navbar } from "@/components/Navbar";
import { BotFab } from "@/components/BotFab";
import { AgentChatModal } from "@/components/AgentChatModal";
import { FolderCreateModal } from "@/components/FolderCreateModal";
import { TaskEditModal } from "@/components/TaskEditModal";
import { useToast } from "@/components/Toast";
import type { Tables } from "@/types/database";

type Task = Tables["tasks"]["Row"];
type Folder = Tables["folders"]["Row"];

export default function Home() {
  const supabase = supabaseClient();
  const router = useRouter();
  const { show } = useToast();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [taskEditOpen, setTaskEditOpen] = useState(false);
  const [taskEditing, setTaskEditing] = useState<Task | null>(null);

  // Cargar sesión y tareas del usuario
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // Verificar si hay mensaje de conexión exitosa de Google Calendar
      const params = new URLSearchParams(window.location.search);
      if (params.get("google_calendar_connected") === "true") {
        show({ title: "Google Calendar conectado", description: "Ya puedes crear tareas con fecha automáticamente", variant: "success" });
        window.history.replaceState({}, "", window.location.pathname);
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!isMounted) return;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName = typeof meta.full_name === "string" ? meta.full_name : undefined;
      const name = typeof meta.name === "string" ? meta.name : undefined;
      setDisplayName(fullName || name || (user.email ? user.email.split("@")[0] : null));
      setUserId(user.id);
      const { data: rows } = await supabase
        .from("tasks")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      setTasks(rows ?? []);
      const { data: fRows } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      const safeFolders = (fRows ?? []) as Folder[];
      setFolders(safeFolders);
      // Siempre empezar con "Todas" (null) como carpeta por defecto
      setActiveFolderId(null);
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [router, supabase, page, pageSize, show]);

  // Suscribirse en tiempo real a cambios de tareas del usuario
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Task;
          setTasks((prev) => {
            if (prev.some((t) => t.id === row.id)) return prev;
            return [row, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Task;
          setTasks((prev) => {
            if (row.deleted_at) return prev.filter((t) => t.id !== row.id);
            return prev.map((t) => (t.id === row.id ? { ...t, ...row } : t));
          });
        }
      )
      // Eliminaciones duras no deberían ocurrir con soft delete, 
      // mantenemos el listener por si acaso
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` }, (payload) => {
        const oldRow = payload.old as { id: string };
        setTasks((prev) => prev.filter((t) => t.id !== oldRow.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);


  const folderCounts = useMemo(() => {
    const map: Record<string, number> = {};
    let none = 0;
    let all = 0;
    for (const t of tasks) {
      if (!t.completada) {
        all++;
        if (t.folder_id) {
          const fid = t.folder_id as unknown as string;
          map[fid] = (map[fid] ?? 0) + 1;
        } else {
          none++;
        }
      }
    }
    map["__none__"] = none;
    map["__all__"] = all;
    return map;
  }, [tasks]);

  async function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return router.replace("/login");
    // Filtrar valores especiales de activeFolderId (__none__, __all__) que no son UUIDs reales
    const realFolderId = activeFolderId && activeFolderId !== "__none__" && activeFolderId !== "__all__" ? activeFolderId : null;
    const optimistic: Task = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      completada: false,
      created_at: new Date().toISOString(),
      folder_id: realFolderId,
    } as Task;
    setTasks((prev) => [optimistic, ...prev]);
    setNewTitle("");
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title, user_id: userId, folder_id: realFolderId ?? null })
      .select()
      .single();
    if (error) {
      // Revertir si falla
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      console.error("Error al crear tarea:", error);
      show({ 
        title: "Error al crear tarea", 
        description: error.message ?? "Verifica las políticas RLS en Supabase",
        variant: "error" 
      });
      return;
    }
    // Conservar props del optimista (p.ej. folder_id) si la respuesta no las trae
    setTasks((prev) =>
      prev.map((t) => (t.id === optimistic.id ? { ...t, ...(data as Partial<Task>) } : t))
    );
    show({ title: "Tarea creada", variant: "success" });
  }

  async function toggleTask(id: string, nextCompleted: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completada: nextCompleted } : t)));
    const { error } = await supabase
      .from("tasks")
      .update({ completada: nextCompleted })
      .eq("id", id);
    if (error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completada: !nextCompleted } : t)));
      console.error("Error al actualizar tarea:", error);
      show({ 
        title: "No se pudo actualizar la tarea", 
        description: error.message ?? "Verifica que el campo 'completada' exista en la base de datos",
        variant: "error" 
      });
    }
    else show({ title: nextCompleted ? "Tarea completada" : "Tarea marcada como pendiente", variant: "success" });
  }

  async function deleteTask(id: string) {
    const prev = tasks;
    setTasks((cur) => cur.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setTasks(prev);
      show({ title: "No se pudo eliminar la tarea", variant: "error" });
    } else {
      show({ title: "Tarea eliminada", variant: "success" });
    }
  }

  async function editFolder(id: string, newName: string) {
    const prev = folders;
    setFolders((cur) => cur.map((f) => (f.id === id ? { ...f, name: newName } : f)));
    const { error } = await supabase.from("folders").update({ name: newName }).eq("id", id);
    if (error) {
      setFolders(prev);
      show({ title: "No se pudo actualizar la carpeta", variant: "error" });
    } else {
      show({ title: "Carpeta actualizada", variant: "success" });
    }
  }

  async function confirmTaskEdit(payload: { id: string; title: string; details: string | null; dueDateIso: string | null; priority: "low" | "medium" | "high" | null; category: "work" | "personal" | "shopping" | "health" | "other" | null }) {
    const prev = tasks;
    setTasks((cur) => cur.map((t) => (
      t.id === payload.id
        ? { ...t, title: payload.title, details: payload.details ?? null, due_date: payload.dueDateIso ?? null, priority: payload.priority ?? t.priority, category: payload.category ?? t.category }
        : t
    )));
    const { error } = await supabase
      .from("tasks")
      .update({ title: payload.title, details: payload.details, due_date: payload.dueDateIso, priority: payload.priority, category: payload.category })
      .eq("id", payload.id);
    if (error) {
      setTasks(prev);
      show({ title: "No se pudo guardar los cambios", variant: "error" });
    } else {
      show({ title: "Tarea actualizada", variant: "success" });
    }
    setTaskEditOpen(false);
    setTaskEditing(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center bg-white text-black dark:bg-black dark:text-white">
        <span className="opacity-70">Cargando…</span>
      </div>
    );
  }

  const visible = tasks.filter((t) => (
    activeFolderId === "__none__" ? !t.folder_id : activeFolderId ? t.folder_id === activeFolderId : true
  ));
  const [open, done] = [visible.filter((t) => !t.completada), visible.filter((t) => t.completada)];

  return (
    <div className="min-h-dvh bg-white text-black dark:bg-black dark:text-white">
      {/* Navbar superior, separado del contenido */}
      <div className="sticky top-0 z-20 w-full border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-black/80">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 md:px-8 md:py-4">
          <Navbar
            displayName={displayName}
            onSignOut={signOut}
            pageSize={pageSize}
            onChangePageSize={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-6 md:flex-row md:px-8 md:py-8">
        <Sidebar
          folders={folders}
          counts={folderCounts}
          activeId={activeFolderId}
          onSelect={setActiveFolderId}
          onCreate={async () => {
            const { data: auth } = await supabase.auth.getUser();
            const userId = auth.user?.id;
            if (!userId) return;
            setFolderModalOpen(true);
          }}
          onEdit={editFolder}
        />

        <FolderCreateModal
          open={folderModalOpen}
          onClose={() => setFolderModalOpen(false)}
          onConfirm={async (name) => {
            setFolderModalOpen(false);
            const { data: auth } = await supabase.auth.getUser();
            const userId = auth.user?.id;
            if (!userId) return;
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

        <main className="flex-1 md:max-w-none">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold md:text-3xl">
              {folders.find((f) => f.id === activeFolderId)?.name || "Todas"}
            </h1>
          </header>

          <TaskComposer value={newTitle} onChange={setNewTitle} onSubmit={addTask} />

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
                  onOpenEdit={(task) => {
                    setTaskEditing(task);
                    setTaskEditOpen(true);
                  }}
                />
              ))
            )}
          </section>

          {done.length > 0 ? (
            <>
              <h2 className="mt-8 mb-2 text-sm font-semibold opacity-70">Completadas</h2>
              <section className="space-y-2">
                {done.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    onOpenEdit={(task) => {
                      setTaskEditing(task);
                      setTaskEditOpen(true);
                    }}
                  />
                ))}
              </section>
            </>
          ) : null}

          {visible.length > pageSize ? (
            <div className="mt-6 flex items-center justify-between text-sm opacity-70">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
              >
                Anterior
              </button>
              <span>Página {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </main>
        
      </div>
      {!agentOpen && <BotFab onClick={() => setAgentOpen(true)} />}
      <AgentChatModal
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        displayName={displayName}
        onTaskChange={async () => {
          // Refrescar tareas después de que el bot hace cambios
          const { data: auth } = await supabase.auth.getUser();
          const userId = auth.user?.id;
          if (!userId) return;
          const { data: rows } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });
          if (rows) setTasks(rows);
        }}
      />
      <TaskEditModal
        open={taskEditOpen}
        onClose={() => {
          setTaskEditOpen(false);
          setTaskEditing(null);
        }}
        task={taskEditing}
        onConfirm={confirmTaskEdit}
      />
    </div>
  );
}
