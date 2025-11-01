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
      
      return () => {
        // Restaurar scroll al cerrar
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 md:p-4" 
      onClick={onClose}
      onTouchStart={(e) => {
        // Solo prevenir si se toca el fondo, no el modal
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="flex h-full w-full flex-col bg-black md:h-auto md:max-w-2xl md:rounded-2xl md:border md:border-white/10 md:shadow-xl"
        style={{ maxHeight: '100vh' }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {title ? (
          <div className="flex-shrink-0 border-b border-white/10 px-4 py-3 md:hidden flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}


