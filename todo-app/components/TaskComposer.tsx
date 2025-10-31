"use client";

// Input para crear nuevas tareas

import { Plus } from "lucide-react";

export function TaskComposer({
  value,
  onChange,
  onSubmit,
  due,
  onDueChange,
  placeholder = "Add a new task…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  due?: string | null;
  onDueChange?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder={placeholder}
        className="flex-1 rounded-xl border border-neutral-300 bg-transparent px-4 py-3 outline-none transition-shadow focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
      />
      <input
        type="datetime-local"
        value={due ?? ""}
        onChange={(e) => onDueChange?.(e.target.value)}
        className="rounded-xl border border-neutral-300 bg-transparent px-3 py-3 text-sm outline-none dark:border-neutral-700"
      />
      <button
        onClick={onSubmit}
        className="grid h-[46px] w-[46px] place-items-center rounded-xl bg-black text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}


