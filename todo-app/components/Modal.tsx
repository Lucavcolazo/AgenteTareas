"use client";

// Modal básico centrado con fondo semitransparente

import { useEffect } from "react";

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string; }) {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      // Guardar el valor actual del overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Bloquear scroll
      document.body.style.overflow = "hidden";
      // Para móviles, también prevenir el touchmove en el fondo
      const preventTouchMove = (e: TouchEvent) => {
        if (e.target === document.body || e.target === document.documentElement) {
          e.preventDefault();
        }
      };
      document.addEventListener("touchmove", preventTouchMove, { passive: false });
      
      return () => {
        // Restaurar scroll al cerrar
        document.body.style.overflow = originalStyle;
        document.removeEventListener("touchmove", preventTouchMove);
      };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 md:p-4" 
      style={{ touchAction: 'none' }}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col bg-white dark:bg-black md:h-auto md:max-w-3xl md:rounded-2xl md:border md:border-neutral-200 md:shadow-xl dark:md:border-neutral-800"
        style={{ maxHeight: '100vh', touchAction: 'auto' }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          // Permitir scroll dentro del modal pero no en el fondo
          e.stopPropagation();
        }}
      >
        {title ? (
          <div className="flex-shrink-0 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 md:hidden">
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
        ) : null}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}


