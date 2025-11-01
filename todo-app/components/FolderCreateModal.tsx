"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import type { Tables } from "@/types/database";

type Folder = Tables["folders"]["Row"];

export function FolderCreateModal({ 
  open, 
  onClose, 
  onConfirm,
  folders = [],
}: { 
  open: boolean; 
  onClose: () => void; 
  onConfirm: (name: string, parentId: string | null) => void;
  folders?: Folder[];
}) {
  const [name, setName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setSelectedParentId(null);
    }
  }, [open]);

  // Función auxiliar para construir nombre jerárquico
  const getFolderDisplayName = (folder: Folder, allFolders: Folder[]): string => {
    if (!folder.parent_id) return folder.name;
    const parent = allFolders.find(f => f.id === folder.parent_id);
    if (!parent) return folder.name;
    return `${getFolderDisplayName(parent, allFolders)} > ${folder.name}`;
  };

  // Filtrar carpetas que no sean la misma (para evitar ciclos)
  const availableFolders = folders.filter(f => f.id !== selectedParentId);

  return (
    <Modal open={open} onClose={onClose} title="Nueva carpeta">
      <div className="p-6 md:p-8 space-y-5 md:space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-white md:text-base">Nombre de la carpeta</label>
          <input
            autoFocus
            placeholder="Ej: Matemáticas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) onConfirm(name.trim(), selectedParentId);
            }}
            className="w-full rounded-xl border border-white/20 bg-black/50 backdrop-blur-sm px-4 py-3 md:px-5 md:py-3.5 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 md:text-base"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white md:text-base">
            Carpeta padre (opcional)
          </label>
          <select
            value={selectedParentId || ""}
            onChange={(e) => setSelectedParentId(e.target.value || null)}
            className="w-full rounded-xl border border-white/20 bg-black/50 backdrop-blur-sm px-4 py-3 md:px-5 md:py-3.5 text-white outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 md:text-base"
          >
            <option value="">Ninguna (carpeta principal)</option>
            {availableFolders.map((f) => (
              <option key={f.id} value={f.id} className="bg-black text-white">
                {getFolderDisplayName(f, folders)}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-white/60 md:text-sm md:mt-2.5">
            {selectedParentId 
              ? `Se creará dentro de "${getFolderDisplayName(availableFolders.find(f => f.id === selectedParentId) || folders.find(f => f.id === selectedParentId)!, folders)}"` 
              : "Se creará como carpeta principal"}
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4 md:pt-6">
          <button 
            onClick={onClose} 
            className="rounded-xl border border-white/20 bg-black/50 px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base text-white transition-colors hover:bg-black/70"
          >
            Cancelar
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onConfirm(name.trim(), selectedParentId)}
            className="rounded-xl bg-white px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base font-medium text-black transition-opacity disabled:opacity-60 hover:opacity-90"
          >
            Crear
          </button>
        </div>
      </div>
    </Modal>
  );
}


