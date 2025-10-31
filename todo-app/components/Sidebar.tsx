"use client";

// Sidebar de carpetas con contadores y selección activa

import { useState } from "react";
import { FolderPlus, Folder as FolderIcon, Pencil, Check, X } from "lucide-react";
import type { Tables } from "@/types/database";

type Folder = Tables["folders"]["Row"];

export function Sidebar({
  folders,
  counts,
  activeId,
  onSelect,
  onCreate,
  onEdit,
}: {
  folders: Folder[];
  counts: Record<string, number>;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onEdit?: (id: string, newName: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function startEdit(folder: Folder) {
    setEditingId(folder.id);
    setEditName(folder.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  function saveEdit(folderId: string) {
    if (editName.trim() && onEdit) {
      onEdit(folderId, editName.trim());
      setEditingId(null);
      setEditName("");
    }
  }
  return (
    <aside className="w-full max-w-[240px] shrink-0 border-r border-neutral-200 pr-4 dark:border-neutral-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide uppercase opacity-70">Carpetas</h2>
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
          const isEditing = editingId === f.id;
          return (
            <div
              key={f.id}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 transition-colors ${
                isActive
                  ? "bg-neutral-100 dark:bg-neutral-900"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
            >
              {isEditing ? (
                <div className="flex flex-1 items-center gap-2">
                  <FolderIcon className="h-4 w-4 opacity-70" />
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(f.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit(f.id);
                    }}
                    className="rounded p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                    }}
                    className="rounded p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onSelect(f.id)}
                    className="flex flex-1 items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 opacity-70" />
                      <span className="text-sm">{f.name}</span>
                    </span>
                    <span className="rounded-md bg-neutral-200 px-1.5 text-xs dark:bg-neutral-800">
                      {counts[f.id] ?? 0}
                    </span>
                  </button>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(f);
                      }}
                      className="ml-2 opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}


