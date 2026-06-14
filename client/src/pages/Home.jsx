import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket.js";
import useGameStore from "../store/gameStore.js";

export default function Home() {
  const navigate = useNavigate();
  const { setPlayerName, setPlayerId, setSession, setError, error, clearError } =
    useGameStore();

  const [tab,     setTab]     = useState("create");
  const [name,    setName]    = useState("");
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Connect once and emit — no reconnection, no race conditions.
   * If already connected (user went back to home), disconnect first
   * so we get a clean single connection with one stable socket.id.
   */
  function connectAndEmit(event, payload, callback) {
    // If somehow already connected, disconnect cleanly first
    if (socket.connected) {
      socket.disconnect();
    }

    // Connect fresh
    socket.connect();

    socket.once("connect", () => {
      console.log("[Home] connected as", socket.id);
      setPlayerId(socket.id);
      socket.emit(event, payload, callback);
    });

    socket.once("connect_error", (err) => {
      setLoading(false);
      setError("Cannot reach server. Is it running on port 4000?");
      console.error("[Home] connect error:", err.message);
    });
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your name first");
    setLoading(true);
    clearError();

    connectAndEmit("create-session", { playerName: name.trim() }, (res) => {
      setLoading(false);
      if (!res.success) return setError(res.error);
      setPlayerName(name.trim());
      setSession(res.session);
      navigate("/lobby");
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your name");
    if (!code.trim()) return setError("Enter the room code");
    setLoading(true);
    clearError();

    connectAndEmit(
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
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="mb-10 text-center">
        <h1 className="font-display text-5xl font-extrabold text-light tracking-tight">
          Quiz<span className="text-indigo">Blitz</span>
        </h1>
        <p className="text-muted mt-2 text-sm font-body">
          Real-time guessing game for you and your crew
        </p>
      </div>

      <div className="glass-card w-full max-w-md p-8">
        {/* Tabs */}
        <div className="flex mb-8 bg-navy rounded-lg p-1 gap-1">
          {["create", "join"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); clearError(); }}
              className={`flex-1 py-2 rounded-md text-sm font-body font-medium transition-all duration-200 ${
                tab === t ? "bg-indigo text-white" : "text-muted hover:text-light"
              }`}
            >
              {t === "create" ? "Create Game" : "Join Game"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-body">
            {error}
          </div>
        )}

        {tab === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-body text-muted mb-1 uppercase tracking-widest">
                Your Name
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
              className="w-full bg-indigo hover:bg-indigo/80 text-white font-body font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Connecting…" : "Create Session"}
            </button>
          </form>
        )}

        {tab === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-body text-muted mb-1 uppercase tracking-widest">
                Your Name
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

      <p className="mt-6 text-muted text-xs font-body">
        Input code given
      </p>
    </div>
  );
}