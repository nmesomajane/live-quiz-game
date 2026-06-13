

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket.js";
import useGameStore from "../store/gameStore.js";
import { useSocket } from "../hooks/useSocket.js";

export default function Home() {
  useSocket(); // register socket listeners early

  const navigate                        = useNavigate();
  const { setPlayerName, setPlayerId, setSession, setError, error } = useGameStore();

  const [tab,        setTab]        = useState("create"); // "create" | "join"
  const [name,       setName]       = useState("");
  const [code,       setCode]       = useState("");
  const [loading,    setLoading]    = useState(false);

  

  function connectSocket() {
    if (!socket.connected) socket.connect();
  }



  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your name first");
    setLoading(true);
    setError(null);

    connectSocket();

    // Wait for connection before emitting
    socket.once("connect", () => {
      setPlayerId(socket.id);
      socket.emit("create-session", { playerName: name.trim() }, (res) => {
        setLoading(false);
        if (!res.success) return setError(res.error);
        setPlayerName(name.trim());
        setSession(res.session);
        navigate("/lobby");
      });
    });

    // If already connected, emit directly
    if (socket.connected) {
      socket.off("connect"); // remove the once listener
      setPlayerId(socket.id);
      socket.emit("create-session", { playerName: name.trim() }, (res) => {
        setLoading(false);
        if (!res.success) return setError(res.error);
        setPlayerName(name.trim());
        setSession(res.session);
        navigate("/lobby");
      });
    }
  }

  // Join Session 

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your name");
    if (!code.trim()) return setError("Enter the room code");
    setLoading(true);
    setError(null);

    connectSocket();

    const emit = () => {
      setPlayerId(socket.id);
      socket.emit(
        "join-session",
        { playerName: name.trim(), code: code.toUpperCase().trim() },
        (res) => {
          setLoading(false);
          if (!res.success) return setError(res.error);
          setPlayerName(name.trim());
          setSession(res.session);
          navigate("/lobby");
        }
      );
    };

    if (socket.connected) {
      emit();
    } else {
      socket.once("connect", emit);
    }
  }



  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-5xl font-extrabold text-light tracking-tight">
          Quiz<span className="text-indigo">Blitz</span>
        </h1>
        <p className="text-muted mt-2 text-sm font-body">
          Real-time guessing game for you and your crew
        </p>
      </div>

      {/* Card */}
      <div className="glass-card w-full max-w-md p-8">

        {/* Tabs */}
        <div className="flex mb-8 bg-navy rounded-lg p-1 gap-1">
          {["create", "join"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-2 rounded-md text-sm font-body font-medium transition-all duration-200 ${
                tab === t
                  ? "bg-indigo text-white"
                  : "text-muted hover:text-light"
              }`}
            >
              {t === "create" ? "Create Game" : "Join Game"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-body animate-slide-up">
            {error}
          </div>
        )}

        {/* Create Form */}
        {tab === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-body text-muted mb-1 uppercase tracking-widest">
                User Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="e.g. QuantumKing"
                className="w-full bg-navy border border-border rounded-lg px-4 py-3 text-light font-body placeholder-muted focus:outline-none focus:border-indigo transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo hover:bg-indigo/80 text-white font-body font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 animate-pulse-ring"
            >
              {loading ? "Connecting…" : "Create Session"}
            </button>
          </form>
        )}

        {/* Join Form */}
        {tab === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-body text-muted mb-1 uppercase tracking-widest">
                User Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="e.g. NightFury"
                className="w-full bg-navy border border-border rounded-lg px-4 py-3 text-light font-body placeholder-muted focus:outline-none focus:border-indigo transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-body text-muted mb-1 uppercase tracking-widest">
                Room Code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="e.g. XK92"
                className="w-full bg-navy border border-border rounded-lg px-4 py-3 text-light font-body placeholder-muted focus:outline-none focus:border-indigo transition-colors uppercase tracking-widest text-center text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo hover:bg-indigo/80 text-white font-body font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Joining…" : "Join Session"}
            </button>
          </form>
        )}
      </div>

      
    </div>
  );
}