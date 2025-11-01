"use client";

// Spinner de carga animado
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative h-12 w-12">
        <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-white/20"></div>
        <div className="absolute top-0 left-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-white"></div>
      </div>
    </div>
  );
}

