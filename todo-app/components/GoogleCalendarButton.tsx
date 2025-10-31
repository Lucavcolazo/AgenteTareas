"use client";

// Botón para conectar/desconectar Google Calendar
import { useState, useEffect } from "react";
import { Calendar, Check } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useToast } from "./Toast";

export function GoogleCalendarButton() {
  const supabase = supabaseClient();
  const { show } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verificar si Google Calendar está conectado
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const metadata = user.user_metadata as Record<string, unknown> | undefined;
      const hasTokens = !!metadata?.google_calendar_tokens;
      
      if (mounted) setIsConnected(!!hasTokens);
    })();
    return () => { mounted = false; };
  }, [supabase]);

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/google-calendar/auth");
      const json = await res.json();
      
      if (json.authUrl) {
        // Abrir ventana de autorización
        window.location.href = json.authUrl;
      } else {
        show({
          title: "Error",
          description: json.error || "No se pudo iniciar la autorización",
          variant: "error",
        });
      }
    } catch (error) {
      show({
        title: "Error",
        description: "Error al conectar Google Calendar",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.auth.updateUser({
        data: { google_calendar_tokens: null },
      });

      if (error) throw error;

      setIsConnected(false);
      show({
        title: "Desconectado",
        description: "Google Calendar desconectado correctamente",
        variant: "success",
      });
    } catch (error) {
      show({
        title: "Error",
        description: "Error al desconectar Google Calendar",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={isConnected ? handleDisconnect : handleConnect}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900 disabled:opacity-50"
      title={isConnected ? "Desconectar Google Calendar" : "Conectar Google Calendar"}
    >
      {isConnected ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="hidden sm:inline">Calendar conectado</span>
        </>
      ) : (
        <>
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Conectar Calendar</span>
        </>
      )}
    </button>
  );
}

