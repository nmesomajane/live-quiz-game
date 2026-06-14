
import useGameStore from "../store/gameStore.js";

export default function PlayerList() {
  const session  = useGameStore((s) => s.session);
  const playerId = useGameStore((s) => s.playerId);

  if (!session) return null;

  const isGameActive = session.status === "active" || session.status === "ended";

  
  const players = isGameActive
    ? [...session.players].sort((a, b) => b.score - a.score)
    : session.players;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-muted font-body mb-1">
        Players · {players.length}
      </p>

      {players.map((player) => {
        const isMe     = player.id === playerId;
        const isMaster = player.id === session.masterId;

        return (
          <div
            key={player.id}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-300 ${
              isMe
                ? "border-indigo/50 bg-indigo/10"
                : "border-border bg-card"
            }`}
          >
            {/* Left: crown + name */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base leading-none shrink-0">
                {isMaster ? "👑" : "🎮"}
              </span>
              <span
                className={`text-sm font-body truncate ${
                  isMe ? "text-indigo font-semibold" : "text-light"
                }`}
              >
                {player.name}
                {isMe && (
                  <span className="ml-1.5 text-xs text-muted font-normal">(you)</span>
                )}
              </span>
            </div>

            {/* Right: score + attempts */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Attempt dots — only during active game */}
              {session.status === "active" && !isMaster && (
                <div className="flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < (player.attempts ?? 3) ? "bg-lime" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              )}
              <span
                className={`text-sm font-display font-bold min-w-8 text-right ${
                  player.score > 0 ? "text-lime" : "text-muted"
                }`}
              >
                {player.score}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}