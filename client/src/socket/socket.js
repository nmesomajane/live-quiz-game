import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

const socket = io(SERVER_URL, {
  autoConnect:   false,  // connect manually in Home.jsx
  reconnection:  false,  // never auto-reconnect mid-session
});

if (import.meta.env.DEV) {
  socket.onAny((event, ...args) => {
    console.log(`[SOCKET ←]  ${event}`, args);
  });
  socket.onAnyOutgoing((event, ...args) => {
    console.log(`[SOCKET →] ${event}`, args);
  });
}

export default socket;