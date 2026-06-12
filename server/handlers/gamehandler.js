

import { sessionStore } from "../store/sessionStore.js";
import { startTimer, stopTimer } from "../utils/timer.js";

/**
 * Register game-related socket event listeners.
 *
 * @param {object} io     - Socket.io server instance
 * @param {object} socket - Individual client socket
 */
export function gameHandler(io, socket) {

 
  socket.on("set-question", ({ question, answer }, callback) => {
    try {
      const code = socket.sessionCode;
      if (!code) return callback({ success: false, error: "Not in a session" });

      const session = getSession(code);
      if (!session) return callback({ success: false, error: "Session not found" });

      // Authorization check — only the master can set questions
      if (session.masterId !== socket.id) {
        return callback({ success: false, error: "Only the game master can set questions" });
      }

      // Validate inputs
      if (!question || question.trim().length < 5) {
        return callback({ success: false, error: "Question must be at least 5 characters" });
      }
      if (!answer || answer.trim().length < 1) {
        return callback({ success: false, error: "Answer cannot be empty" });
      }
      if (question.trim().length > 500) {
        return callback({ success: false, error: "Question is too long (max 500 chars)" });
      }

      // Store question and answer (answer stored lowercase for comparison)
      setQuestion(code, question.trim(), answer.trim());

      console.log(`[QUESTION] ${code} — "${question}"`);

      // Broadcast to room: players see the question is ready.
      
      io.to(code).emit("question-set", {
        question: question.trim(),
        message: `${session.masterName} has set a question. Waiting for game to start...`,
      });

      callback({ success: true });

    } catch (err) {
      console.error("[SET-QUESTION ERROR]", err);
      callback({ success: false, error: "Failed to set question" });
    }
  });



  socket.on("start-game", (_, callback) => {
    try {
      const code = socket.sessionCode;
      if (!code) return callback({ success: false, error: "Not in a session" });

      const session = getSession(code);
      if (!session) return callback({ success: false, error: "Session not found" });

      // Authorization
      if (session.masterId !== socket.id) {
        return callback({ success: false, error: "Only the game master can start the game" });
      }

      // Must have a question set
      if (!session.question || !session.answer) {
        return callback({ success: false, error: "Set a question before starting" });
      }

     
      if (session.players.size < 3) {
        return callback({
          success: false,
          error: `Need at least 3 players to start. Currently: ${session.players.size}`,
        });
      }

    
      if (session.status === "active") {
        return callback({ success: false, error: "Game is already in progress" });
      }

     
      startGame(code);

      console.log(`[START] Session ${code} game started`);

   
      io.to(code).emit("game-started", {
        session: serializeSession(session),
        message: "Game has started! Submit your guesses.",
        timeLeft: 60,
      });

    
      startTimer(session, io, () => handleTimeExpired(io, code));

      callback({ success: true });

    } catch (err) {
      console.error("[START-GAME ERROR]", err);
      callback({ success: false, error: "Failed to start game" });
    }
  });



  socket.on("submit-guess", ({ guess }, callback) => {
    try {
      const code = socket.sessionCode;
      if (!code) return callback({ success: false, error: "Not in a session" });

      const session = getSession(code);
      if (!session) return callback({ success: false, error: "Session not found" });

      // Game must be active
      if (session.status !== "active") {
        return callback({ success: false, error: "Game is not currently active" });
      }

      // Game master doesn't guess — they set the question
      if (session.masterId === socket.id) {
        return callback({ success: false, error: "Game master cannot submit guesses" });
      }

      // Validate guess input
      if (!guess || guess.trim().length === 0) {
        return callback({ success: false, error: "Guess cannot be empty" });
      }

      const player = session.players.get(socket.id);
      if (!player) return callback({ success: false, error: "Player not found" });

      // Requirement: player cannot guess if they already got it right
      if (player.hasGuessedCorrectly) {
        return callback({ success: false, error: "You already guessed correctly!" });
      }

      // Requirement: player cannot guess if out of attempts
      if (player.attempts <= 0) {
        return callback({ success: false, error: "You have no attempts remaining" });
      }

      // Process the guess (checks answer, updates attempts/score)
      const result = processGuess(code, socket.id, guess.trim());

      if (result.error) {
        return callback({ success: false, error: result.error });
      }

      console.log(
        `[GUESS] ${player.name} guessed "${guess}" in ${code} — ${result.correct ? "CORRECT" : "WRONG"}`
      );

   
      io.to(code).emit("guess-submitted", {
        playerId: socket.id,
        playerName: player.name,
        guess: guess.trim(),
        correct: result.correct,
        attemptsLeft: result.attemptsLeft,
        // Chat message: show in the game chat feed
        message: result.correct
          ? `${player.name} guessed correctly! 🎉`
          : `${player.name} guessed "${guess.trim()}" — wrong! (${result.attemptsLeft} attempts left)`,
      });

      if (result.correct) {
       
        stopTimer(session);

        // Broadcast winner to everyone in the room
        io.to(code).emit("game-won", {
          winnerId: socket.id,
          winnerName: player.name,
          answer: session.answer,   // Now we can reveal the answer
          session: serializeSession(result.session),
          message: `${player.name} got the right answer and wins 10 points! The answer was: "${session.answer}"`,
        });

        
        setTimeout(() => resetRound(io, code), 5000);
      }

      callback({ success: true, correct: result.correct, attemptsLeft: result.attemptsLeft });

    } catch (err) {
      console.error("[SUBMIT-GUESS ERROR]", err);
      callback({ success: false, error: "Failed to submit guess" });
    }
  });
}


/**
 * HANDLE TIME EXPIRED
 *
 * @param {object} io   - Socket.io server instance
 * @param {string} code - Room code of the session that timed out
 */
export function handleTimeExpired(io, code) {
  const session = getSession(code);
  if (!session) return;

  // Don't expire if someone already won 
  if (session.status === "ended") return;

  // Mark session as ended with no winner
  expireSession(code);

  console.log(`[EXPIRED] Session ${code} timed out`);

  //  reveal answer, no winner, no points
  io.to(code).emit("game-expired", {
    answer: session.answer,     // Reveal the answer they couldn't get
    session: serializeSession(session),
    message: `Time's up! Nobody guessed the answer. It was: "${session.answer}"`,
  });

  // Schedule round reset after 5 seconds
  setTimeout(() => resetRound(io, code), 5000);
}


/**
 * RESET ROUND
 *
 * Rotates the game master.
 *
 * @param {object} io   - Socket.io server instance
 * @param {string} code - Room code
 */
export function resetRound(io, code) {
  const session = getSession(code);
  if (!session) return;

  if (session.players.size < 2) {
    io.to(code).emit("waiting-for-players", {
      message: "Not enough players for another round",
    });
    return;
  }

  const updatedSession = rotateMaster(code);

  console.log(`[ROTATE] New master in ${code}: ${updatedSession.masterName}`);


  io.to(code).emit("round-reset", {
    session: serializeSession(updatedSession),
    message: `New round! ${updatedSession.masterName} is now the game master. Waiting for a new question...`,
  });
}
