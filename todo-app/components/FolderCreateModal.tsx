"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function FolderCreateModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (name: string) => void; }) {
  const [name, setName] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Nueva carpeta">
      <div className="space-y-3">
        <input
          autoFocus
          placeholder="Nombre de la carpeta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
          }}
          className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-700"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700">Cancelar</button>
          <button
            disabled={!name.trim()}
            onClick={() => onConfirm(name.trim())}
            className="rounded-xl bg-black px-3 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            Crear
          </button>
        </div>
      </div>
    </Modal>
  );
}


