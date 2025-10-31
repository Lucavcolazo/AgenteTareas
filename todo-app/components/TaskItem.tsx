"use client";

// Item de tarea reutilizable con estilos minimalistas

import React from "react";
import { Check, Trash2, Pencil } from "lucide-react";
import type { Tables } from "@/types/database";

type Task = Tables["tasks"]["Row"];

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onOpenEdit,
}: {
  task: Task;
  onToggle: (taskId: string, nextCompleted: boolean) => void;
  onDelete: (taskId: string) => void;
  onOpenEdit?: (task: Task) => void;
}) {
  const next = !Boolean(task.completada);

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer" onClick={() => onOpenEdit?.(task)}>
      <button
        aria-label="Marcar completada"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id, next);
        }}
        className={`grid h-5 w-5 place-items-center rounded-md border transition-colors shrink-0 ${
          task.completada
            ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
            : "border-neutral-400 dark:border-neutral-600"
        }`}
      >
        {task.completada ? <Check className="h-3.5 w-3.5" /> : null}
      </button>
      <div className="flex flex-1 items-center gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <div
            className={`text-sm transition-opacity ${
              task.completada ? "line-through opacity-50" : ""
            }`}
          >
            {task.title}
          </div>
          {task.due_date && (
            <div className="text-xs opacity-60">
              {(() => {
                const date = new Date(task.due_date);
                const hasTime = task.due_date.includes("T");
                if (hasTime) {
                  return date.toLocaleString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } else {
                  return date.toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                }
              })()}
            </div>
          )}
        </div>
        <button
          aria-label="Editar"
          onClick={(e) => {
            e.stopPropagation();
            onOpenEdit?.(task);
          }}
          className="opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100 shrink-0"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      <button
        aria-label="Eliminar"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="opacity-60 transition-opacity hover:opacity-100 shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}


