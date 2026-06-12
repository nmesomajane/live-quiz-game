

import { handlePlayerLeave } from "./sessionHandler.js";

export function playerHandler(io, socket) {

  /**
   * EVENT: "disconnect"
   * Automatically fired by Socket.io — not emitted by the client.
   */
  socket.on("disconnect", (reason) => {
    console.log(
      `[DISCONNECT] Socket ${socket.id} (${socket.playerName || "unknown"}) — reason: ${reason}`
    );

    // Reuse the same leave logic as the voluntary "leave-session" event
    handlePlayerLeave(io, socket);
  });



  socket.on("ping-session", ({ code }, callback) => {
    import("../store/sessionStore.js").then(({ default: sessionStore }) => {
      const session = sessionStore.getSession(code);
      if (session) {
        callback({ alive: true, session: sessionStore.serializeSession(session) });
      } else {
        callback({ alive: false });
      }
    });
  });
}