

/**
 * Start the game timer for a session.
 *
 * @param {object}   session        - The session object (mutated directly)
 * @param {object}   io             - Socket.io server instance
 * @param {Function} onExpire       - Callback when time runs out
 */
export function startTimer(session, io, onExpire) {
  // Safety: clear any existing timer before starting a new one

  if (session.timer) {
    clearInterval(session.timer);
  }

  session.timeLeft = 60;

  session.timer = setInterval(() => {
    session.timeLeft -= 1;

    // Broadcast the tick to everyone in this room
 
    io.to(session.code).emit("timer-tick", { timeLeft: session.timeLeft });

    // Time is up
    if (session.timeLeft <= 0) {
      clearInterval(session.timer);
      session.timer = null;
      onExpire(); // Hand off to the game handler to resolve the session
    }
  }, 1000); // fires every 1000ms = 1 second
}

/**
 * Stop the timer early (e.g. when a player wins).
 *
 * @param {object} session - The session whose timer to stop
 */
export function stopTimer(session) {
  if (session.timer) {
    clearInterval(session.timer);
    session.timer = null;
  }
}

