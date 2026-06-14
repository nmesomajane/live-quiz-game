import useGameStore from "../store/gameStore.js";

export default function WinnerBanner() {
  const winnerInfo = useGameStore((s) => s.winnerInfo);
  const playerId   = useGameStore((s) => s.playerId);

  if (!winnerInfo) return null;

  const { winnerId, winnerName, answer } = winnerInfo;
  const isWinner  = winnerId === playerId;
  const hasWinner = !!winnerId;

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl
        backdrop-blur-sm animate-slide-up
        ${hasWinner ? "bg-lime/10 border border-lime/30" : "bg-red-500/10 border border-red-500/30"}
      `}
    >
      {hasWinner ? (
        <>
          <div className="text-5xl mb-3">{isWinner ? "🏆" : "🎉"}</div>
          <p className="font-display text-2xl font-extrabold text-lime mb-1">
            {isWinner ? "You Won!" : `${winnerName} wins!`}
          </p>
          <p className="text-muted text-sm font-body mb-4">+10 points awarded</p>
        </>
      ) : (
        <>
          <div className="text-5xl mb-3">⏰</div>
          <p className="font-display text-2xl font-extrabold text-red-400 mb-1">
            Time's Up!
          </p>
          <p className="text-muted text-sm font-body mb-4">Nobody got it this round</p>
        </>
      )}

      {/* Reveal the answer */}
      <div className="glass-card px-6 py-3 text-center">
        <p className="text-xs uppercase tracking-widest text-muted mb-1">The Answer</p>
        <p className="font-display text-xl font-bold text-light capitalize">{answer}</p>
      </div>

      <p className="mt-5 text-xs text-muted font-body animate-pulse">
        Next round starting soon…
      </p>
    </div>
  );
}