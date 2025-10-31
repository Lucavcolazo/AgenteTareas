"use client";

import { Modal } from "./Modal";
import { AgentChat } from "./AgentChat";

export function AgentChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Asistente de tareas">
      <div className="h-[72vh] w-full">
        <AgentChat />
      </div>
    </Modal>
  );
}


