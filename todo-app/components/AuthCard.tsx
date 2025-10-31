"use client";

// Tarjeta con flip entre login y registro + botón Google

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "motion/react";
import DecryptedText from "@/components/DecryptedText";

export function AuthCard({
  defaultMode = "login",
  singleMode = false,
  onModeChange,
  animationKey = 0,
}: {
  defaultMode?: "login" | "register";
  singleMode?: boolean;
  onModeChange?: (mode: "login" | "register") => void;
  animationKey?: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const titleContainerRef = useRef<HTMLDivElement>(null);

  // Forzar animación del título cuando cambie el modo o animationKey
  useEffect(() => {
    if (titleContainerRef.current && singleMode) {
      // Pequeño delay para asegurar que el DOM se actualizó
      const timer = setTimeout(() => {
        const titleElement = titleContainerRef.current?.querySelector('span[class*="inline-block"]') as HTMLElement;
        if (titleElement) {
          // Disparar eventos mouseenter y mouseleave para activar la animación
          const enterEvent = new MouseEvent('mouseenter', { bubbles: true, cancelable: true });
          titleElement.dispatchEvent(enterEvent);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mode, animationKey, singleMode]);

  const handleModeChange = (newMode: "login" | "register") => {
    if (newMode === mode) return;
    setIsTransitioning(true);
    setError(null);
    
    // Notificar al componente padre para animar el texto
    if (onModeChange) {
      onModeChange(newMode);
    }
    
    // Cambiar modo después de un pequeño delay para la animación
    setTimeout(() => {
      setMode(newMode);
      setIsTransitioning(false);
    }, 100);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = supabaseClient();
    const authFn =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await authFn;
    setLoading(false);
    if (error) return setError(error.message);
    
    // Si es registro, mostrar mensaje
    if (mode === "register") {
      setError("Registro realizado. Si es necesario, confirma tu correo.");
      // Si el registro fue exitoso y no requiere confirmación, redirigir
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
      return;
    }
    
    // Si es login exitoso, redirigir a home (/)
    router.push("/");
    router.refresh();
  }

  async function signInWithGoogle() {
    const supabase = supabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  }

  // Renderizado con card mejorada para singleMode
  if (singleMode) {
    return (
      <div className="w-full max-w-md px-4 md:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur-sm p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900/80 md:p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="mb-6 text-center text-2xl font-semibold md:text-3xl">
                <div ref={titleContainerRef} id={`title-${mode}-${animationKey}`}>
                  <DecryptedText
                    key={`${mode}-${animationKey}`}
                    text={mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                    animateOn="both"
                    revealDirection="center"
                    speed={60}
                    maxIterations={30}
                    sequential={true}
                    className="text-neutral-900 dark:text-neutral-100"
                    encryptedClassName="opacity-40 text-neutral-900 dark:text-neutral-100"
                    parentClassName="cursor-default"
                  />
                </div>
              </h2>
              
              <form onSubmit={onSubmit} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <input
                    type="email"
                    placeholder="Correo"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isTransitioning}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none transition-all focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 disabled:opacity-50 dark:border-neutral-700 dark:focus:border-neutral-600 dark:focus:ring-neutral-800 md:text-base"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <input
                    type="password"
                    placeholder="Contraseña"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isTransitioning}
                    className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none transition-all focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 disabled:opacity-50 dark:border-neutral-700 dark:focus:border-neutral-600 dark:focus:ring-neutral-800 md:text-base"
                  />
                </motion.div>
                
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  disabled={loading || isTransitioning}
                  className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black md:text-base"
                >
                  {loading ? (mode === "login" ? "Entrando…" : "Registrando…") : mode === "login" ? "Entrar" : "Registrarse"}
                </motion.button>
                
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  onClick={signInWithGoogle}
                  disabled={isTransitioning}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800 md:text-base"
                >
                  {mode === "login" ? "Entrar con Google" : "Continuar con Google"}
                </motion.button>
              </form>
              
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 text-center text-sm text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-center text-sm opacity-70"
              >
                {mode === "login" ? (
                  <>
                    ¿No tienes cuenta?{" "}
                    <button
                      className="font-medium underline transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
                      onClick={() => handleModeChange("register")}
                      disabled={isTransitioning}
                    >
                      Regístrate
                    </button>
                  </>
                ) : (
                  <>
                    ¿Ya tienes cuenta?{" "}
                    <button
                      className="font-medium underline transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
                      onClick={() => handleModeChange("login")}
                      disabled={isTransitioning}
                    >
                      Inicia sesión
                    </button>
                  </>
                )}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-0 [perspective:1000px]">
      <div
        className={`relative mx-auto h-[360px] w-full max-w-[360px] transition-transform duration-500 [transform-style:preserve-3d] ${
          mode === "register" ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Cara Login */}
        <div className="absolute inset-0 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black [backface-visibility:hidden]">
          <h2 className="mb-4 text-center text-2xl font-semibold">Iniciar sesión</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Correo"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:focus:ring-neutral-600"
            />
            <input
              type="password"
              placeholder="Contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:focus:ring-neutral-600"
            />
            <button disabled={loading} className="w-full rounded-xl bg-black px-4 py-3 text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black">
              {loading ? "Entrando…" : "Entrar"}
            </button>
            <button type="button" onClick={signInWithGoogle} className="w-full rounded-xl border border-neutral-300 px-4 py-3 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900">
              Entrar con Google
            </button>
          </form>
          {error ? <p className="mt-3 text-center text-sm text-red-500">{error}</p> : null}
          <p className="mt-4 text-center text-sm opacity-70">
            ¿No tienes cuenta? <button className="underline" onClick={() => setMode("register")}>Regístrate</button>
          </p>
        </div>

        {/* Cara Registro */}
        <div className="absolute inset-0 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <h2 className="mb-4 text-center text-2xl font-semibold">Crear cuenta</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Correo"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:focus:ring-neutral-600"
            />
            <input
              type="password"
              placeholder="Contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:focus:ring-neutral-600"
            />
            <button disabled={loading} className="w-full rounded-xl bg-black px-4 py-3 text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black">
              {loading ? "Registrando…" : "Registrarse"}
            </button>
            <button type="button" onClick={signInWithGoogle} className="w-full rounded-xl border border-neutral-300 px-4 py-3 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900">
              Continuar con Google
            </button>
          </form>
          {error ? <p className="mt-3 text-center text-sm text-red-500">{error}</p> : null}
          <p className="mt-4 text-center text-sm opacity-70">
            ¿Ya tienes cuenta? <button className="underline" onClick={() => setMode("login")}>Inicia sesión</button>
          </p>
        </div>
      </div>
    </div>
  );
}


