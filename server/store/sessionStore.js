const sessions = new Map();

export const sessionStore = {
  createSession(code, masterId, masterName) {
    const session = {
      code, masterId, masterName,
      players: new Map(),
      question: null, answer: null,
      status: "waiting", timer: null,
      winnerId: null, timeLeft: 60,
    };
    session.players.set(masterId, {
      id: masterId, name: masterName,
      score: 0, attempts: 3,
      hasGuessedCorrectly: false, isMaster: true,
    });
    sessions.set(code, session);
    return session;
  },

  getSession(code) {
    return sessions.get(code);
  },

  /**
   * FIND SESSION BY SOCKET ID
   * Searches all sessions for a socket. Used as fallback when
   * socket.sessionCode is undefined (e.g. after reconnect).
   */
  findSessionBySocketId(socketId) {
    for (const session of sessions.values()) {
      if (session.players.has(socketId)) return session;
      if (session.masterId === socketId)  return session;
    }
    return null;
  },

  addPlayer(code, playerId, playerName) {
    const session = sessions.get(code);
    if (!session) return null;
    session.players.set(playerId, {
      id: playerId, name: playerName,
      score: 0, attempts: 3,
      hasGuessedCorrectly: false, isMaster: false,
    });
    return session;
  },

  removePlayer(code, playerId) {
    const session = sessions.get(code);
    if (!session) return null;
    session.players.delete(playerId);
    return session;
  },

  setQuestion(code, question, answer) {
    const session = sessions.get(code);
    if (!session) return null;
    session.question = question;
    session.answer   = answer.toLowerCase().trim();
    return session;
  },

  startGame(code) {
    const session = sessions.get(code);
    if (!session) return null;
    session.status   = "active";
    session.timeLeft = 60;
    session.winnerId = null;
    session.players.forEach((p) => {
      p.attempts = 3;
      p.hasGuessedCorrectly = false;
    });
    return session;
  },

  processGuess(code, playerId, guess) {
    const session = sessions.get(code);
    if (!session) return { error: "Session not found" };
    const player = session.players.get(playerId);
    if (!player)  return { error: "Player not found" };
    if (player.hasGuessedCorrectly) return { error: "You already guessed correctly" };
    if (player.attempts <= 0)       return { error: "No attempts remaining" };

    const isCorrect = guess.toLowerCase().trim() === session.answer;
    player.attempts -= 1;

    if (isCorrect) {
      player.hasGuessedCorrectly = true;
      player.score  += 10;
      session.winnerId = playerId;
      session.status   = "ended";
      return { correct: true, player, session, attemptsLeft: player.attempts };
    }
    return { correct: false, player, attemptsLeft: player.attempts, outOfAttempts: player.attempts === 0 };
  },

  expireSession(code) {
    const session = sessions.get(code);
    if (!session) return null;
    session.status   = "ended";
    session.winnerId = null;
    if (session.timer) { clearInterval(session.timer); session.timer = null; }
    return session;
  },

  rotateMaster(code) {
    const session = sessions.get(code);
    if (!session) return null;
    const arr = Array.from(session.players.values());
    const idx = arr.findIndex((p) => p.id === session.masterId);
    const next = arr[(idx + 1) % arr.length];
    arr.forEach((p) => (p.isMaster = false));
    next.isMaster     = true;
    session.masterId  = next.id;
    session.masterName = next.name;
    session.status    = "waiting";
    session.question  = null;
    session.answer    = null;
    session.winnerId  = null;
    session.timeLeft  = 60;
    return session;
  },

  deleteSession(code) {
    const session = sessions.get(code);
    if (session?.timer) clearInterval(session.timer);
    sessions.delete(code);
  },

  serializeSession(session) {
    return {
      code:        session.code,
      masterId:    session.masterId,
      masterName:  session.masterName,
      players:     Array.from(session.players.values()),
      question:    session.question,
      status:      session.status,
      winnerId:    session.winnerId,
      timeLeft:    session.timeLeft,
    };
  },
};

