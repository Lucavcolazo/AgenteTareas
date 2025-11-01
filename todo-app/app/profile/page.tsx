"use client";

// Página de perfil del usuario con información y conexión a Google Calendar

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { GoogleCalendarButton } from "@/components/GoogleCalendarButton";
import { Spinner } from "@/components/Spinner";
import { ArrowLeft, Calendar, Mail, Clock, LogOut } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = supabaseClient();
  const [loading, setLoading] = useState(true);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    displayName: string;
    email: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      if (!isMounted) return;

      const metadata = user.user_metadata as Record<string, unknown> | undefined;
      const fullName = typeof metadata?.full_name === "string" ? metadata.full_name : undefined;
      const name = typeof metadata?.name === "string" ? metadata.name : undefined;
      const displayName = fullName || name || (user.email ? user.email.split("@")[0] : "Usuario");

      const connected = !!metadata?.google_calendar_tokens;
      setIsCalendarConnected(connected);

      // Formatear fecha de creación
      const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) : "Fecha no disponible";

      setUserInfo({
        displayName,
        email: user.email || "Sin email",
        createdAt,
      });
      setLoading(false);

      // Verificar si hay mensaje de conexión exitosa
      const params = new URLSearchParams(window.location.search);
      if (params.get("google_calendar_connected") === "true") {
        window.history.replaceState({}, "", window.location.pathname);
        // Recargar info después de un momento para actualizar el estado de Calendar
        setTimeout(() => {
          if (isMounted) {
            setIsCalendarConnected(true);
          }
        }, 1000);
      }
    })();

    // Verificar conexión periódicamente
    const checkConnection = setInterval(async () => {
      if (!isMounted) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const metadata = user.user_metadata as Record<string, unknown> | undefined;
        const connected = !!metadata?.google_calendar_tokens;
        setIsCalendarConnected(connected);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(checkConnection);
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Spinner />
      </div>
    );
  }

  if (!userInfo) return null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-4 py-4 md:py-8">
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 text-sm text-white opacity-70 hover:opacity-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>

        <div className="space-y-4 md:space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Perfil</h1>
            <p className="mt-1 text-sm text-white opacity-60">Información de tu cuenta</p>
          </div>

          <div className="space-y-4 rounded-xl border border-white/10 bg-black p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-semibold text-black">
              {userInfo.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">{userInfo.displayName}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-white opacity-60">
                <Mail className="h-4 w-4" />
                <span>{userInfo.email}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 text-sm text-white opacity-70">
              <Clock className="h-4 w-4" />
              <span>Cuenta creada el {userInfo.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-4 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-white opacity-70" />
            <h3 className="text-lg font-medium text-white">Google Calendar</h3>
          </div>
          <p className="mb-4 text-sm text-white opacity-60">
            Conecta tu cuenta de Google Calendar para agregar eventos automáticamente cuando creas tareas con fecha y hora.
          </p>
          <GoogleCalendarButton />
          {isCalendarConnected && (
            <p className="mt-3 text-sm text-green-400">
              ✓ Calendar conectado correctamente
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-4 md:p-6">
          <h3 className="mb-4 text-lg font-medium text-white">Sesión</h3>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400 bg-transparent px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-950"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

