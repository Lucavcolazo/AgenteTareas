"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { AuthCard } from "@/components/AuthCard";
import DecryptedText from "@/components/DecryptedText";

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [animationKey, setAnimationKey] = useState(0);

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

  const handleModeChange = (newMode: "login" | "register") => {
    if (newMode !== mode) {
      // Cambiar el modo y forzar nueva animación en la card
      setMode(newMode);
      setAnimationKey((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center bg-white px-4 text-black dark:bg-black dark:text-white">
      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <h1 className="whitespace-nowrap text-3xl font-mono font-semibold tracking-wide text-neutral-800 dark:text-neutral-200 sm:text-5xl md:text-6xl">
          <DecryptedText
            text="Bienvenido a Task IA"
            animateOn="view"
            revealDirection="center"
            speed={80}
            maxIterations={25}
            sequential={true}
            className="text-neutral-800 dark:text-neutral-200"
            encryptedClassName="opacity-40 text-neutral-800 dark:text-neutral-200"
          />
        </h1>
        <div className="mt-8 w-full sm:mt-12">
          <AuthCard 
            defaultMode="login" 
            singleMode 
            onModeChange={handleModeChange}
            animationKey={animationKey}
          />
        </div>
      </div>
    </div>
  );
}


