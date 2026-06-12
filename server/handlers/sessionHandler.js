

import {sessionStore} from "../store/sessionStore.js";
import { generateUniqueCode } from "../utils/generateCode.js";

export function sessionHandler(io, socket) {

  
  socket.on("create-session", ({ playerName }, callback) => {
    try {
      if (!playerName || playerName.trim().length < 2)
        return callback({ success: false, error: "Name must be at least 2 characters" });

      if (playerName.trim().length > 20)
        return callback({ success: false, error: "Name must be under 20 characters" });

      const code = generateUniqueCode(sessionStore);
      const session = sessionStore.createSession(code, socket.id, playerName.trim());

      // Join the Socket.io room so this socket receives room broadcasts
      socket.join(code);

      // Store session info on the socket for use in disconnect handler
      socket.sessionCode = code;
      socket.playerName = playerName.trim();

      console.log(`[CREATE] ${playerName} created session ${code}`);

      callback({ success: true, code, session: sessionStore.serializeSession(session) });

    } catch (err) {
      console.error("[CREATE ERROR]", err);
      callback({ success: false, error: "Failed to create session" });
    }
  });


  
  socket.on("join-session", ({ code, playerName }, callback) => {
    try {
      if (!code || !playerName)
        return callback({ success: false, error: "Code and name are required" });

      const upperCode = code.toUpperCase().trim();
      const session = sessionStore.getSession(upperCode);

      if (!session)
        return callback({ success: false, error: "Session not found. Check your code." });

      // Requirement #7b: block joining a game in progress
      if (session.status === "active")
        return callback({ success: false, error: "Game is already in progress" });

      if (session.status === "ended")
        return callback({ success: false, error: "This session has ended" });

      // Prevent duplicate names within a session
      const takenNames = Array.from(session.players.values()).map((p) =>
        p.name.toLowerCase()
      );
      if (takenNames.includes(playerName.trim().toLowerCase()))
        return callback({ success: false, error: "That name is already taken in this session" });

      const updatedSession = sessionStore.addPlayer(upperCode, socket.id, playerName.trim());

      socket.join(upperCode);
      socket.sessionCode = upperCode;
      socket.playerName = playerName.trim();

      console.log(`[JOIN] ${playerName} joined session ${upperCode}`);

      // Notify everyone in the room (including the new player)
      io.to(upperCode).emit("player-joined", {
        session: sessionStore.serializeSession(updatedSession),
        newPlayer: { name: playerName.trim(), id: socket.id },
        message: `${playerName.trim()} joined the session`,
      });

      callback({ success: true, session: sessionStore.serializeSession(updatedSession) });

    } catch (err) {
      console.error("[JOIN ERROR]", err);
      callback({ success: false, error: "Failed to join session" });
    }
  });


  /**
   * EVENT: "leave-session"
   * Fired when a player explicitly clicks Leave.
   */
  socket.on("leave-session", () => {
    handlePlayerLeave(io, socket);
  });
}



export function handlePlayerLeave(io, socket) {
  const code = socket.sessionCode;
  if (!code) return;

  const session = sessionStore.getSession(code);
  if (!session) return;

  const playerName = socket.playerName || "A player";
  const wasMaster = session.masterId === socket.id;

  const updatedSession = sessionStore.removePlayer(code, socket.id);
  socket.leave(code);
  socket.sessionCode = null;

  console.log(`[LEAVE] ${playerName} left session ${code}`);

  // Requirement #13: delete session when last player leaves
  if (updatedSession.players.size === 0) {
    console.log(`[DELETE] Session ${code} is empty, deleting`);
    sessionStore.deleteSession(code);
    return;
  }

  // If the master left, rotate to next player
  if (wasMaster) {
    sessionStore.rotateMaster(code);
    const refreshed = sessionStore.getSession(code);

    io.to(code).emit("master-changed", {
      session: sessionStore.serializeSession(refreshed),
      message: `${playerName} left. ${refreshed.masterName} is now the game master.`,
    });
    return;
  }

  io.to(code).emit("player-left", {
    session: sessionStore.serializeSession(updatedSession),
    message: `${playerName} left the session`,
  });
}