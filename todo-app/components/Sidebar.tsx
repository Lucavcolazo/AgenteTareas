"use client";

// Sidebar de carpetas con contadores y selección activa

import React, { useState, useEffect, useRef } from "react";
import { FolderPlus, Folder as FolderIcon, Pencil, Check, X, Trash2, ChevronRight, ChevronDown, Menu, X as XIcon } from "lucide-react";
import type { Tables } from "@/types/database";

type Folder = Tables["folders"]["Row"];

export function Sidebar({
  folders,
  counts,
  activeId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
}: {
  folders: Folder[];
  counts: Record<string, number>;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onEdit?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Cancelar edición al hacer click fuera
  useEffect(() => {
    if (editingId === null) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (editInputRef.current && !editInputRef.current.contains(event.target as Node)) {
        // Solo cancelar si no se hizo click en los botones de guardar/cancelar
        const target = event.target as HTMLElement;
        if (!target.closest('button[title="Guardar"]') && !target.closest('button[title="Cancelar"]')) {
          setEditingId(null);
          setEditName("");
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingId]);

  function toggleExpand(folderId: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

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
  // Función para obtener el nombre de la carpeta activa
  const getActiveFolderName = () => {
    if (activeId === null) return "Todas";
    if (activeId === "__none__") return "Sin carpeta";
    const folder = folders.find(f => f.id === activeId);
    return folder?.name || "Todas";
  };

  return (
    <>
      {/* Vista móvil: menú hamburguesa */}
      <div className="mb-4 w-full md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-white/30 bg-black/70 backdrop-blur-xl px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/80"
          >
            <Menu className="h-5 w-5" />
            <span>{getActiveFolderName()} ({activeId === null ? counts["__all__"] ?? 0 : activeId === "__none__" ? counts["__none__"] ?? 0 : counts[activeId] ?? 0})</span>
          </button>
          <button
            onClick={onCreate}
            className="rounded-xl border border-white/30 bg-black/70 backdrop-blur-xl p-2.5 text-white transition-colors hover:bg-black/80"
            title="Crear carpeta"
          >
            <FolderPlus className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer móvil */}
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed left-0 top-0 z-50 h-full w-80 bg-black border-r border-white/10 shadow-xl overflow-y-auto">
              <div className="sticky top-0 bg-black border-b border-white/10 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white uppercase tracking-wide">Carpetas</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-white hover:bg-white/10 transition-colors"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-2">
                {/* Botón crear carpeta */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onCreate();
                  }}
                  className="w-full flex items-center gap-2 rounded-xl border border-white/20 bg-black/50 px-4 py-3 text-white transition-colors hover:bg-white/10"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span className="text-sm">Crear carpeta</span>
                </button>

                {/* Todas */}
                <button
                  onClick={() => {
                    onSelect(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left text-white transition-colors ${
                    activeId === null ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 opacity-80" />
                    <span className="text-sm">Todas</span>
                  </span>
                  <span className="rounded-md bg-white/20 px-2 text-xs">{counts["__all__"] ?? 0}</span>
                </button>

                {/* Sin carpeta */}
                <button
                  onClick={() => {
                    onSelect("__none__");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left text-white transition-colors ${
                    activeId === "__none__" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 opacity-80" />
                    <span className="text-sm">Sin carpeta</span>
                  </span>
                  <span className="rounded-md bg-white/20 px-2 text-xs">{counts["__none__"] ?? 0}</span>
                </button>

                {/* Carpetas con la misma lógica del desktop */}
                {(() => {
                  const getChildren = (parentId: string | null): Folder[] => {
                    return folders.filter(f => f.parent_id === parentId);
                  };

                  const renderMobileFolder = (folder: Folder, level: number = 0): React.ReactNode => {
                    const isActive = activeId === folder.id;
                    const children = getChildren(folder.id);
                    const hasChildren = children.length > 0;
                    const isExpanded = expandedFolders.has(folder.id);

                    return (
                      <div key={folder.id}>
                        <div
                          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-white transition-colors ${
                            isActive ? "bg-white/20" : "hover:bg-white/10"
                          }`}
                          style={level > 0 ? { marginLeft: `${level * 1}rem` } : undefined}
                        >
                          {hasChildren ? (
                            <button
                              onClick={() => toggleExpand(folder.id)}
                              className="rounded p-0.5 text-white hover:bg-white/10 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-4" />
                          )}
                          <button
                            onClick={() => {
                              onSelect(folder.id);
                              setMobileMenuOpen(false);
                            }}
                            className="flex flex-1 items-center justify-between text-left"
                          >
                            <span className="flex items-center gap-2">
                              <FolderIcon className="h-4 w-4 opacity-70" />
                              <span className="text-sm">{folder.name}</span>
                            </span>
                            <span className="rounded-md bg-white/20 px-2 text-xs">
                              {counts[folder.id] ?? 0}
                            </span>
                          </button>
                        </div>
                        {hasChildren && isExpanded && (
                          <div>
                            {children.map(child => renderMobileFolder(child, level + 1))}
                          </div>
                        )}
                      </div>
                    );
                  };

                  const rootFolders = folders.filter(f => !f.parent_id);
                  return rootFolders.map(folder => renderMobileFolder(folder));
                })()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Vista desktop: sidebar */}
      <aside className="hidden w-full max-w-[240px] shrink-0 rounded-2xl border border-white/30 bg-black/70 backdrop-blur-xl pr-4 p-4 shadow-lg md:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wide uppercase opacity-80 text-white">Carpetas</h2>
          <button onClick={onCreate} className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/10">
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1">
        {/* Todas */}
        <button
          onClick={() => onSelect(null)}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-white transition-all duration-200 ${
            activeId === null ? "bg-white/20" : "hover:bg-white/10 hover:translate-y-[-2px] hover:shadow-lg"
          }`}
        >
          <span className="flex items-center gap-2">
            <FolderIcon className="h-4 w-4 opacity-80" />
            <span className="text-sm">Todas</span>
          </span>
          <span className="rounded-md bg-white/20 px-1.5 text-xs">{counts["__all__"] ?? 0}</span>
        </button>

        {/* Sin carpeta */}
        <button
          onClick={() => onSelect("__none__")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-white transition-all duration-200 ${
            activeId === "__none__" ? "bg-white/20" : "hover:bg-white/10 hover:translate-y-[-2px] hover:shadow-lg"
          }`}
        >
          <span className="flex items-center gap-2">
            <FolderIcon className="h-4 w-4 opacity-80" />
            <span className="text-sm">Sin carpeta</span>
          </span>
          <span className="rounded-md bg-white/20 px-1.5 text-xs">{counts["__none__"] ?? 0}</span>
        </button>

        {(() => {
          // Organizar carpetas en jerarquía con función recursiva para renderizar
          const getChildren = (parentId: string | null): Folder[] => {
            return folders.filter(f => f.parent_id === parentId);
          };

          const renderFolder = (folder: Folder, level: number = 0): React.ReactNode => {
            const isActive = activeId === folder.id;
            const isEditing = editingId === folder.id;
            const hasParent = !!folder.parent_id;
            const children = getChildren(folder.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedFolders.has(folder.id);
            
            return (
              <div key={folder.id}>
                <div
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-white transition-all duration-200 ${
                    isActive
                      ? "bg-white/20"
                      : "hover:bg-white/10 hover:translate-y-[-2px] hover:shadow-lg"
                  } ${hasParent ? "border-l-2 border-white/20" : ""}`}
                  style={hasParent ? { marginLeft: `${level * 1}rem` } : undefined}
                >
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-2" ref={editInputRef}>
                      <FolderIcon className="h-4 w-4 opacity-70" />
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(folder.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 rounded-md border border-white/30 bg-black/50 px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveEdit(folder.id);
                        }}
                        className="rounded p-1 text-white hover:bg-white/20 transition-colors"
                        title="Guardar"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                        className="rounded p-1 text-white hover:bg-white/20 transition-colors"
                        title="Cancelar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-1 items-center gap-1.5">
                        {hasChildren && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(folder.id);
                            }}
                            className="rounded p-0.5 text-white hover:bg-white/10 transition-colors"
                            title={isExpanded ? "Colapsar" : "Expandir"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        {!hasChildren && <div className="w-4" />}
                        <button
                          onClick={() => onSelect(folder.id)}
                          className="flex flex-1 items-center justify-between text-left"
                        >
                          <span className="flex items-center gap-2">
                            <FolderIcon className="h-4 w-4 opacity-70" />
                            <span className="text-sm">{folder.name}</span>
                          </span>
                          <span className="rounded-md bg-white/20 px-1.5 text-xs">
                            {counts[folder.id] ?? 0}
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(folder);
                            }}
                            className="rounded p-1 text-white hover:bg-white/20 transition-colors"
                            title="Editar nombre"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const taskCount = counts[folder.id] ?? 0;
                              const hasSubfolders = folders.some(sub => sub.parent_id === folder.id);
                              if (hasSubfolders) {
                                if (!confirm(`La carpeta "${folder.name}" contiene subcarpetas. Al eliminar, las subcarpetas también se eliminarán. ¿Deseas continuar?`)) {
                                  return;
                                }
                              }
                              if (taskCount > 0) {
                                const message = `La carpeta "${folder.name}" contiene ${taskCount} tarea${taskCount > 1 ? "s" : ""}.\n\nLas tareas se moverán automáticamente a "Sin carpeta" al eliminar.\n\n¿Deseas continuar?`;
                                if (!confirm(message)) {
                                  return;
                                }
                              } else {
                                if (!confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folder.name}"?`)) {
                                  return;
                                }
                              }
                              onDelete(folder.id);
                            }}
                            className="rounded p-1 text-white hover:bg-red-500/20 transition-colors"
                            title="Eliminar carpeta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {hasChildren && isExpanded && (
                  <div>
                    {children.map(child => renderFolder(child, level + 1))}
                  </div>
                )}
              </div>
            );
          };

          // Renderizar solo carpetas raíz
          const rootFolders = folders.filter(f => !f.parent_id);
          return rootFolders.map(folder => renderFolder(folder));
        })()}
      </nav>
      </aside>
    </>
  );
}


