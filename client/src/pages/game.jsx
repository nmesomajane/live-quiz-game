import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket.js";
import useGameStore from "../store/gameStore.js";
// NO useSocket() here — registered once in App.jsx

import ChatWindow   from "../components/ChatWindow.jsx";
import InputBar     from "../components/InputBar.jsx";
import QuestionCard from "../components/questionCard.jsx";
import PlayerList   from "../components/PlayerList.jsx";
import Timer        from "../components/Timer.jsx";
import WinnerBanner from "../components/Winnerbanner.jsx";
import QuestionForm from "../components/QuestionForm.jsx";

export default function Game() {
  const navigate     = useNavigate();
  const session      = useGameStore((s) => s.session);
  const playerId     = useGameStore((s) => s.playerId);
  const resetSession = useGameStore((s) => s.resetSession);

  useEffect(() => {
    if (!session) navigate("/", { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) return null;

  const isMaster  = session.masterId === playerId;
  const isActive  = session.status === "active";
  const isWaiting = session.status === "waiting";

  function handleLeave() {
    socket.emit("leave-session");
    resetSession();
    navigate("/");
  }

  return (
    <div className="h-screen bg-navy flex flex-col overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <span className="font-display text-lg font-extrabold text-light">
          Quiz<span className="text-indigo">Blitz</span>
        </span>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-body px-3 py-1 rounded-full border ${
            isActive  ? "border-lime/40 bg-lime/10 text-lime"
            : isWaiting ? "border-indigo/40 bg-indigo/10 text-indigo"
            : "border-border bg-card text-muted"
          }`}>
            {isActive ? "● Live" : isWaiting ? "◌ Waiting" : "◌ Ended"}
          </span>
          <span className="text-xs text-muted font-body hidden sm:block">
            {isMaster ? "👑 Game Master" : "🎮 Player"}
          </span>
          <span className="text-xs font-display font-bold text-indigo tracking-widest bg-indigo/10 border border-indigo/20 px-3 py-1 rounded-lg">
            {session.code}
          </span>
          <button
            onClick={handleLeave}
            className="text-xs text-muted hover:text-red-400 font-body border border-border hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-all duration-200"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Chat area */}
        <div className="flex flex-col flex-1 min-h-0 border-r border-border relative">
          <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
            <QuestionCard />
          </div>

          <ChatWindow />

          {/* Winner banner overlays chat */}
          <div className="absolute inset-0 top-18 pointer-events-none">
            <div className="pointer-events-auto h-full relative">
              <WinnerBanner />
            </div>
          </div>

          <div className="shrink-0">
            <InputBar />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 flex flex-col overflow-y-auto bg-card/30">
          {isActive && (
            <div className="flex justify-center py-5 border-b border-border">
              <Timer />
            </div>
          )}

          <div className="p-4 border-b border-border">
            <PlayerList />
          </div>

          {isMaster && isWaiting && (
            <div className="p-4">
              <QuestionForm />
            </div>
          )}

          {!isMaster && isWaiting && (
            <div className="p-4 text-center">
              <p className="text-muted text-xs font-body">
                Waiting for <span className="text-indigo">{session.masterName}</span><br />
                to set the next question…
              </p>
              <div className="flex justify-center gap-1.5 mt-3">
                {[0,1,2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}