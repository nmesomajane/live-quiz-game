import useGameStore from "../store/gameStore.js";

const RADIUS        = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Timer() {
  const timeLeft = useGameStore((s) => s.timeLeft);
  const session  = useGameStore((s) => s.session);

  if (session?.status !== "active") return null;

  const progress = timeLeft / 60;
  const offset   = CIRCUMFERENCE * (1 - progress);
  const isUrgent = timeLeft <= 10;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          {/* Track */}
          <circle
            cx="32" cy="32" r={RADIUS}
            fill="none"
            stroke="#2A2D3E"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <circle
            cx="32" cy="32" r={RADIUS}
            fill="none"
            stroke={isUrgent ? "#ef4444" : "#6C63FF"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
          />
        </svg>

        {/* Number in the centre */}
        <span
          className={`absolute inset-0 flex items-center justify-center font-display font-bold text-lg ${
            isUrgent ? "text-red-400" : "text-light"
          }`}
        >
          {timeLeft}
        </span>
      </div>
      <span className="text-xs text-muted font-body">seconds</span>
    </div>
  );
}