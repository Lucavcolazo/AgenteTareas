"use client";

export const dynamic = "force-dynamic";

// Página que muestra la misma tarjeta en modo registro
import { AuthCard } from "@/components/AuthCard";

export default function RegisterPage() {
  return (
    <div className="min-h-dvh grid place-items-center bg-white text-black dark:bg-black dark:text-white">
      <div className="flex w-full max-w-3xl flex-col items-center">
        <h1 className="bg-gradient-to-b from-neutral-300 to-neutral-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl animate-drop">
          Crea tu cuenta
        </h1>
        <div className="mt-12 animate-fade-up" style={{ animationDelay: "600ms" }}>
          <AuthCard defaultMode="register" singleMode />
        </div>
      </div>
    </div>
  );
}


