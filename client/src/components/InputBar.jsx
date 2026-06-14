import { useState } from "react";
import socket from "../socket/socket.js";
import useGameStore from "../store/gameStore.js";

export default function InputBar() {
  const session  = useGameStore((s) => s.session);
  const playerId = useGameStore((s) => s.playerId);

  const [guess,      setGuess]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback,   setFeedback]   = useState(null);

  if (!session) return null;

  const myId     = socket.id || playerId;
  const isMaster = session.masterId === myId;
  const isActive = session.status === "active";
  const myPlayer = session.players?.find((p) => p.id === myId || p.id === playerId);
  const noAttempts = (myPlayer?.attempts ?? 3) <= 0;
  const alreadyWon = myPlayer?.hasGuessedCorrectly ?? false;

  if (isMaster) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <p className="text-center text-muted text-sm font-body">
          👑 You are the game master — watch the players guess
        </p>
      </div>
    );
  }

  const isDisabled = submitting || noAttempts || alreadyWon;

  let placeholder = isActive
    ? "Type your guess and hit Enter…"
    : "Waiting for game to start…";
  if (noAttempts) placeholder = "No attempts remaining ❌";
  if (alreadyWon) placeholder = "You already got it! 🎉";

  // Centralised send — called by both button click AND Enter key
  function sendGuess() {
    const trimmed = guess.trim();
    if (!trimmed || submitting) return;

    if (!socket.connected) {
      setFeedback({ ok: false, text: "⚠ Not connected to server" });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    socket.emit("submit-guess", { guess: trimmed }, (res) => {
      setSubmitting(false);
      if (!res?.success) {
        setFeedback({ ok: false, text: res?.error ?? "Server did not respond" });
        return;
      }
      setFeedback(
        res.correct
          ? { ok: true,  text: "Correct! 🎉" }
          : { ok: false, text: `Wrong — ${res.attemptsLeft} attempt${res.attemptsLeft !== 1 ? "s" : ""} left` }
      );
      setGuess("");
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendGuess();
    }
  }

  return (
    <div className="px-4 py-3 border-t border-border flex flex-col gap-2">
      {feedback && (
        <p className={`text-xs font-body px-1 ${feedback.ok ? "text-lime" : "text-red-400"}`}>
          {feedback.text}
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={guess}
          onChange={(e) => { setGuess(e.target.value); setFeedback(null); }}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={placeholder}
          maxLength={100}
          autoFocus
          className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5
            text-light font-body text-sm placeholder-muted
            focus:outline-none focus:border-indigo transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <button
          onClick={sendGuess}
          disabled={isDisabled || !guess.trim()}
          className="bg-indigo hover:bg-indigo/80 disabled:opacity-40 disabled:cursor-not-allowed
            text-white font-body font-semibold px-5 py-2.5 rounded-lg
            transition-all duration-200 text-sm shrink-0"
        >
          {submitting ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}