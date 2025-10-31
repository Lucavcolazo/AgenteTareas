"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { TaskItem } from "@/components/TaskItem";
import { Sidebar } from "@/components/Sidebar";
import { TaskComposer } from "@/components/TaskComposer";
import type { Tables } from "@/types/database";

type Task = Tables["tasks"]["Row"];
type Folder = Tables["folders"]["Row"];

export default function Home() {
  const supabase = supabaseClient();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);

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
      const { data: rows } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTasks(rows ?? []);
      const { data: fRows } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      const safeFolders = (fRows ?? []) as Folder[];
      setFolders(safeFolders);
      setActiveFolderId(safeFolders[0]?.id ?? null);
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

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
    } as Task;
    setTasks((prev) => [optimistic, ...prev]);
    setNewTitle("");
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title, user_id: userId, folder_id: activeFolderId ?? undefined })
      .select()
      .single();
    if (error) {
      // Revertir si falla
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      return;
    }
    setTasks((prev) => [data as Task, ...prev.filter((t) => t.id !== optimistic.id)]);
  }

  async function toggleTask(id: string, nextCompleted: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)));
    const { error } = await supabase
      .from("tasks")
      .update({ completed: nextCompleted })
      .eq("id", id);
    if (error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !nextCompleted } : t)));
    }
  }

  async function deleteTask(id: string) {
    const prev = tasks;
    setTasks((cur) => cur.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) setTasks(prev);
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

  const visible = tasks.filter((t) => (activeFolderId ? t.folder_id === activeFolderId : true));
  const [open, done] = [visible.filter((t) => !t.completed), visible.filter((t) => t.completed)];

  return (
    <div className="min-h-dvh bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto flex w-full max-w-5xl gap-6 p-6 md:p-8">
        <Sidebar
          folders={folders}
          counts={folderCounts}
          activeId={activeFolderId}
          onSelect={setActiveFolderId}
          onCreate={async () => {
            const { data: auth } = await supabase.auth.getUser();
            const userId = auth.user?.id;
            if (!userId) return;
            const name = prompt("Nombre de la carpeta");
            if (!name) return;
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
              return;
            }
            setFolders((f) => f.map((x) => (x.id === optimistic.id ? (data as Folder) : x)));
            setActiveFolderId((data as Folder).id);
          }}
        />

        <main className="flex-1">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold">
              {folders.find((f) => f.id === activeFolderId)?.name || "Todas"}
            </h1>
            <button
              onClick={signOut}
              className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Cerrar sesión
            </button>
          </header>

          <TaskComposer value={newTitle} onChange={setNewTitle} onSubmit={addTask} />

          <section className="mt-6 space-y-2">
            {open.length === 0 ? (
              <p className="opacity-60">No hay tareas pendientes.</p>
            ) : (
              open.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
              ))
            )}
          </section>

          <h2 className="mt-8 mb-2 text-sm font-semibold opacity-70">Completed</h2>
          <section className="space-y-2">
            {done.length === 0 ? (
              <p className="opacity-40">Nada completado aún.</p>
            ) : (
              done.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
