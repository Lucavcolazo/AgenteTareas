"use client";

export const dynamic = "force-dynamic";

// Pantalla de inicio de sesión (solo login)
// Estilo minimalista en blanco/negro

import { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = supabaseClient(); // crear cliente solo en el navegador
    // Solo login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.replace("/");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white text-black dark:bg-black dark:text-white">
      <div className="w-full max-w-sm p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">Iniciar sesión</h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-3 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Cargando…" : "Entrar"}
          </button>
        </form>
        {error ? (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        ) : null}
        <p className="mt-4 text-sm opacity-70 text-center">
          ¿No tienes cuenta? <a href="/register" className="underline">Regístrate</a>
        </p>
      </div>
    </div>
  );
}


