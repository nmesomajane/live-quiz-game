

export default function MessageBubble({ message, isOwnMessage }) {
  const { type, text, playerName, correct } = message;

  //  System / info messages 
  if (type === "system") {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs text-muted font-body bg-card px-3 py-1 rounded-full border border-border">
          {text}
        </span>
      </div>
    );
  }

  if (type === "info") {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs text-indigo font-body bg-indigo/10 px-3 py-1.5 rounded-full border border-indigo/20 max-w-xs text-center">
          {text}
        </span>
      </div>
    );
  }

  //  Win banner 
  if (type === "win") {
    return (
      <div className="my-2 px-4 py-3 bg-lime/10 border border-lime/30 rounded-lg animate-slide-up">
        <p className="text-lime text-sm font-body font-semibold text-center">{text}</p>
      </div>
    );
  }

  //  Expired banner 
  if (type === "expired") {
    return (
      <div className="my-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-slide-up">
        <p className="text-red-400 text-sm font-body font-semibold text-center">{text}</p>
      </div>
    );
  }

  //  Guess bubble 
  const alignRight = isOwnMessage;

  return (
    <div
      className={`flex flex-col gap-0.5 animate-slide-up ${
        alignRight ? "items-end" : "items-start"
      }`}
    >
      {/* Player name */}
      {!alignRight && (
        <span className="text-xs text-muted font-body ml-1">{playerName}</span>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm font-body leading-relaxed ${
          correct
            ? "bg-lime text-navy font-semibold"
            : alignRight
            ? "bg-indigo text-white"
            : "bg-card border border-border text-light"
        } ${
          alignRight ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
      >
        {/* Show just the guess text*/}
        {playerName}'s guess: <span className="font-semibold">{message.guess}</span>
        {correct && <span className="ml-1">✓</span>}
      </div>

      {/* Wrong guess: show attempts left */}
      {!correct && message.attemptsLeft !== undefined && (
        <span className={`text-xs text-muted font-body ${alignRight ? "mr-1" : "ml-1"}`}>
          {message.attemptsLeft} attempt{message.attemptsLeft !== 1 ? "s" : ""} left
        </span>
      )}
    </div>
  );
}