"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export function AgentChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    const json = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: json.message ?? "" }]);
    setLoading(false);
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="mb-2 text-sm font-medium opacity-80">Asistente</div>
      <div className="flex-1 space-y-2 overflow-auto rounded-lg bg-black/5 p-2 dark:bg-white/5">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
            <span className="inline-block max-w-[90%] rounded-lg bg-white px-3 py-2 dark:bg-black">
              {m.content}
            </span>
          </div>
        ))}
        {loading ? <div className="text-xs opacity-60">Pensando…</div> : null}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribe una instrucción…"
          className="flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none dark:border-neutral-700"
        />
        <button onClick={send} className="rounded-lg bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black">
          Enviar
        </button>
      </div>
    </div>
  );
}


