import {sessionStore} from "../store/sessionStore.js";
import { startTimer, stopTimer } from "../utils/timer.js";


function resolveSession(socket) {
  // Primary path
  if (socket.sessionCode) {
    const session = sessionStore.getSession(socket.sessionCode);
    if (session) return session;
  }
  // Fallback: search all sessions for this socket.id
  const session = sessionStore.findSessionBySocketId(socket.id);
  if (session) {
    // Repair the sessionCode on the socket so future calls are fast
    socket.sessionCode = session.code;
    console.log(`[REPAIR] sessionCode restored for ${socket.id} → ${session.code}`);
  }
  return session || null;
}

export function gameHandler(io, socket) {

  socket.on("set-question", ({ question, answer }, callback) => {
    try {
      const session = resolveSession(socket);
      if (!session) return callback({ success: false, error: "Not in a session" });

      if (session.masterId !== socket.id)
        return callback({ success: false, error: "Only the game master can set questions" });

      if (!question || question.trim().length < 5)
        return callback({ success: false, error: "Question must be at least 5 characters" });

      if (!answer || answer.trim().length < 1)
        return callback({ success: false, error: "Answer cannot be empty" });

      sessionStore.setQuestion(session.code, question.trim(), answer.trim());
      console.log(`[QUESTION] ${session.code} — "${question}"`);

      io.to(session.code).emit("question-set", {
        question: question.trim(),
        message:  `${session.masterName} has set a question. Waiting for game to start...`,
      });

      callback({ success: true });
    } catch (err) {
      console.error("[SET-QUESTION ERROR]", err);
      callback({ success: false, error: "Failed to set question" });
    }
  });


  socket.on("start-game", (_, callback) => {
    try {
      const session = resolveSession(socket);
      if (!session) return callback({ success: false, error: "Not in a session" });

      if (session.masterId !== socket.id)
        return callback({ success: false, error: "Only the game master can start the game" });

      if (!session.question || !session.answer)
        return callback({ success: false, error: "Set a question before starting" });

      if (session.players.size < 3)
        return callback({ success: false, error: `Need at least 3 players. Currently: ${session.players.size}` });

      if (session.status === "active")
        return callback({ success: false, error: "Game is already in progress" });

      sessionStore.startGame(session.code);
      console.log(`[START] Session ${session.code} game started`);

      io.to(session.code).emit("game-started", {
        session:  sessionStore.serializeSession(session),
        message:  "Game has started! Submit your guesses.",
        timeLeft: 60,
      });

      startTimer(session, io, () => handleTimeExpired(io, session.code));
      callback({ success: true });
    } catch (err) {
      console.error("[START-GAME ERROR]", err);
      callback({ success: false, error: "Failed to start game" });
    }
  });


  socket.on("submit-guess", ({ guess }, callback) => {
    try {
      const session = resolveSession(socket);

      if (!session) {
        console.warn(`[GUESS REJECTED] socket ${socket.id} — no session found`);
        return callback({ success: false, error: "Not in a session" });
      }

      if (session.status !== "active")
        return callback({ success: false, error: "Game is not currently active" });

      if (session.masterId === socket.id)
        return callback({ success: false, error: "Game master cannot submit guesses" });

      if (!guess || guess.trim().length === 0)
        return callback({ success: false, error: "Guess cannot be empty" });

      const player = session.players.get(socket.id);
      if (!player) return callback({ success: false, error: "Player not found in session" });

      if (player.hasGuessedCorrectly)
        return callback({ success: false, error: "You already guessed correctly!" });

      if (player.attempts <= 0)
        return callback({ success: false, error: "You have no attempts remaining" });

      const result = sessionStore.processGuess(session.code, socket.id, guess.trim());
      if (result.error) return callback({ success: false, error: result.error });

      console.log(`[GUESS] ${player.name} → "${guess}" in ${session.code} — ${result.correct ? "✓ CORRECT" : "✗ WRONG"}`);

      io.to(session.code).emit("guess-submitted", {
        playerId:     socket.id,
        playerName:   player.name,
        guess:        guess.trim(),
        correct:      result.correct,
        attemptsLeft: result.attemptsLeft,
        message: result.correct
          ? `${player.name} guessed correctly! 🎉`
          : `${player.name} guessed "${guess.trim()}" — wrong! (${result.attemptsLeft} attempt${result.attemptsLeft !== 1 ? "s" : ""} left)`,
      });

      if (result.correct) {
        stopTimer(session);
        io.to(session.code).emit("game-won", {
          winnerId:   socket.id,
          winnerName: player.name,
          answer:     session.answer,
          session:    sessionStore.serializeSession(result.session),
          message:    `${player.name} got the right answer and wins 10 points! The answer was: "${session.answer}"`,
        });
        setTimeout(() => resetRound(io, session.code), 5000);
      }

      callback({ success: true, correct: result.correct, attemptsLeft: result.attemptsLeft });
    } catch (err) {
      console.error("[SUBMIT-GUESS ERROR]", err);
      callback({ success: false, error: "Failed to submit guess" });
    }
  });
}


function handleTimeExpired(io, code) {
  const session = sessionStore.getSession(code);
  if (!session || session.status === "ended") return;

  sessionStore.expireSession(code);
  console.log(`[EXPIRED] Session ${code} timed out`);

  io.to(code).emit("game-expired", {
    answer:  session.answer,
    session: sessionStore.serializeSession(session),
    message: `Time's up! Nobody guessed the answer. It was: "${session.answer}"`,
  });

  setTimeout(() => resetRound(io, code), 5000);
}


function resetRound(io, code) {
  const session = sessionStore.getSession(code);
  if (!session) return;

  if (session.players.size < 2) {
    io.to(code).emit("waiting-for-players", { message: "Not enough players for another round" });
    return;
  }

  const updated = sessionStore.rotateMaster(code);
  console.log(`[ROTATE] New master in ${code}: ${updated.masterName}`);

  io.to(code).emit("round-reset", {
    session: sessionStore.serializeSession(updated),
    message: `New round! ${updated.masterName} is now the game master. Waiting for a new question...`,
  });
}