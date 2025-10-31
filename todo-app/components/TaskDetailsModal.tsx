"use client";

import { useState, useEffect } from "react";
import type { Tables } from "@/types/database";
import { Modal } from "./Modal";

type Task = Tables["tasks"]["Row"];

export function TaskDetailsModal({
  open,
  task,
  onClose,
  onSaveNotes,
  onAddToCalendar,
}: {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSaveNotes: (taskId: string, notes: string) => Promise<void> | void;
  onAddToCalendar: (task: Task) => void;
}) {
  const [notes, setNotes] = useState("");
  useEffect(() => {
    setNotes(((task?.details as string) ?? (task?.category as string)) ?? "");
  }, [task?.id]);

  if (!open || !task) return null;

  return (
    <Modal open={open} onClose={onClose} title="Detalles de la tarea">
      <div className="space-y-4">
        <div>
          <div className="text-sm opacity-70">Título</div>
          <div className="text-base font-medium">{task.title}</div>
        </div>
        <div>
          <div className="text-sm opacity-70">Fecha y hora</div>
          <div className="text-base">{task.due_date ? new Date(task.due_date).toLocaleString() : "Sin fecha"}</div>
        </div>
        <div>
          <label className="mb-1 block text-sm opacity-70">Detalles</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-neutral-300 bg-transparent p-3 outline-none dark:border-neutral-700"
            placeholder="Agrega detalles o notas…"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onSaveNotes(task.id, notes)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
            >
              Guardar
            </button>
            <button
              onClick={() => onAddToCalendar(task)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
            >
              Agregar a Google Calendar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}


