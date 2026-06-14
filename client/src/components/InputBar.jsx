import { useState } from "react";
import socket from "../socket/socket.js";
import useGameStore from "../store/gameStore.js";

export default function InputBar() {
  const session  = useGameStore((s) => s.session);
  const playerId = useGameStore((s) => s.playerId);
  const myPlayer = useGameStore((s) => s.myPlayer)();

  const [guess,      setGuess]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback,   setFeedback]   = useState(null); 

  if (!session) return null;

  const isMaster  = session.masterId === playerId;
  const isActive  = session.status === "active";
  const noAttempts = (myPlayer?.attempts ?? 0) <= 0;
  const alreadyWon = myPlayer?.hasGuessedCorrectly;

  // Master doesn't guess; show a label instead
  if (isMaster) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <p className="text-center text-muted text-sm font-body">
          👑 You are the game master , watch the players guess
        </p>
      </div>
    );
  }

  // Derive disabled reason
  let placeholder = "Type your guess and hit Enter…";
  let isDisabled  = !isActive || submitting;

  if (!isActive)    placeholder = "Waiting for game to start…";
  if (noAttempts)   { placeholder = "No attempts remaining"; isDisabled = true; }
  if (alreadyWon)   { placeholder = "You already got it! 🎉"; isDisabled = true; }

  function handleSubmit(e) {
    e.preventDefault();
    if (!guess.trim() || isDisabled) return;

    setSubmitting(true);
    setFeedback(null);

    socket.emit("submit-guess", { guess: guess.trim() }, (res) => {
      setSubmitting(false);
      if (!res.success) {
        setFeedback({ ok: false, text: res.error });
        return;
      }
      if (res.correct) {
        setFeedback({ ok: true, text: "Correct! 🎉" });
      } else {
        setFeedback({
          ok: false,
          text: `Wrong — ${res.attemptsLeft} attempt${res.attemptsLeft !== 1 ? "s" : ""} left`,
        });
      }
      setGuess("");
    });
  }

  return (
    <div className="px-4 py-3 border-t border-border flex flex-col gap-2">
      {/* Inline feedback line */}
      {feedback && (
        <p
          className={`text-xs font-body px-1 animate-slide-up ${
            feedback.ok ? "text-lime" : "text-red-400"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={guess}
          onChange={(e) => { setGuess(e.target.value); setFeedback(null); }}
          disabled={isDisabled}
          placeholder={placeholder}
          maxLength={100}
          className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5
            text-light font-body text-sm placeholder-muted
            focus:outline-none focus:border-indigo transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isDisabled || !guess.trim()}
          className="bg-indigo hover:bg-indigo/80 disabled:opacity-40 disabled:cursor-not-allowed
            text-white font-body font-semibold px-5 py-2.5 rounded-lg
            transition-all duration-200 text-sm shrink-0"
        >
          {submitting ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}