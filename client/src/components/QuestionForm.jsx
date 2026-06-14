import { useState } from "react";
import socket from "../socket/socket.js";
import useGameStore from "../store/gameStore.js";

/**
 * QUESTION FORM — Game Master Panel
 * Only visible to the game master while in the lobby (waiting for game to start).
 */
export default function QuestionForm() {
  const session  = useGameStore((s) => s.session);
  const playerId = useGameStore((s) => s.playerId);


  const [question,     setQuestion]     = useState("");
  const [answer,       setAnswer]       = useState("");
  const [showAnswer,   setShowAnswer]   = useState(false);
  const [qLoading,     setQLoading]     = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [feedback,     setFeedback]     = useState(null);

  if (!session) return null;

  const isMaster     = session.masterId === playerId;
  const isWaiting    = session.status === "waiting";
  const questionSet  = !!session.question;
  const enoughPlayers = session.players.length >= 3;



  // Only render for the master during the waiting phase
  if (!isMaster || !isWaiting) return null;


  function handleSetQuestion(e) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      return setFeedback({ ok: false, text: "Both question and answer are required" });
    }
    setQLoading(true);
    setFeedback(null);

    socket.emit("set-question", { question: question.trim(), answer: answer.trim() }, (res) => {
      setQLoading(false);
      if (!res.success) return setFeedback({ ok: false, text: res.error });
      setFeedback({ ok: true, text: "Question set! Start the game when ready." });
      // Keep the fields so master can see what they typed
    });
  }

  // ── Start game 
  function handleStartGame() {
    setStartLoading(true);
    setFeedback(null);

    socket.emit("start-game", {}, (res) => {
      setStartLoading(false);
      if (!res.success) setFeedback({ ok: false, text: res.error });
    
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted font-body mb-3">
          Master Controls
        </p>

        {/* Feedback */}
        {feedback && (
          <div
            className={`mb-3 px-3 py-2 rounded-lg text-xs font-body animate-slide-up ${
              feedback.ok
                ? "bg-lime/10 border border-lime/30 text-lime"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Question input */}
        <form onSubmit={handleSetQuestion} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-muted font-body mb-1">Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="What is the capital of Nigeria?"
              className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-light
                font-body text-sm placeholder-muted resize-none
                focus:outline-none focus:border-indigo transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-muted font-body mb-1">
              Answer
              <span className="ml-1 text-indigo">(hidden from players)</span>
            </label>
            <div className="relative">
              <input
                type={showAnswer ? "text" : "password"}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={50}
                placeholder="Abuja"
                className="w-full bg-navy border border-border rounded-lg px-3 py-2 pr-10
                  text-light font-body text-sm placeholder-muted
                  focus:outline-none focus:border-indigo transition-colors"
              />
              {/* Toggle answer visibility */}
              <button
                type="button"
                onClick={() => setShowAnswer((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-light
                  text-xs font-body transition-colors"
              >
                {showAnswer ? "hide" : "show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={qLoading}
            className="w-full bg-card border border-indigo/40 hover:border-indigo text-indigo
              font-body font-semibold py-2 rounded-lg text-sm transition-all duration-200
              disabled:opacity-50"
          >
            {qLoading ? "Setting…" : questionSet ? "Update Question" : "Set Question"}
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Start game button */}
      <div>
        {!enoughPlayers && (
          <p className="text-xs text-muted font-body mb-2 text-center">
            Need {3 - session.players.length} more player{3 - session.players.length !== 1 ? "s" : ""} to start
          </p>
        )}
        <button
          onClick={handleStartGame}
          disabled={!questionSet || !enoughPlayers || startLoading}
          className="w-full bg-lime hover:bg-lime/80 text-navy font-display font-bold
            py-3 rounded-lg text-sm transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {startLoading ? "Starting…" : "🚀 Start Game"}
        </button>
      </div>
    </div>
  );
}