"use client";

// Tarjeta con flip entre login y registro + botón Google

import { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export function AuthCard({
  defaultMode = "login",
  singleMode = false,
}: {
  defaultMode?: "login" | "register";
  singleMode?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (mode === "register") setError("Registro realizado. Si es necesario, confirma tu correo.");
  }

  async function signInWithGoogle() {
    const supabase = supabaseClient();
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }

  // Renderizado simple (inputs flotando sin card)
  if (singleMode) {
    return (
      <div className="w-full max-w-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder={mode === "login" ? "Correo" : "Correo"}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:focus:ring-neutral-600"
          />
          <input
            type="password"
            placeholder={mode === "login" ? "Contraseña" : "Contraseña"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:focus:ring-neutral-600"
          />
          <button disabled={loading} className="w-full rounded-xl bg-black px-4 py-3 text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black">
            {loading ? (mode === "login" ? "Entrando…" : "Registrando…") : mode === "login" ? "Entrar" : "Registrarse"}
          </button>
          <button type="button" onClick={signInWithGoogle} className="w-full rounded-xl border border-neutral-300 px-4 py-3 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900">
            {mode === "login" ? "Entrar con Google" : "Continuar con Google"}
          </button>
        </form>
        {error ? <p className="mt-3 text-center text-sm text-red-500">{error}</p> : null}
        <p className="mt-4 text-center text-sm opacity-70">
          {mode === "login" ? (
            <>¿No tienes cuenta? <button className="underline" onClick={() => setMode("register")}>Regístrate</button></>
          ) : (
            <>¿Ya tienes cuenta? <button className="underline" onClick={() => setMode("login")}>Inicia sesión</button></>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="[perspective:1000px]">
      <div
        className={`relative h-[360px] w-[360px] transition-transform duration-500 [transform-style:preserve-3d] ${
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


