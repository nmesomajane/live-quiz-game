
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

const socket = io(SERVER_URL, {
  autoConnect: false,       // connect manually when needed
  reconnectionAttempts: 5,  // try to reconnect up to 5 times on drop
  reconnectionDelay: 1000,  // wait 1s between reconnection attempts
});

// Dev-only logging — remove in production
if (import.meta.env.DEV) {
  socket.onAny((event, ...args) => {
    console.log(`[SOCKET IN]  ${event}`, args);
  });
  socket.onAnyOutgoing((event, ...args) => {
    console.log(`[SOCKET OUT] ${event}`, args);
  });
}

export default socket;