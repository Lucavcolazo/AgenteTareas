"use client";

export const dynamic = "force-dynamic";

// Pantalla de registro (solo sign up)

import { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = supabaseClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Algunas configuraciones requieren confirmar correo; mostramos aviso
    setMessage("Registro realizado. Revisa tu correo si se requiere confirmación.");
    setTimeout(() => router.replace("/login"), 1200);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white text-black dark:bg-black dark:text-white">
      <div className="w-full max-w-sm p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">Crear cuenta</h1>
        <form onSubmit={handleRegister} className="space-y-4">
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
            {loading ? "Registrando…" : "Registrarse"}
          </button>
        </form>
        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-green-600">{message}</p> : null}
        <p className="mt-4 text-sm opacity-70 text-center">
          ¿Ya tienes cuenta? <a href="/login" className="underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}


