import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import { sessionHandler } from "./handlers/sessionHandler.js";
import { gameHandler }    from "./handlers/gamehandler.js";
import { playerHandler }  from "./handlers/playerHandler.js";



const app = express();

app.use(express.json());
const allowedOrigins = [
  process.env.CLIENT_URL,
  /https:\/\/live-quiz-game.*\.vercel\.app$/,  // matches ALL vercel preview URLs
  "http://localhost:3001",
  "http://localhost:5173",
].filter(Boolean);
 
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
}));


app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// HTTP + SOCKET.IO 

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
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