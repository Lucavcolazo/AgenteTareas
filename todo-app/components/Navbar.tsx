"use client";

// Navbar con nombre de usuario, inicial en círculo y menú de ajustes

import { useState, useMemo } from "react";
import { LogOut } from "lucide-react";

export function Navbar({
  email,
  onSignOut,
  pageSize,
  onChangePageSize,
}: {
  email: string | null;
  onSignOut: () => void;
  pageSize: number;
  onChangePageSize: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = useMemo(() => email ?? "Usuario", [email]);
  const initial = (name || "U").charAt(0).toUpperCase();

  return (
    <nav className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold">To‑Do</h1>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 rounded-full border border-neutral-300 px-2 py-1.5 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          <span className="text-sm opacity-80 hidden sm:inline">{name}</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-200 text-black dark:bg-neutral-800 dark:text-white">
            {initial}
          </span>
        </button>
        {open ? (
          <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-2 text-sm shadow-lg dark:border-neutral-800 dark:bg-black">
            <div className="px-2 py-1.5 font-medium opacity-70">Ajustes</div>
            <div className="mt-1 rounded-lg px-2 py-2">
              <label className="mb-1 block opacity-70">Tareas por página</label>
              <select
                value={pageSize}
                onChange={(e) => onChangePageSize(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none dark:border-neutral-700"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n} className="bg-white text-black dark:bg-black dark:text-white">
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onSignOut}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}


