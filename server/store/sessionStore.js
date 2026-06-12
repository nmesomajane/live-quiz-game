

const sessions = new Map();

export const sessionStore = {
  createSession(code, masterId, masterName) {
    const session = {
      code,
      masterId,
      masterName,
      players: new Map(),
      question: null,
      answer: null,
      status: "waiting",
      timer: null,
      winnerId: null,
      timeLeft: 60,
    };

    session.players.set(masterId, {
      id: masterId,
      name: masterName,
      score: 0,
      attempts: 3,
      hasGuessedCorrectly: false,
      isMaster: true,
    });

    sessions.set(code, session);
    return session;
  },

  getSession(code) {
    return sessions.get(code);
  },

  addPlayer(code, playerId, playerName) {
    const session = sessions.get(code);
    if (!session) return null;

    session.players.set(playerId, {
      id: playerId,
      name: playerName,
      score: 0,
      attempts: 3,
      hasGuessedCorrectly: false,
      isMaster: false,
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
    session.answer = answer.toLowerCase().trim();
    return session;
  },

  startGame(code) {
    const session = sessions.get(code);
    if (!session) return null;

    session.status = "active";
    session.timeLeft = 60;
    session.winnerId = null;

    session.players.forEach((player) => {
      player.attempts = 3;
      player.hasGuessedCorrectly = false;
    });

    return session;
  },

  processGuess(code, playerId, guess) {
    const session = sessions.get(code);
    if (!session) return { error: "Session not found" };

    const player = session.players.get(playerId);
    if (!player) return { error: "Player not found" };

    if (player.hasGuessedCorrectly) return { error: "You already guessed correctly" };
    if (player.attempts <= 0) return { error: "No attempts remaining" };

    const normalizedGuess = guess.toLowerCase().trim();
    const isCorrect = normalizedGuess === session.answer;

    player.attempts -= 1;

    if (isCorrect) {
      player.hasGuessedCorrectly = true;
      player.score += 10;
      session.winnerId = playerId;
      session.status = "ended";

      return { correct: true, player, session, attemptsLeft: player.attempts };
    }

    return {
      correct: false,
      player,
      attemptsLeft: player.attempts,
      outOfAttempts: player.attempts === 0,
    };
  },

  expireSession(code) {
    const session = sessions.get(code);
    if (!session) return null;

    session.status = "ended";
    session.winnerId = null;

    if (session.timer) {
      clearInterval(session.timer);
      session.timer = null;
    }

    return session;
  },

  rotateMaster(code) {
    const session = sessions.get(code);
    if (!session) return null;

    const playerArray = Array.from(session.players.values());
    const currentMasterIndex = playerArray.findIndex((p) => p.id === session.masterId);
    const nextMasterIndex = (currentMasterIndex + 1) % playerArray.length;
    const nextMaster = playerArray[nextMasterIndex];

    playerArray.forEach((p) => (p.isMaster = false));
    nextMaster.isMaster = true;

    session.masterId = nextMaster.id;
    session.masterName = nextMaster.name;
    session.status = "waiting";
    session.question = null;
    session.answer = null;
    session.winnerId = null;
    session.timeLeft = 60;

    return session;
  },

  deleteSession(code) {
    const session = sessions.get(code);
    if (session?.timer) clearInterval(session.timer);
    sessions.delete(code);
  },

  serializeSession(session) {
    return {
      code: session.code,
      masterId: session.masterId,
      masterName: session.masterName,
      players: Array.from(session.players.values()),
      question: session.question,
      status: session.status,
      winnerId: session.winnerId,
      timeLeft: session.timeLeft,
    };
  },
};

