"use client";

// Toast minimalista: Provider + hook + contenedor superior derecha

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
};

type ToastContextType = {
  show: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((t: Omit<Toast, "id">) => {
    const toast: Toast = { id: crypto.randomUUID(), ...t };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== toast.id)), 2800);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toasts removidos */}
    </ToastContext.Provider>
  );
}


