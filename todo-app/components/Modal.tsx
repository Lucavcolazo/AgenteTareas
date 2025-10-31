"use client";

// Modal básico centrado con fondo semitransparente

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? <h3 className="mb-4 text-lg font-semibold">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}


