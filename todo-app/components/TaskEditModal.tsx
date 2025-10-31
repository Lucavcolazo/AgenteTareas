"use client";

// Modal para editar una tarea con título, descripción y fecha/hora de entrega

import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { supabaseClient } from "@/lib/supabaseClient";
import { useToast } from "./Toast";
import { Calendar } from "lucide-react";

type TaskEditable = {
  id: string;
  title: string;
  details?: string | null;
  due_date?: string | null;
  priority?: string | null;
};

export function TaskEditModal({
  open,
  onClose,
  task,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  task: TaskEditable | null;
  onConfirm: (updates: { id: string; title: string; details: string | null; dueDateIso: string | null; priority: "low" | "medium" | "high" | null }) => void;
}) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">("");
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const supabase = supabaseClient();
  const { show } = useToast();

  // Prefill con la tarea actual
  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? "");
    setDetails(task.details ?? "");
    const taskPriority = task.priority as "low" | "medium" | "high" | null | undefined;
    setPriority(taskPriority ?? "");
    if (task.due_date) {
      const d = new Date(task.due_date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      
      // Usar la fecha/hora como inicio
      setDateStart(`${yyyy}-${mm}-${dd}`);
      setTimeStart(`${hh}:${min}`);
      
      // Calcular fin: 1 hora después por defecto
      const endDate = new Date(d.getTime() + 60 * 60 * 1000);
      const endYyyy = endDate.getFullYear();
      const endMm = String(endDate.getMonth() + 1).padStart(2, "0");
      const endDd = String(endDate.getDate()).padStart(2, "0");
      const endHh = String(endDate.getHours()).padStart(2, "0");
      const endMin = String(endDate.getMinutes()).padStart(2, "0");
      setDateEnd(`${endYyyy}-${endMm}-${endDd}`);
      setTimeEnd(`${endHh}:${endMin}`);
    } else {
      setDateStart("");
      setTimeStart("");
      setDateEnd("");
      setTimeEnd("");
    }
  }, [task]);

  // Construcción del enlace a Google Calendar (si hay fecha/hora desde)
  // Usa zona horaria local para preservar la hora que el usuario ingresó
  const googleCalendarUrl = useMemo(() => {
    if (!dateStart || !timeStart || !dateEnd || !timeEnd) return null;
    // Crear fechas en zona horaria local (no UTC)
    const start = new Date(dateStart + "T" + timeStart);
    const end = new Date(dateEnd + "T" + timeEnd);
    
    // Formatear con offset de zona horaria local (no UTC)
    function fmt(d: Date) {
      const offset = -d.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(offset) / 60);
      const offsetMinutes = Math.abs(offset) % 60;
      const sign = offset >= 0 ? "+" : "-";
      
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      
      // Formato: YYYYMMDDTHHmmss+offset (ej: 20251101T120000-0300)
      // Esto preserva la hora local correctamente
      return `${y}${m}${da}T${h}${mi}00${sign}${String(offsetHours).padStart(2, "0")}${String(offsetMinutes).padStart(2, "0")}`;
    }
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title || "Tarea",
      details: details || "",
      dates: `${fmt(start)}/${fmt(end)}`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, [dateStart, timeStart, dateEnd, timeEnd, title, details]);

  // Función para agregar automáticamente a Google Calendar
  async function handleAddToCalendar() {
    if (!dateStart || !timeStart || !dateEnd || !timeEnd) return;
    
    setAddingToCalendar(true);
    try {
      // Verificar si el usuario tiene tokens de Google Calendar
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Sin usuario, abrir URL manual
        if (googleCalendarUrl) window.open(googleCalendarUrl, "_blank");
        return;
      }

      const metadata = user.user_metadata as Record<string, unknown> | undefined;
      const hasTokens = !!metadata?.google_calendar_tokens;

      if (!hasTokens) {
        // Sin tokens, abrir URL manual
        if (googleCalendarUrl) window.open(googleCalendarUrl, "_blank");
        show({
          title: "Conecta Google Calendar",
          description: "Conecta tu cuenta en Configuración para agregar eventos automáticamente",
          variant: "default",
        });
        return;
      }

      // Tiene tokens, intentar agregar automáticamente
      // Crear fechas en hora local explícitamente
      // Parsear fecha y hora manualmente para evitar problemas de timezone
      const [yearStart, monthStart, dayStart] = dateStart.split("-").map(Number);
      const [hourStart, minuteStart] = timeStart.split(":").map(Number);
      const [yearEnd, monthEnd, dayEnd] = dateEnd.split("-").map(Number);
      const [hourEnd, minuteEnd] = timeEnd.split(":").map(Number);
      
      // Crear fechas usando constructor local (mes es 0-indexed)
      const start = new Date(yearStart, monthStart - 1, dayStart, hourStart, minuteStart, 0);
      const end = new Date(yearEnd, monthEnd - 1, dayEnd, hourEnd, minuteEnd, 0);
      
      // Validar que las fechas sean válidas
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Fechas inválidas");
      }

      // Formatear como ISO con offset de zona horaria local
      function toLocalISOString(date: Date): string {
        const offset = -date.getTimezoneOffset();
        const sign = offset >= 0 ? "+" : "-";
        const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
        const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}${sign}${hours}:${minutes}`;
      }

      const response = await fetch("/api/google-calendar/add-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Tarea",
          description: details || "",
          startDate: toLocalISOString(start),
          endDate: toLocalISOString(end),
        }),
      });

      const result = await response.json();

      if (result.success && result.url) {
        show({
          title: "Evento agregado",
          description: "Se agregó a Google Calendar correctamente",
          variant: "success",
        });
        // Abrir el evento en Google Calendar
        window.open(result.url, "_blank");
      } else if (result.url) {
        // Falló pero tenemos URL manual
        show({
          title: "No se pudo agregar automáticamente",
          description: "Se abrirá Google Calendar para que lo agregues manualmente",
          variant: "default",
        });
        window.open(result.url, "_blank");
      } else {
        throw new Error(result.error || "Error desconocido");
      }
    } catch (error) {
      console.error("Error agregando a Calendar:", error);
      // Fallback a URL manual
      if (googleCalendarUrl) window.open(googleCalendarUrl, "_blank");
      show({
        title: "Error",
        description: "No se pudo agregar automáticamente. Se abrió Google Calendar.",
        variant: "error",
      });
    } finally {
      setAddingToCalendar(false);
    }
  }

  function submit() {
    if (!task) return;
    let dueDateIso: string | null = null;
    // Usar la fecha/hora de inicio como fecha de entrega
    if (dateStart && timeStart) {
      const local = new Date(dateStart + "T" + timeStart + ":00");
      dueDateIso = local.toISOString();
    }
    onConfirm({ id: task.id, title: title.trim() || "Tarea", details: details.trim() || null, dueDateIso, priority: priority || null });
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar tarea">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm opacity-70">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm opacity-70">Descripción</label>
          <textarea
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full resize-y rounded-xl border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm opacity-70">Prioridad</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high" | "")}
              className="w-full rounded-xl border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
            >
              <option value="" className="bg-white text-black dark:bg-black dark:text-white">Sin prioridad</option>
              <option value="low" className="bg-white text-black dark:bg-black dark:text-white">Baja</option>
              <option value="medium" className="bg-white text-black dark:bg-black dark:text-white">Media</option>
              <option value="high" className="bg-white text-black dark:bg-black dark:text-white">Alta</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h3 className="text-sm font-medium opacity-70">Rango de tiempo</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm opacity-70">Desde - Fecha</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm opacity-70">Desde - Hora</label>
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm opacity-70">Hasta - Fecha</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm opacity-70">Hasta - Hora</label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {googleCalendarUrl ? (
            <button
              onClick={handleAddToCalendar}
              disabled={addingToCalendar}
              className="flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900 disabled:opacity-50"
              title="Agregar a Google Calendar"
            >
              <Calendar className="h-4 w-4" />
              <span>{addingToCalendar ? "Agregando..." : "Agregar a Calendar"}</span>
            </button>
          ) : (
            <span className="text-sm opacity-50">Define rango de tiempo para Calendar</span>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700">Cancelar</button>
            <button onClick={submit} className="rounded-xl bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black">Guardar</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}


