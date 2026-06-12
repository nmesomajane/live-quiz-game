/**
 * INDEX.JS — Server Entry Point
 *
 * Wires everything together:
 *   1. Express HTTP server  (REST health check)
 *   2. Socket.io            (real-time WebSocket game events)
 *   3. CORS                 (allows the React client to connect)
 *   4. Handler registration (one per connected socket)
 *
 * WHY BOTH EXPRESS AND SOCKET.IO ON THE SAME PORT?
 * Socket.io attaches to the underlying Node http.Server that Express uses.
 * They share port 4000 — no need to run two separate servers.
 *
 * CONNECTION LIFECYCLE:
 *
 *   Client connects  ──▶  "connection" fires  ──▶  handlers registered
 *                              │
 *                         events flow back and forth
 *                              │
 *   Client closes    ──▶  "disconnect" fires  ──▶  player removed
 */

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import { sessionHandler } from "./handlers/sessionHandler.js";
import { gameHandler }    from "./handlers/gameHandler.js";
import { playerHandler }  from "./handlers/playerHandler.js";



const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));


app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// HTTP + SOCKET.IO 

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

//  SOCKET CONNECTION 

io.on("connection", (socket) => {
  console.log(`[CONNECT] ${socket.id}`);

  // Register all event listeners for this socket
  sessionHandler(io, socket);   // create-session, join-session, leave-session
  gameHandler(io, socket);      // set-question, start-game, submit-guess
  playerHandler(io, socket);    // disconnect, ping-session
});



const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`

  LIVE QUIZ GAME SERVER IS RUNNING!    
  `);
});


const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down`);
  httpServer.close(() => process.exit(0));
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));