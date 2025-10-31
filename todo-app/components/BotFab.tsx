"use client";

import { Bot } from "lucide-react";

export function BotFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir asistente"
      className="fixed bottom-5 right-5 z-30 grid h-12 w-12 place-items-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105 dark:bg-white dark:text-black"
    >
      <Bot className="h-6 w-6" />
    </button>
  );
}


