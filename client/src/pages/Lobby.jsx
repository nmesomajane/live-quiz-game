import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket.js";
import useGameStore from "../store/gameStore.js";
import { useSocket } from "../hooks/useSocket.js";
import PlayerList from "../components/PlayerList.jsx";
import QuestionForm from "../components/QuestionForm.jsx";

export default function Lobby() {
  useSocket(); // keep socket listeners active on this page

  const navigate    = useNavigate();
  const session     = useGameStore((s) => s.session);
  const playerId    = useGameStore((s) => s.playerId);
  const resetSession = useGameStore((s) => s.resetSession);

 
  useEffect(() => {
    if (!session) navigate("/", { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const isMaster      = session.masterId === playerId;
  const questionReady = !!session.question;
//   const enoughPlayers = session.players.length >= 3;

  // Leave session 
  function handleLeave() {
    socket.emit("leave-session");
    resetSession();
    navigate("/");
  }

  // ── Copy room code ───────────────────────────────────────────────────────────
  function copyCode() {
    navigator.clipboard.writeText(session.code).catch(() => {});
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-navy flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="font-display text-xl font-extrabold text-light">
          Quiz<span className="text-indigo">Blitz</span>
        </span>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted font-body">
            {isMaster ? "👑 Game Master" : "🎮 Player"}
          </span>
          <button
            onClick={handleLeave}
            className="text-xs text-muted hover:text-red-400 font-body border border-border
              hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-all duration-200"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col md:flex-row gap-6 p-6 max-w-5xl mx-auto w-full">

        {/* ── LEFT: Controls / Status ── */}
        <div className="flex-1 flex flex-col gap-5">

          {/* Session header */}
          <div className="glass-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted font-body mb-1">
              Lobby
            </p>
            <h2 className="font-display text-2xl font-extrabold text-light mb-4">
              Waiting Room
            </h2>

            {/* Room code */}
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 bg-navy border border-border rounded-lg px-4 py-3">
                <p className="text-xs text-muted font-body mb-0.5">Room Code</p>
                <p className="font-display text-2xl font-extrabold text-indigo tracking-widest">
                  {session.code}
                </p>
              </div>
              <button
                onClick={copyCode}
                className="bg-card border border-border hover:border-indigo px-4 py-3
                  rounded-lg text-sm font-body text-muted hover:text-indigo
                  transition-all duration-200 h-full"
                title="Copy code"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-xs text-muted font-body">
              Share this code with friends to join
            </p>
          </div>

          {/* Status checklist */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-muted font-body mb-1">
              Before we start
            </p>

            <StatusRow
              done={session.players.length >= 3}
              text={`3+ players connected (${session.players.length} here)`}
            />
            <StatusRow
              done={questionReady}
              text={questionReady ? "Question is set ✓" : "Game master hasn't set a question yet"}
            />
          </div>

          {/* Master sees QuestionForm; players see a waiting message */}
          {isMaster ? (
            <div className="glass-card p-5">
              <QuestionForm />
            </div>
          ) : (
            <div className="glass-card p-5 text-center">
              <div className="text-3xl mb-3">⏳</div>
              <p className="text-light font-body font-medium">
                Waiting for <span className="text-indigo">{session.masterName}</span> to start
              </p>
              <p className="text-muted text-sm font-body mt-1">
                {questionReady
                  ? "Question is ready — game will start soon"
                  : "Game master is preparing a question…"}
              </p>

              {/* Live pulse dots */}
              <div className="flex justify-center gap-1.5 mt-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Player list ── */}
        <div className="w-full md:w-64 shrink-0">
          <div className="glass-card p-5 h-full">
            <PlayerList />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small helper component ───────────────────────────────────────────────────

function StatusRow({ done, text }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
          done ? "bg-lime text-navy" : "bg-card border border-border text-muted"
        }`}
      >
        {done ? "✓" : "·"}
      </span>
      <span
        className={`text-sm font-body ${done ? "text-light" : "text-muted"}`}
      >
        {text}
      </span>
    </div>
  );
}