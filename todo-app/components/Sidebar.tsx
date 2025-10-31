"use client";

// Sidebar de carpetas con contadores y selección activa

import { FolderPlus, Folder as FolderIcon } from "lucide-react";
import type { Tables } from "@/types/database";

type Folder = Tables["folders"]["Row"];

export function Sidebar({
  folders,
  counts,
  activeId,
  onSelect,
  onCreate,
}: {
  folders: Folder[];
  counts: Record<string, number>;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
}) {
  return (
    <aside className="w-full max-w-[240px] shrink-0 border-r border-neutral-200 pr-4 dark:border-neutral-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide uppercase opacity-70">Folders</h2>
        <button onClick={onCreate} className="rounded-lg p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <FolderPlus className="h-4 w-4" />
        </button>
      </div>
      <nav className="space-y-1">
        {/* Todas */}
        <button
          onClick={() => onSelect(null)}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
            activeId === null ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <FolderIcon className="h-4 w-4 opacity-70" />
            <span className="text-sm">Todas</span>
          </span>
          <span className="rounded-md bg-neutral-200 px-1.5 text-xs dark:bg-neutral-800">{counts["__all__"] ?? 0}</span>
        </button>

        {/* Sin carpeta */}
        <button
          onClick={() => onSelect("__none__")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
            activeId === "__none__" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <FolderIcon className="h-4 w-4 opacity-70" />
            <span className="text-sm">Sin carpeta</span>
          </span>
          <span className="rounded-md bg-neutral-200 px-1.5 text-xs dark:bg-neutral-800">{counts["__none__"] ?? 0}</span>
        </button>

        {folders.map((f) => {
          const isActive = activeId === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                isActive
                  ? "bg-neutral-100 dark:bg-neutral-900"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
            >
              <span className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4 opacity-70" />
                <span className="text-sm">{f.name}</span>
              </span>
              <span className="rounded-md bg-neutral-200 px-1.5 text-xs dark:bg-neutral-800">
                {counts[f.id] ?? 0}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}


