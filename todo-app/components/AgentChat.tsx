"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Msg = { role: "user" | "assistant"; content: string };

export function AgentChat({ displayName, onTaskChange }: { displayName?: string | null; onTaskChange?: () => void }) {
  const supabase = supabaseClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Generar o recuperar session_id
  useEffect(() => {
    let stored = localStorage.getItem("agent_session_id");
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem("agent_session_id", stored);
    }
    setSessionId(stored);
  }, []);

  // Función para hacer scroll al final
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Cargar historial de mensajes
  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId || !mounted) return;

        const { data } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("user_id", userId)
          .eq("session_id", sessionId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        if (mounted && data) {
          setMessages(data as Msg[]);
        }
      } catch (err) {
        console.error("Error cargando historial:", err);
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId, supabase]);

  // Scroll al final cuando se cargan los mensajes o se agregan nuevos
  useEffect(() => {
    if (!loadingHistory && messages.length > 0) {
      // Pequeño delay para asegurar que el DOM se actualizó
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, loadingHistory, scrollToBottom]);

  // Guardar mensaje en BD
  const saveMessage = useCallback(
    async (role: "user" | "assistant", content: string) => {
      if (!sessionId) return;
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) return;

        await supabase.from("chat_messages").insert({
          user_id: userId,
          role,
          content,
          session_id: sessionId,
        });
      } catch (err) {
        console.error("Error guardando mensaje:", err);
      }
    },
    [sessionId, supabase]
  );

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    await saveMessage("user", text);
    // Hacer scroll al final después de agregar el mensaje del usuario
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();
      const assistantMsg: Msg = { role: "assistant", content: json.message ?? "" };
      setMessages((m) => [...m, assistantMsg]);
      await saveMessage("assistant", assistantMsg.content);
      // Hacer scroll al final después de agregar el mensaje del asistente
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      // Notificar cambios para refrescar tareas en el frontend
      if (onTaskChange) {
        setTimeout(() => onTaskChange(), 500);
      }
    } catch (err) {
      console.error("Error en chat:", err);
      setMessages((m) => [...m, { role: "assistant", content: "Error al procesar tu mensaje. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <div className="text-sm font-medium">Asistente de tareas</div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => {
              const newSessionId = crypto.randomUUID();
              setSessionId(newSessionId);
              localStorage.setItem("agent_session_id", newSessionId);
              setMessages([]);
            }}
            className="text-xs rounded-lg px-2 py-1 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
            title="Nueva conversación"
          >
            Nueva conversación
          </button>
        )}
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 space-y-4 overflow-auto px-4 py-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm opacity-60">Cargando historial…</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 text-lg opacity-60">👋 Hola, {displayName}!</div>
              <div className="text-sm opacity-50">Pregúntame sobre tus tareas o pídeme que haga algo.</div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm dark:bg-neutral-900">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400"></span>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            {/* Elemento invisible para hacer scroll automático */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Escribe una instrucción…"
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-300 bg-transparent px-4 py-2.5 text-sm outline-none transition-all focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 disabled:opacity-50 dark:border-neutral-700 dark:focus:border-neutral-600 dark:focus:ring-neutral-800"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90 dark:bg-white dark:text-black"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}


