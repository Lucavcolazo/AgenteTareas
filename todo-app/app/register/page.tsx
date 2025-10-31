"use client";

export const dynamic = "force-dynamic";

// Página que muestra la misma tarjeta en modo registro
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { AuthCard } from "@/components/AuthCard";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = supabaseClient();

  // Si ya está autenticado, redirigir a home
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isMounted) {
        router.replace("/");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  return (
    <div className="min-h-dvh grid place-items-center bg-white px-4 text-black dark:bg-black dark:text-white">
      <div className="flex w-full max-w-3xl flex-col items-center">
        <h1 className="bg-gradient-to-b from-neutral-300 to-neutral-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl animate-drop">
          Crea tu cuenta
        </h1>
        <div className="mt-8 w-full animate-fade-up sm:mt-12" style={{ animationDelay: "600ms" }}>
          <AuthCard defaultMode="register" singleMode />
        </div>
      </div>
    </div>
  );
}


