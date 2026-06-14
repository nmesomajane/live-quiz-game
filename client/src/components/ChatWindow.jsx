import { useEffect, useRef } from "react";
import useGameStore from "../store/gameStore.js";
import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow() {
  const messages = useGameStore((s) => s.messages);
  const playerId = useGameStore((s) => s.playerId);
  const bottomRef = useRef(null);

  // Auto-scroll on every new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted text-sm font-body">
            Game chat will appear here…
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwnMessage={msg.playerId === playerId}
        />
      ))}

      {/* Invisible anchor — scrolled into view on new messages */}
      <div ref={bottomRef} />
    </div>
  );
}