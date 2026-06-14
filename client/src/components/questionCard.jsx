

import useGameStore from "../store/gameStore.js";

export default function QuestionCard() {
  const session = useGameStore((s) => s.session);

  if (!session) return null;

  const { question, status } = session;

  if (!question) {
    return (
      <div className="px-4 py-3 bg-card border border-border rounded-lg text-center">
        <p className="text-muted text-sm font-body">
          {status === "waiting"
            ? "Waiting for the game master to set a question…"
            : "No question set"}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-indigo/10 border border-indigo/30 rounded-lg animate-slide-up">
      <p className="text-xs uppercase tracking-widest text-indigo mb-1 font-body">
        Question
      </p>
      <p className="text-light font-body font-medium text-base leading-relaxed">
        {question}
      </p>
    </div>
  );
}