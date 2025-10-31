"use client";

// Item de tarea reutilizable con estilos minimalistas

import { Check, Trash2 } from "lucide-react";
import type { Tables } from "@/types/database";

type Task = Tables["tasks"]["Row"];

export function TaskItem({
  task,
  onToggle,
  onDelete,
  selectable = false,
  selected = false,
  onSelectChange,
  onOpenDetails,
}: {
  task: Task;
  onToggle: (taskId: string, nextCompleted: boolean) => void;
  onDelete: (taskId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (taskId: string, next: boolean) => void;
  onOpenDetails?: (task: Task) => void;
}) {
  const next = !Boolean(task.completed);
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 transition-colors">
      {selectable ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelectChange?.(task.id, e.target.checked)}
          className="h-4 w-4 accent-black dark:accent-white"
        />
      ) : null}
      {!selectable ? (
        <button
          aria-label="Marcar completada"
          onClick={() => onToggle(task.id, next)}
          className={`grid h-5 w-5 place-items-center rounded-md border transition-colors ${
            task.completed
              ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
              : "border-neutral-400 dark:border-neutral-600"
          }`}
        >
          {task.completed ? <Check className="h-3.5 w-3.5" /> : null}
        </button>
      ) : null}
      <div
        className={`flex-1 text-sm transition-opacity ${
          task.completed ? "line-through opacity-50" : ""
        }`}
        onClick={() => onOpenDetails?.(task)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpenDetails?.(task);
        }}
      >
        {task.title}
        {task.due_date ? (
          <span className="ml-2 text-xs opacity-60">{new Date(task.due_date).toLocaleString()}</span>
        ) : null}
      </div>
      <button
        aria-label="Eliminar"
        onClick={() => onDelete(task.id)}
        className="opacity-60 transition-opacity hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}


