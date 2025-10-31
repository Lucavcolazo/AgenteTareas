"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { AuthCard } from "@/components/AuthCard";

export default function LoginPage() {
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
    <div className="min-h-dvh grid place-items-center bg-white text-black dark:bg-black dark:text-white">
      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <h1 className="bg-gradient-to-b from-neutral-300 to-neutral-600 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent sm:text-7xl animate-drop-slow">
          Bienvenido
        </h1>
        <div className="mt-12 animate-fade-up" style={{ animationDelay: "800ms" }}>
          <AuthCard defaultMode="login" singleMode />
        </div>
      </div>
    </div>
  );
}


