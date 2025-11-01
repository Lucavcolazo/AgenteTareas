"use client";

// Input para crear nuevas tareas

import { Plus } from "lucide-react";

export function TaskComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Agrega una nueva tarea…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
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
        className="flex-1 rounded-xl border border-white/30 bg-black/30 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/60 outline-none transition-shadow focus:ring-2 focus:ring-white/30 focus:border-white/50"
      />
      <button
        onClick={onSubmit}
        className="grid h-[46px] w-[46px] place-items-center rounded-xl bg-white text-black transition-opacity hover:opacity-90"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}


