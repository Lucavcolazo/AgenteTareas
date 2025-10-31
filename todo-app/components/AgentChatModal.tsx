"use client";

import { Modal } from "./Modal";
import { AgentChat } from "./AgentChat";

export function AgentChatModal({ open, onClose, displayName, onTaskChange }: { open: boolean; onClose: () => void; displayName?: string | null; onTaskChange?: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Asistente de tareas">
      <div className="flex h-full min-h-0 flex-col">
        <AgentChat displayName={displayName} onTaskChange={onTaskChange} onClose={onClose} />
      </div>
    </Modal>
  );
}


