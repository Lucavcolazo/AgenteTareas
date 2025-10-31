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
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[320px] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur transition-all ${
              t.variant === "success"
                ? "border-green-300 bg-green-50/80 text-green-900 dark:border-green-800 dark:bg-green-950/80 dark:text-green-100"
                : t.variant === "error"
                ? "border-red-300 bg-red-50/80 text-red-900 dark:border-red-800 dark:bg-red-950/80 dark:text-red-100"
                : "border-neutral-200 bg-white/80 text-black dark:border-neutral-800 dark:bg-black/80 dark:text-white"
            }`}
          >
            <div className="font-medium">{t.title}</div>
            {t.description ? <div className="opacity-80">{t.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


